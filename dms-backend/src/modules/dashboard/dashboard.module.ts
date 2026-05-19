import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import {
  LeaveRequest,
  LeaveRequestSchema,
} from '../leaves/schemas/leave-request.schema';
import {
  Notification,
  NotificationSchema,
} from '../notifications/schemas/notification.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Route, RouteSchema } from '../routes/schemas/route.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Visit, VisitSchema } from '../visits/schemas/visit.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Visit.name, schema: VisitSchema },
      { name: Route.name, schema: RouteSchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
