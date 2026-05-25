import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  getPagination,
  getSort,
  PaginatedResult,
  shouldPaginate,
  toPaginatedResult,
} from '../../common/utils/pagination';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SocketGateway } from '../socket/socket.gateway';

type QueryFilter = Record<string, any>;

const getCategoryProductPrefix = (categoryCode: string): string =>
  `NES-${categoryCode.replace(/^NES-CAT-/, '')}-`;

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    private readonly socketGateway: SocketGateway,
  ) {}

  private emitProductRealtime(action: string, product: Product): void {
    this.socketGateway.emitToAll('product-updated', {
      action,
      product,
    });
  }

  private emitCategoryRealtime(action: string, category: Category): void {
    this.socketGateway.emitToAll('category-updated', {
      action,
      category,
    });
  }

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    if (!createCategoryDto.code) {
      throw new BadRequestException('Category code is required');
    }

    if (!createCategoryDto.name) {
      throw new BadRequestException('Category name is required');
    }

    const code = createCategoryDto.code.toUpperCase();
    const name = createCategoryDto.name.trim();

    const existingCategory = await this.categoryModel.findOne({
      $or: [{ name }, { code }],
    });

    if (existingCategory) {
      throw new BadRequestException('Category already exists');
    }

    const category = new this.categoryModel({
      ...createCategoryDto,
      code,
      name,
    });

    const savedCategory = await category.save();

    this.emitCategoryRealtime('created', savedCategory);

    return savedCategory;
  }

  async findAllCategories(): Promise<Category[]> {
    return this.categoryModel
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    if (!createProductDto.code) {
      throw new BadRequestException('Product code is required');
    }

    if (!createProductDto.category) {
      throw new BadRequestException('Category is required');
    }

    if (!Types.ObjectId.isValid(createProductDto.category)) {
      throw new BadRequestException('Invalid category id');
    }

    const code = createProductDto.code.toUpperCase();

    const existingProduct = await this.productModel.findOne({
      code,
      isDeleted: { $ne: true },
    });

    if (existingProduct) {
      throw new BadRequestException('Product code already exists');
    }

    const category = await this.categoryModel.findById(
      createProductDto.category,
    );

    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found');
    }

    if (!code.startsWith(getCategoryProductPrefix(category.code))) {
      throw new BadRequestException(
        `Product code must match ${getCategoryProductPrefix(category.code)}SKU-001 format`,
      );
    }

    const product = new this.productModel({
      ...createProductDto,
      code,
      category: new Types.ObjectId(createProductDto.category),
      unit: createProductDto.unit || 'cái',
      stock: 0,
      minStock: createProductDto.minStock || 10,
    });

    const savedProduct = await product.save();

    this.emitProductRealtime('created', savedProduct);

    return savedProduct;
  }

  private buildProductListFilter(query?: PaginationQueryDto): QueryFilter {
    const filter: QueryFilter = {
      isDeleted: { $ne: true },
    };

    if (query?.status === 'active') {
      filter.isActive = true;
    }

    if (query?.status === 'inactive') {
      filter.isActive = false;
    }

    if (query?.search) {
      const search = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: search },
        { code: search },
        { description: search },
      ];
    }

    return filter;
  }

  async findAllProducts(
    query?: PaginationQueryDto,
  ): Promise<Product[] | PaginatedResult<Product>> {
    const filter = this.buildProductListFilter(query);
    const productQuery = this.productModel
      .find(filter)
      .populate('category', 'code name description')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return productQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      productQuery.skip(skip).limit(limit).exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }

  async findLowStockProducts(): Promise<Product[]> {
    return this.productModel
      .find({
        isActive: true,
        isDeleted: { $ne: true },
        $expr: {
          $lte: ['$stock', '$minStock'],
        },
      })
      .populate('category', 'code name description')
      .sort({ stock: 1 })
      .exec();
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('category', 'code name description')
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    this.emitProductRealtime('updated', product);

    return product;
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const {
      category,
      code,
      stock: _stock,
      ...rest
    } = updateProductDto as UpdateProductDto & {
      stock?: number;
    };
    const updateData: typeof rest & {
      code?: string;
      category?: Types.ObjectId;
    } = {
      ...rest,
    };

    if (code) {
      const newCode = code.toUpperCase();

      const existingProduct = await this.productModel.findOne({
        code: newCode,
        _id: { $ne: id },
        isDeleted: { $ne: true },
      });

      if (existingProduct) {
        throw new BadRequestException('Product code already exists');
      }

      updateData.code = newCode;
    }

    const productBeforeUpdate = await this.productModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .exec();

    if (!productBeforeUpdate) {
      throw new NotFoundException('Product not found');
    }

    if (category) {
      if (!Types.ObjectId.isValid(category)) {
        throw new BadRequestException('Invalid category id');
      }

      const existingCategory = await this.categoryModel.findById(category);

      if (!existingCategory || !existingCategory.isActive) {
        throw new NotFoundException('Category not found');
      }

      updateData.category = new Types.ObjectId(category);
    }

    const categoryForCode = await this.categoryModel.findById(
      updateData.category ?? productBeforeUpdate.category,
    );

    if (!categoryForCode || !categoryForCode.isActive) {
      throw new NotFoundException('Category not found');
    }

    const productCode = updateData.code ?? productBeforeUpdate.code;

    if (
      !productCode.startsWith(getCategoryProductPrefix(categoryForCode.code))
    ) {
      throw new BadRequestException(
        `Product code must match ${getCategoryProductPrefix(categoryForCode.code)}SKU-001 format`,
      );
    }

    const product = await this.productModel
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, updateData, {
        returnDocument: 'after',
      })
      .populate('category', 'code name description')
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
  async removeProduct(id: string): Promise<{ message: string }> {
    const product = await this.productModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        { isActive: false, isDeleted: true, deletedAt: new Date() },
        { returnDocument: 'after' },
      )
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    this.emitProductRealtime('deleted', product);

    return {
      message: 'Product deleted successfully',
    };
  }
  async toggleProductStatus(id: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.isActive = !product.isActive;

    const savedProduct = await product.save();

    this.emitProductRealtime('status-toggled', savedProduct);

    return savedProduct;
  }
}
