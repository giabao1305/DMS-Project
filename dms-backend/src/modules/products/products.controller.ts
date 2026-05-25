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
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles(UserRole.ADMIN)
  @Post('categories')
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.productsService.createCategory(createCategoryDto);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get('categories')
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Roles(UserRole.ADMIN)
  @Post()
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get()
  findAllProducts(@Query() query: PaginationQueryDto) {
    return this.productsService.findAllProducts(query);
  }

  @Roles(UserRole.ADMIN)
  @Get('low-stock')
  findLowStockProducts() {
    return this.productsService.findLowStockProducts();
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get(':id')
  findProductById(@Param('id') id: string) {
    return this.productsService.findProductById(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  removeProduct(@Param('id') id: string) {
    return this.productsService.removeProduct(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  toggleProductStatus(@Param('id') id: string) {
    return this.productsService.toggleProductStatus(id);
  }
}
