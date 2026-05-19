import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  InventoryTransaction,
  InventoryTransactionSchema,
} from './schemas/inventory-transaction.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,

    MongooseModule.forFeature([
      {
        name: InventoryTransaction.name,
        schema: InventoryTransactionSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
