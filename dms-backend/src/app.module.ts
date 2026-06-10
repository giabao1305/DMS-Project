import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RoutesModule } from './modules/routes/routes.module';
import { VisitsModule } from './modules/visits/visits.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { UploadModule } from './modules/upload/upload.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';

import { SocketModule } from './modules/socket/socket.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: Number(
          configService.get<string>('MONGODB_SERVER_SELECTION_TIMEOUT_MS') ??
            10_000,
        ),
        retryAttempts: Number(
          configService.get<string>('MONGODB_RETRY_ATTEMPTS') ?? 1,
        ),
      }),
    }),

    UsersModule,
    AuthModule,
    CustomersModule,
    ProductsModule,
    InventoryModule,
    PromotionsModule,
    OrdersModule,
    RoutesModule,
    VisitsModule,
    LeavesModule,
    NotificationsModule,
    DashboardModule,
    ReportsModule,
    CategoriesModule,
    UploadModule,
    AuditLogsModule,
    WarehousesModule,

    SocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
