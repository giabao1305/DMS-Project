import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { Category, CategorySchema } from './schemas/category.schema';

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    SocketModule,

    MongooseModule.forFeature([
      {
        name: Category.name,
        schema: CategorySchema,
      },
    ]),
  ],

  controllers: [CategoriesController],

  providers: [CategoriesService],

  exports: [CategoriesService],
})
export class CategoriesModule {}
