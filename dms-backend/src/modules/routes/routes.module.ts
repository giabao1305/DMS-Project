import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Route, RouteSchema } from './schemas/route.schema';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { NotificationsModule } from '../notifications/notifications.module';
@Module({
  imports: [
    NotificationsModule,

    MongooseModule.forFeature([
      { name: Route.name, schema: RouteSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}
