import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Category, CategoryDocument } from './schemas/category.schema';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,

    private readonly socketGateway: SocketGateway,
  ) {}

  private emitCategoryRealtime(action: string, category: Category): void {
    this.socketGateway.emitToAll('category-updated', {
      action,
      category,
    });
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const existedCategory = await this.categoryModel.findOne({
      name: createCategoryDto.name,
    });

    if (existedCategory) {
      throw new BadRequestException('Category already exists');
    }

    const category = await this.categoryModel.create(createCategoryDto);

    this.emitCategoryRealtime('created', category);

    return category;
  }

  async findAll() {
    return this.categoryModel.find().sort({ createdAt: -1 });
  }

  async findById(id: string) {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    this.emitCategoryRealtime('updated', category);

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      updateCategoryDto,
      {
        new: true,
      },
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async remove(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    this.emitCategoryRealtime('deleted', category);

    return {
      message: 'Delete category successfully',
    };
  }
}
