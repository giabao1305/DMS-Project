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

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import type { UserDocument } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { RequestReturnDto } from './dto/request-return.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Post()
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.create(
      createOrderDto,
      user._id.toString(),
      user.role,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.update(
      id,
      updateOrderDto,
      user._id.toString(),
      user.role,
    );
  }
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Roles(UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get('my-orders')
  findMyOrders(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ordersService.findMyOrders(
      user._id.toString(),
      user.role,
      query,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.findById(id, user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.approve(id, user._id.toString());
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/deliver')
  deliver(@Param('id') id: string) {
    return this.ordersService.deliver(id);
  }

  @Roles(UserRole.SELLER)
  @Patch(':id/return-request')
  requestReturn(
    @Param('id') id: string,
    @Body() requestReturnDto: RequestReturnDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.requestReturn(
      id,
      requestReturnDto,
      user._id.toString(),
    );
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/return')
  returnOrder(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.returnOrder(id, user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.cancel(id, user._id.toString(), user.role);
  }
}
