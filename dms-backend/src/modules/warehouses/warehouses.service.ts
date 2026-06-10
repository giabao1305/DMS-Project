import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';

import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { InitializeWarehouseStockDto } from './dto/initialize-warehouse-stock.dto';
import { UpdateWarehouseSellingPriceDto } from './dto/update-warehouse-selling-price.dto';
import { UpdateWarehouseStatusDto } from './dto/update-warehouse-status.dto';
import {
  Warehouse,
  WarehouseDocument,
  WarehouseType,
} from './schemas/warehouse.schema';
import {
  WarehouseStock,
  WarehouseStockDocument,
} from './schemas/warehouse-stock.schema';

type WarehouseFilter = {
  _id?: Types.ObjectId;
  type?: WarehouseType;
  distributor?: Types.ObjectId;
};

@Injectable()
export class WarehousesService {
  constructor(
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,

    @InjectModel(WarehouseStock.name)
    private readonly warehouseStockModel: Model<WarehouseStockDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(createWarehouseDto: CreateWarehouseDto): Promise<Warehouse> {
    const code = createWarehouseDto.code.trim().toUpperCase();
    let distributor: Types.ObjectId | undefined;

    if (createWarehouseDto.type === WarehouseType.DISTRIBUTOR) {
      if (!createWarehouseDto.distributor) {
        throw new BadRequestException(
          'Distributor warehouse must belong to a distributor',
        );
      }

      const owner = await this.userModel
        .findOne({
          _id: new Types.ObjectId(createWarehouseDto.distributor),
          role: UserRole.DISTRIBUTOR,
          isActive: true,
        })
        .select('_id')
        .exec();

      if (!owner) {
        throw new NotFoundException('Distributor not found');
      }

      distributor = owner._id;
    } else if (createWarehouseDto.distributor) {
      throw new BadRequestException(
        'Manufacturer warehouse cannot belong to a distributor',
      );
    }

    const existingCode = await this.warehouseModel.findOne({ code }).exec();

    if (existingCode) {
      throw new BadRequestException('Warehouse code already exists');
    }

    if (distributor) {
      const existingDistributorWarehouse = await this.warehouseModel
        .findOne({
          type: WarehouseType.DISTRIBUTOR,
          distributor,
        })
        .exec();

      if (existingDistributorWarehouse) {
        throw new BadRequestException('Distributor already has a warehouse');
      }
    }

    const warehouse = new this.warehouseModel({
      ...createWarehouseDto,
      code,
      distributor,
    });

    return warehouse.save();
  }

  async findAll(userId: string, role: UserRole): Promise<Warehouse[]> {
    const filter = await this.buildAccessFilter(userId, role);

    return this.warehouseModel
      .find(filter)
      .populate('distributor', 'code fullName companyName email phone address')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findStocks(
    warehouseId: string,
    userId: string,
    role: UserRole,
  ): Promise<WarehouseStock[]> {
    const warehouse = await this.findAccessibleWarehouse(
      warehouseId,
      userId,
      role,
    );

    return this.warehouseStockModel
      .find({ warehouse: warehouse._id })
      .populate('warehouse', 'name code type distributor')
      .populate('product', 'name code price unit minStock isActive image')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findSellerStocks(
    sellerId: string,
    userId: string,
    role: UserRole,
  ): Promise<WarehouseStock[]> {
    if (!Types.ObjectId.isValid(sellerId)) {
      throw new NotFoundException('Seller not found');
    }

    if (role === UserRole.SELLER && sellerId !== userId) {
      throw new ForbiddenException('You cannot access this seller warehouse');
    }

    if (role === UserRole.DISTRIBUTOR) {
      const seller = await this.userModel
        .findOne({
          _id: new Types.ObjectId(sellerId),
          role: UserRole.SELLER,
          isActive: true,
          $or: [{ manager: new Types.ObjectId(userId) }, { manager: userId }],
        })
        .select('_id')
        .exec();

      if (!seller) {
        throw new ForbiddenException(
          'Seller is not managed by this distributor',
        );
      }
    }

    const warehouse = await this.findSellerWarehouse(sellerId);

    return this.warehouseStockModel
      .find({ warehouse: warehouse._id })
      .populate('warehouse', 'name code type distributor')
      .populate('product', 'name code price unit minStock isActive image')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async initializeStock(
    warehouseId: string,
    initializeWarehouseStockDto: InitializeWarehouseStockDto,
  ): Promise<WarehouseStock> {
    const warehouse = await this.warehouseModel.findById(warehouseId).exec();

    if (!warehouse || !warehouse.isActive) {
      throw new NotFoundException('Warehouse not found');
    }

    const product = await this.productModel
      .findOne({
        _id: new Types.ObjectId(initializeWarehouseStockDto.product),
        isDeleted: { $ne: true },
      })
      .select('_id')
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingStock = await this.warehouseStockModel
      .findOne({
        warehouse: warehouse._id,
        product: product._id,
      })
      .exec();

    if (existingStock) {
      throw new BadRequestException('Warehouse stock is already initialized');
    }

    const stock = new this.warehouseStockModel({
      warehouse: warehouse._id,
      product: product._id,
      quantity: initializeWarehouseStockDto.quantity,
      averageCost: initializeWarehouseStockDto.averageCost,
      sellingPrice:
        initializeWarehouseStockDto.sellingPrice ??
        initializeWarehouseStockDto.averageCost,
    });

    const savedStock = await stock.save();

    return savedStock.populate([
      { path: 'warehouse', select: 'name code type distributor' },
      {
        path: 'product',
        select: 'name code price unit minStock isActive image',
      },
    ]);
  }

  async findDistributorWarehouse(
    distributorId: string,
  ): Promise<WarehouseDocument> {
    const warehouse = await this.warehouseModel
      .findOne({
        type: WarehouseType.DISTRIBUTOR,
        distributor: new Types.ObjectId(distributorId),
        isActive: true,
      })
      .exec();

    if (!warehouse) {
      throw new BadRequestException(
        'Distributor must have an active warehouse before receiving stock',
      );
    }

    return warehouse;
  }

  async receiveSupplyOrder(
    warehouseId: string,
    items: {
      product: Types.ObjectId;
      quantity: number;
      price: number;
      sellingPrice?: number;
    }[],
    session?: ClientSession,
  ): Promise<void> {
    for (const item of items) {
      const stock = await this.warehouseStockModel
        .findOne({
          warehouse: new Types.ObjectId(warehouseId),
          product: item.product,
        })
        .session(session ?? null)
        .exec();

      if (!stock) {
        await this.warehouseStockModel.create(
          [
            {
              warehouse: new Types.ObjectId(warehouseId),
              product: item.product,
              quantity: item.quantity,
              averageCost: item.price,
              sellingPrice: item.sellingPrice ?? item.price,
            },
          ],
          { session },
        );
        continue;
      }

      const quantity = stock.quantity + item.quantity;
      const totalCost =
        stock.quantity * stock.averageCost + item.quantity * item.price;

      stock.quantity = quantity;
      stock.averageCost = quantity > 0 ? totalCost / quantity : item.price;
      await stock.save({ session });
    }
  }

  async updateSellingPrice(
    warehouseId: string,
    stockId: string,
    dto: UpdateWarehouseSellingPriceDto,
    userId: string,
    role: UserRole,
  ): Promise<WarehouseStock> {
    const warehouse = await this.findAccessibleWarehouse(
      warehouseId,
      userId,
      role,
    );

    if (!warehouse.isActive) {
      throw new BadRequestException('Cannot update an inactive warehouse');
    }

    const stock = await this.warehouseStockModel
      .findOne({
        _id: new Types.ObjectId(stockId),
        warehouse: warehouse._id,
      })
      .exec();

    if (!stock) {
      throw new NotFoundException('Warehouse stock not found');
    }

    stock.sellingPrice = dto.sellingPrice;
    const savedStock = await stock.save();

    return savedStock.populate([
      { path: 'warehouse', select: 'name code type distributor' },
      {
        path: 'product',
        select: 'name code price unit minStock isActive image',
      },
    ]);
  }

  async updateStatus(
    warehouseId: string,
    dto: UpdateWarehouseStatusDto,
  ): Promise<Warehouse> {
    if (!Types.ObjectId.isValid(warehouseId)) {
      throw new NotFoundException('Warehouse not found');
    }

    const warehouse = await this.warehouseModel
      .findOne({
        _id: new Types.ObjectId(warehouseId),
        type: WarehouseType.DISTRIBUTOR,
      })
      .exec();

    if (!warehouse) {
      throw new NotFoundException('Distributor warehouse not found');
    }

    warehouse.isActive = dto.isActive;
    return warehouse.save();
  }

  async findSellerWarehouse(sellerId: string): Promise<WarehouseDocument> {
    const seller = await this.userModel
      .findOne({
        _id: new Types.ObjectId(sellerId),
        role: UserRole.SELLER,
        isActive: true,
      })
      .select('manager')
      .exec();

    if (!seller?.manager) {
      throw new BadRequestException(
        'Seller must belong to a distributor with an active warehouse',
      );
    }

    return this.findDistributorWarehouse(seller.manager.toString());
  }

  async findProductStock(
    warehouseId: string,
    productId: string,
  ): Promise<WarehouseStockDocument> {
    const stock = await this.warehouseStockModel
      .findOne({
        warehouse: new Types.ObjectId(warehouseId),
        product: new Types.ObjectId(productId),
      })
      .exec();

    if (!stock) {
      throw new BadRequestException(
        'Product is not stocked in distributor warehouse',
      );
    }

    return stock;
  }

  async decreaseStoreOrderStock(
    warehouseId: string,
    productId: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<number> {
    const stock = await this.warehouseStockModel
      .findOneAndUpdate(
        {
          warehouse: new Types.ObjectId(warehouseId),
          product: new Types.ObjectId(productId),
          quantity: { $gte: quantity },
        },
        { $inc: { quantity: -quantity } },
        { returnDocument: 'after', session },
      )
      .exec();

    if (!stock) {
      throw new BadRequestException(
        'Not enough stock in distributor warehouse',
      );
    }

    return stock.quantity;
  }

  async increaseStoreOrderStock(
    warehouseId: string,
    productId: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<number> {
    const stock = await this.warehouseStockModel
      .findOneAndUpdate(
        {
          warehouse: new Types.ObjectId(warehouseId),
          product: new Types.ObjectId(productId),
        },
        { $inc: { quantity } },
        { returnDocument: 'after', session },
      )
      .exec();

    if (!stock) {
      throw new BadRequestException('Distributor warehouse stock not found');
    }

    return stock.quantity;
  }

  private async buildAccessFilter(
    userId: string,
    role: UserRole,
  ): Promise<WarehouseFilter> {
    if (role === UserRole.ADMIN) {
      return {};
    }

    if (role === UserRole.DISTRIBUTOR) {
      return {
        type: WarehouseType.DISTRIBUTOR,
        distributor: new Types.ObjectId(userId),
      };
    }

    const seller = await this.userModel
      .findById(userId)
      .select('manager')
      .exec();

    if (!seller?.manager) {
      return {
        type: WarehouseType.DISTRIBUTOR,
        distributor: new Types.ObjectId(),
      };
    }

    return {
      type: WarehouseType.DISTRIBUTOR,
      distributor: seller.manager,
    };
  }

  private async findAccessibleWarehouse(
    warehouseId: string,
    userId: string,
    role: UserRole,
  ): Promise<WarehouseDocument> {
    if (!Types.ObjectId.isValid(warehouseId)) {
      throw new NotFoundException('Warehouse not found');
    }

    const accessFilter = await this.buildAccessFilter(userId, role);
    const warehouse = await this.warehouseModel
      .findOne({
        ...accessFilter,
        _id: new Types.ObjectId(warehouseId),
      })
      .exec();

    if (!warehouse) {
      if (role === UserRole.ADMIN) {
        throw new NotFoundException('Warehouse not found');
      }

      throw new ForbiddenException('You cannot access this warehouse');
    }

    return warehouse;
  }
}
