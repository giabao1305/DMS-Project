import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Route, RouteSchema } from '../routes/schemas/route.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

import { RoutesModule } from '../routes/routes.module';

import { NotificationsModule } from '../notifications/notifications.module';

import { Visit, VisitSchema } from './schemas/visit.schema';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';

@Module({
  imports: [
    RoutesModule,
    NotificationsModule,

    MongooseModule.forFeature([
      { name: Visit.name, schema: VisitSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Route.name, schema: RouteSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],

  controllers: [VisitsController],

  providers: [VisitsService],

  exports: [VisitsService],
})
export class VisitsModule {}
