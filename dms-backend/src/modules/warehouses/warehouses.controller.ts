import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import type { UserDocument } from '../users/schemas/user.schema';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { InitializeWarehouseStockDto } from './dto/initialize-warehouse-stock.dto';
import { UpdateWarehouseSellingPriceDto } from './dto/update-warehouse-selling-price.dto';
import { UpdateWarehouseStatusDto } from './dto/update-warehouse-status.dto';
import { WarehousesService } from './warehouses.service';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehousesService.create(createWarehouseDto);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get()
  findAll(@CurrentUser() user: UserDocument) {
    return this.warehousesService.findAll(user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get('seller/:sellerId/stocks')
  findSellerStocks(
    @Param('sellerId') sellerId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.warehousesService.findSellerStocks(
      sellerId,
      user._id.toString(),
      user.role,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get(':warehouseId/stocks')
  findStocks(
    @Param('warehouseId') warehouseId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.warehousesService.findStocks(
      warehouseId,
      user._id.toString(),
      user.role,
    );
  }

  @Roles(UserRole.ADMIN)
  @Post(':warehouseId/stocks')
  initializeStock(
    @Param('warehouseId') warehouseId: string,
    @Body() initializeWarehouseStockDto: InitializeWarehouseStockDto,
  ) {
    return this.warehousesService.initializeStock(
      warehouseId,
      initializeWarehouseStockDto,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Patch(':warehouseId/stocks/:stockId/selling-price')
  updateSellingPrice(
    @Param('warehouseId') warehouseId: string,
    @Param('stockId') stockId: string,
    @Body() updateWarehouseSellingPriceDto: UpdateWarehouseSellingPriceDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.warehousesService.updateSellingPrice(
      warehouseId,
      stockId,
      updateWarehouseSellingPriceDto,
      user._id.toString(),
      user.role,
    );
  }

  @Roles(UserRole.ADMIN)
  @Patch(':warehouseId/status')
  updateStatus(
    @Param('warehouseId') warehouseId: string,
    @Body() updateWarehouseStatusDto: UpdateWarehouseStatusDto,
  ) {
    return this.warehousesService.updateStatus(
      warehouseId,
      updateWarehouseStatusDto,
    );
  }
}
