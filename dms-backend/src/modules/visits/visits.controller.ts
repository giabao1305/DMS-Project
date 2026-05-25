import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import type { UserDocument } from '../users/schemas/user.schema';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { VisitsService } from './visits.service';

@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Roles(UserRole.SELLER)
  @Post('check-in')
  checkIn(@Body() checkInDto: CheckInDto, @CurrentUser() user: UserDocument) {
    return this.visitsService.checkIn(checkInDto, user._id.toString());
  }

  @Roles(UserRole.SELLER)
  @Patch(':id/check-out')
  checkOut(
    @Param('id') id: string,
    @Body() checkOutDto: CheckOutDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.visitsService.checkOut(id, checkOutDto, user._id.toString());
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.visitsService.findAll(query);
  }

  @Roles(UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get('my-visits')
  findMyVisits(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationQueryDto,
  ) {
    return this.visitsService.findMyVisits(
      user._id.toString(),
      user.role,
      query,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.visitsService.findById(id, user._id.toString(), user.role);
  }
}
