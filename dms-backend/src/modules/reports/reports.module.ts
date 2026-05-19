import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Visit, VisitSchema } from '../visits/schemas/visit.schema';
import { Kpi, KpiSchema } from './schemas/kpi.schema';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    SocketModule,

    MongooseModule.forFeature([
      { name: Kpi.name, schema: KpiSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Visit.name, schema: VisitSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
