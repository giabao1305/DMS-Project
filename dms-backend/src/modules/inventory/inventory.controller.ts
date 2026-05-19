import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import type { UserDocument } from '../users/schemas/user.schema';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ExportStockDto } from './dto/export-stock.dto';
import { ImportStockDto } from './dto/import-stock.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('import')
  importStock(
    @Body() importStockDto: ImportStockDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.inventoryService.importStock(
      importStockDto,
      user._id.toString(),
    );
  }

  @Post('export')
  exportStock(
    @Body() exportStockDto: ExportStockDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.inventoryService.exportStock(
      exportStockDto,
      user._id.toString(),
    );
  }

  @Post('adjust')
  adjustStock(
    @Body() adjustStockDto: AdjustStockDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.inventoryService.adjustStock(
      adjustStockDto,
      user._id.toString(),
    );
  }

  @Get('transactions')
  findAllTransactions(@Query() query: PaginationQueryDto) {
    return this.inventoryService.findAllTransactions(query);
  }

  @Get('product/:productId')
  findByProduct(
    @Param('productId') productId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.inventoryService.findByProduct(productId, query);
  }
}
