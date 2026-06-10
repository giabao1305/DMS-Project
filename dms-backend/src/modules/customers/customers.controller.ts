import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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

import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { RejectCustomerDto } from './dto/reject-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Roles(UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Post()
  create(
    @Body() createCustomerDto: CreateCustomerDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.customersService.create(
      createCustomerDto,
      user._id.toString(),
      user.role,
    );
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.customersService.findAll(query);
  }

  @Roles(UserRole.ADMIN)
  @Get('pending')
  findPending() {
    return this.customersService.findPending();
  }

  @Roles(UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get('my-customers')
  findMyCustomers(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationQueryDto,
  ) {
    return this.customersService.findMyCustomers(
      user._id.toString(),
      user.role,
      query,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.customersService.findById(id, user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.customersService.update(
      id,
      updateCustomerDto,
      user._id.toString(),
      user.role,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.customersService.approve(id, user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() rejectCustomerDto: RejectCustomerDto,
  ) {
    return this.customersService.reject(
      id,
      user._id.toString(),
      user.role,
      rejectCustomerDto.rejectReason,
    );
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
