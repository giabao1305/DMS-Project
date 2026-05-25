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

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import type { UserDocument } from '../users/schemas/user.schema';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteStatusDto } from './dto/update-route-status.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RoutesService } from './routes.service';

@Controller('routes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(
    @Body() createRouteDto: CreateRouteDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.routesService.create(createRouteDto, user._id.toString());
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.routesService.findAll(query);
  }

  @Roles(UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get('my-routes')
  findMyRoutes(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationQueryDto,
  ) {
    return this.routesService.findMyRoutes(
      user._id.toString(),
      user.role,
      query,
    );
  }

  @Roles(UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get('today')
  findToday(@CurrentUser() user: UserDocument) {
    return this.routesService.findToday(user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.routesService.findById(id, user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routesService.update(id, updateRouteDto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateRouteStatusDto: UpdateRouteStatusDto,
  ) {
    return this.routesService.updateStatus(id, updateRouteStatusDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routesService.remove(id);
  }
}
