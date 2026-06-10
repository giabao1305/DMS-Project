import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Product, ProductSchema } from '../products/schemas/product.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  WarehouseStock,
  WarehouseStockSchema,
} from './schemas/warehouse-stock.schema';
import { Warehouse, WarehouseSchema } from './schemas/warehouse.schema';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Warehouse.name,
        schema: WarehouseSchema,
      },
      {
        name: WarehouseStock.name,
        schema: WarehouseStockSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
