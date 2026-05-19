import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type mongoose from 'mongoose';
import { ClientSession, Model, Types } from 'mongoose';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  getPagination,
  getSort,
  PaginatedResult,
  shouldPaginate,
  toPaginatedResult,
} from '../../common/utils/pagination';
import {
  InventoryTransaction,
  InventoryTransactionDocument,
  InventoryTransactionType,
} from './schemas/inventory-transaction.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { ImportStockDto } from './dto/import-stock.dto';
import { ExportStockDto } from './dto/export-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

type InventoryWriteOptions = {
  session?: ClientSession;
  notify?: boolean;
};

type DateRangeFilter = {
  $gte?: Date;
  $lte?: Date;
};

type QueryFilter = mongoose.QueryFilter<InventoryTransactionDocument> & {
  createdAt?: DateRangeFilter;
};

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryTransaction.name)
    private readonly inventoryTransactionModel: Model<InventoryTransactionDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    private readonly notificationsService: NotificationsService,
  ) {}

  private emitStockRealtime(
    action: string,
    transaction: InventoryTransaction,
    product: ProductDocument,
  ): void {
    this.notificationsService.emitRealtime('inventory-updated', {
      action,
      transaction,
    });

    this.notificationsService.emitRealtime('stock-updated', {
      action,
      product: product._id,
      stock: product.stock,
    });

    this.notificationsService.emitRealtime('product-updated', {
      action: 'stock-changed',
      product: product._id,
      stock: product.stock,
    });
  }

  private async saveTransaction(
    data: {
      product: Types.ObjectId;
      type: InventoryTransactionType;
      quantity: number;
      beforeStock: number;
      afterStock: number;
      note?: string;
      createdBy: Types.ObjectId;
    },
    session?: ClientSession,
  ): Promise<InventoryTransactionDocument> {
    const transactions = await this.inventoryTransactionModel.create([data], {
      session,
    });

    return transactions[0];
  }

  async importStock(
    importStockDto: ImportStockDto,
    userId: string,
  ): Promise<InventoryTransaction> {
    const product = await this.productModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(importStockDto.product),
          isActive: true,
        },
        {
          $inc: {
            stock: importStockDto.quantity,
          },
        },
        {
          returnDocument: 'before',
        },
      )
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const beforeStock = product.stock;
    const afterStock = beforeStock + importStockDto.quantity;
    product.stock = afterStock;

    const savedTransaction = await this.saveTransaction({
      product: new Types.ObjectId(importStockDto.product),
      type: InventoryTransactionType.IMPORT,
      quantity: importStockDto.quantity,
      beforeStock,
      afterStock,
      note: importStockDto.note,
      createdBy: new Types.ObjectId(userId),
    });

    await this.notificationsService.createForAdmins({
      title: 'Inventory imported',
      message: `Imported ${importStockDto.quantity} items for ${product.name}`,
      type: NotificationType.INVENTORY,
      relatedId: savedTransaction._id.toString(),
    });

    this.emitStockRealtime('import', savedTransaction, product);

    return savedTransaction;
  }

  async exportStock(
    exportStockDto: ExportStockDto,
    userId: string,
  ): Promise<InventoryTransaction> {
    const product = await this.productModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(exportStockDto.product),
          isActive: true,
          stock: { $gte: exportStockDto.quantity },
        },
        {
          $inc: {
            stock: -exportStockDto.quantity,
          },
        },
        {
          returnDocument: 'before',
        },
      )
      .exec();

    if (!product) {
      const existingProduct = await this.productModel
        .findById(exportStockDto.product)
        .exec();

      if (!existingProduct || !existingProduct.isActive) {
        throw new NotFoundException('Product not found');
      }

      throw new BadRequestException('Not enough stock');
    }

    const beforeStock = product.stock;
    const afterStock = beforeStock - exportStockDto.quantity;
    product.stock = afterStock;

    const savedTransaction = await this.saveTransaction({
      product: new Types.ObjectId(exportStockDto.product),
      type: InventoryTransactionType.EXPORT,
      quantity: exportStockDto.quantity,
      beforeStock,
      afterStock,
      note: exportStockDto.note,
      createdBy: new Types.ObjectId(userId),
    });

    await this.notificationsService.createForAdmins({
      title: 'Inventory exported',
      message: `Exported ${exportStockDto.quantity} items for ${product.name}`,
      type: NotificationType.INVENTORY,
      relatedId: savedTransaction._id.toString(),
    });

    this.emitStockRealtime('export', savedTransaction, product);

    return savedTransaction;
  }

  async adjustStock(
    adjustStockDto: AdjustStockDto,
    userId: string,
  ): Promise<InventoryTransaction> {
    const product = await this.productModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(adjustStockDto.product),
          isActive: true,
        },
        {
          $set: {
            stock: adjustStockDto.newStock,
          },
        },
        {
          returnDocument: 'before',
        },
      )
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const beforeStock = product.stock;
    const afterStock = adjustStockDto.newStock;
    const quantity = Math.abs(afterStock - beforeStock);
    product.stock = afterStock;

    const savedTransaction = await this.saveTransaction({
      product: new Types.ObjectId(adjustStockDto.product),
      type: InventoryTransactionType.ADJUSTMENT,
      quantity,
      beforeStock,
      afterStock,
      note: adjustStockDto.note,
      createdBy: new Types.ObjectId(userId),
    });

    await this.notificationsService.createForAdmins({
      title: 'Inventory adjusted',
      message: `Adjusted stock for ${product.name}`,
      type: NotificationType.INVENTORY,
      relatedId: savedTransaction._id.toString(),
    });

    this.emitStockRealtime('adjustment', savedTransaction, product);

    return savedTransaction;
  }

  async decreaseStockForOrder(
    productId: string,
    quantity: number,
    userId: string,
    options: InventoryWriteOptions = {},
  ): Promise<InventoryTransaction> {
    const product = await this.productModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(productId),
          isActive: true,
          stock: { $gte: quantity },
        },
        {
          $inc: {
            stock: -quantity,
          },
        },
        {
          returnDocument: 'before',
          session: options.session,
        },
      )
      .exec();

    if (!product) {
      const existingProduct = await this.productModel
        .findById(productId)
        .session(options.session ?? null)
        .exec();

      if (!existingProduct || !existingProduct.isActive) {
        throw new NotFoundException('Product not found');
      }

      throw new BadRequestException(
        `Not enough stock for ${existingProduct.name}`,
      );
    }

    const beforeStock = product.stock;
    const afterStock = beforeStock - quantity;
    product.stock = afterStock;

    const savedTransaction = await this.saveTransaction(
      {
        product: new Types.ObjectId(productId),
        type: InventoryTransactionType.ORDER,
        quantity,
        beforeStock,
        afterStock,
        note: 'Export stock for order',
        createdBy: new Types.ObjectId(userId),
      },
      options.session,
    );

    if (options.notify ?? true) {
      await this.notificationsService.createForAdmins({
        title: 'Inventory changed',
        message: `Product ${product.name} stock was decreased by order`,
        type: NotificationType.INVENTORY,
        relatedId: savedTransaction._id.toString(),
      });

      this.emitStockRealtime('order', savedTransaction, product);
    }

    return savedTransaction;
  }

  async increaseStockForOrderReturn(
    productId: string,
    quantity: number,
    userId: string,
    options: InventoryWriteOptions = {},
  ): Promise<InventoryTransaction> {
    const product = await this.productModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(productId),
        },
        {
          $inc: {
            stock: quantity,
          },
        },
        {
          returnDocument: 'before',
          session: options.session,
        },
      )
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const beforeStock = product.stock;
    const afterStock = beforeStock + quantity;
    product.stock = afterStock;

    const savedTransaction = await this.saveTransaction(
      {
        product: new Types.ObjectId(productId),
        type: InventoryTransactionType.RETURN,
        quantity,
        beforeStock,
        afterStock,
        note: 'Return stock from order',
        createdBy: new Types.ObjectId(userId),
      },
      options.session,
    );

    if (options.notify ?? true) {
      await this.notificationsService.createForAdmins({
        title: 'Inventory returned',
        message: `Product ${product.name} stock was restored from return`,
        type: NotificationType.INVENTORY,
        relatedId: savedTransaction._id.toString(),
      });

      this.emitStockRealtime('return', savedTransaction, product);
    }

    return savedTransaction;
  }

  private buildTransactionListFilter(
    query?: PaginationQueryDto,
    baseFilter: QueryFilter = {},
  ): QueryFilter {
    const filter: QueryFilter = {
      ...baseFilter,
    };

    if (query?.status) {
      filter.type = query.status as InventoryTransactionType;
    }

    if (query?.search) {
      filter.note = new RegExp(query.search.trim(), 'i');
    }

    const createdAt: DateRangeFilter = {};

    if (query?.fromDate) {
      createdAt.$gte = new Date(query.fromDate);
    }

    if (query?.toDate) {
      createdAt.$lte = new Date(query.toDate);
    }

    if (Object.keys(createdAt).length > 0) {
      filter.createdAt = createdAt;
    }

    return filter;
  }

  async findAllTransactions(
    query?: PaginationQueryDto,
  ): Promise<InventoryTransaction[] | PaginatedResult<InventoryTransaction>> {
    const filter = this.buildTransactionListFilter(query);
    const transactionQuery = this.inventoryTransactionModel
      .find(filter)
      .populate('product', 'name code price unit stock')
      .populate('createdBy', 'fullName email role')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return transactionQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      transactionQuery.skip(skip).limit(limit).exec(),
      this.inventoryTransactionModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }

  async findByProduct(
    productId: string,
    query?: PaginationQueryDto,
  ): Promise<InventoryTransaction[] | PaginatedResult<InventoryTransaction>> {
    const filter = this.buildTransactionListFilter(query, {
      product: new Types.ObjectId(productId),
    });
    const transactionQuery = this.inventoryTransactionModel
      .find(filter)
      .populate('product', 'name code price unit stock')
      .populate('createdBy', 'fullName email role')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return transactionQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      transactionQuery.skip(skip).limit(limit).exec(),
      this.inventoryTransactionModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }
}
