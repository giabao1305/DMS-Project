import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { Category, CategoryDocument } from './schemas/category.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,

    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,

    private readonly socketGateway: SocketGateway,
  ) {}

  private emitCategoryRealtime(action: string, category: Category): void {
    this.socketGateway.emitToAll('category-updated', {
      action,
      category,
    });
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const code = createCategoryDto.code.toUpperCase();

    const existedCategory = await this.categoryModel.findOne({
      $or: [{ name: createCategoryDto.name }, { code }],
    });

    if (existedCategory) {
      throw new BadRequestException('Category already exists');
    }

    const category = await this.categoryModel.create({
      ...createCategoryDto,
      code,
    });

    this.emitCategoryRealtime('created', category);

    return category;
  }

  async findAll() {
    return this.categoryModel.find({ isActive: true }).sort({ createdAt: -1 });
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Category not found');
    }

    const category = await this.categoryModel.findOne({
      _id: new Types.ObjectId(id),
      isActive: true,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    this.emitCategoryRealtime('updated', category);

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Category not found');
    }

    const updateData = { ...updateCategoryDto };

    if (updateCategoryDto.code) {
      const code = updateCategoryDto.code.toUpperCase();
      const existedCategory = await this.categoryModel.findOne({
        code,
        _id: { $ne: id },
      });

      if (existedCategory) {
        throw new BadRequestException('Category code already exists');
      }

      updateData.code = code;
    }

    if (updateCategoryDto.name) {
      const existedCategory = await this.categoryModel.findOne({
        name: updateCategoryDto.name,
        _id: { $ne: id },
      });

      if (existedCategory) {
        throw new BadRequestException('Category already exists');
      }
    }

    const category = await this.categoryModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        isActive: true,
      },
      updateData,
      { returnDocument: 'after' },
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    this.emitCategoryRealtime('updated', category);

    return category;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Category not found');
    }

    const activeProductCount = await this.productModel.countDocuments({
      category: new Types.ObjectId(id),
      isDeleted: { $ne: true },
    });

    if (activeProductCount > 0) {
      throw new BadRequestException(
        'Cannot delete category while it still has products',
      );
    }

    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { returnDocument: 'after' },
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    this.emitCategoryRealtime('deleted', category);

    return {
      message: 'Category deactivated successfully',
    };
  }
}
