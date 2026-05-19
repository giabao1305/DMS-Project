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
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { RejectLeaveRequestDto } from './dto/reject-leave-request.dto';
import { LeavesService } from './leaves.service';

@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Roles(UserRole.SELLER)
  @Post()
  create(
    @Body() createLeaveRequestDto: CreateLeaveRequestDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.leavesService.create(
      createLeaveRequestDto,
      user._id.toString(),
    );
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.leavesService.findAll(query);
  }

  @Roles(UserRole.SELLER)
  @Get('my-leaves')
  findMyLeaves(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationQueryDto,
  ) {
    return this.leavesService.findMyLeaves(user._id.toString(), query);
  }

  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.leavesService.findById(id, user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.leavesService.approve(id, user._id.toString());
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() rejectLeaveRequestDto: RejectLeaveRequestDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.leavesService.reject(
      id,
      user._id.toString(),
      rejectLeaveRequestDto.adminNote,
    );
  }
}
