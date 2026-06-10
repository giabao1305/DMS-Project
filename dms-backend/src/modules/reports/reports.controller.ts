import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import type { UserDocument } from '../users/schemas/user.schema';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { FinancialReportQueryDto } from './dto/financial-report-query.dto';
import { ReportsService } from './reports.service';
import { UpdateKpiDto } from './dto/update-kpi.dto';
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(UserRole.ADMIN)
  @Get('sales')
  getSalesReport(@Query('month') month?: string, @Query('year') year?: string) {
    return this.reportsService.getSalesReport(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Roles(UserRole.ADMIN)
  @Get('orders')
  getOrdersReport(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.reportsService.getOrdersReport(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }
  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Patch('kpis/:id')
  updateKpi(
    @Param('id') id: string,
    @Body() updateKpiDto: UpdateKpiDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.reportsService.updateKpi(
      id,
      updateKpiDto,
      user._id.toString(),
      user.role,
    );
  }
  @Roles(UserRole.ADMIN)
  @Get('visits')
  getVisitsReport(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.reportsService.getVisitsReport(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Roles(UserRole.ADMIN)
  @Get('sellers')
  getSellersReport(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.reportsService.getSellersReport(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Get('financial')
  getFinancialReport(
    @Query() query: FinancialReportQueryDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.reportsService.getFinancialReport(
      query,
      user._id.toString(),
      user.role,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Post('kpis')
  createKpi(
    @Body() createKpiDto: CreateKpiDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.reportsService.createKpi(
      createKpiDto,
      user._id.toString(),
      user.role,
    );
  }

  @Roles(UserRole.ADMIN)
  @Get('kpis')
  findAllKpis() {
    return this.reportsService.findAllKpis();
  }

  @Roles(UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get('kpis/my-kpi')
  findMyKpis(@CurrentUser() user: UserDocument) {
    return this.reportsService.findMyKpis(user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN)
  @Get('kpis/:sellerId')
  findSellerKpis(@Param('sellerId') sellerId: string) {
    return this.reportsService.findSellerKpis(sellerId);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Patch('kpis/:id/refresh')
  refreshKpi(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.reportsService.refreshKpi(id, user._id.toString(), user.role);
  }
}
