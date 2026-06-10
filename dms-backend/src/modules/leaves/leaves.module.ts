import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  LeaveRequest,
  LeaveRequestSchema,
} from './schemas/leave-request.schema';
import { Route, RouteSchema } from '../routes/schemas/route.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';

@Module({
  imports: [
    NotificationsModule,
    MongooseModule.forFeature([
      {
        name: LeaveRequest.name,
        schema: LeaveRequestSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Route.name,
        schema: RouteSchema,
      },
    ]),
  ],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
