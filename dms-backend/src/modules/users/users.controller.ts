import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './schemas/user.schema';
import type { UserDocument } from './schemas/user.schema';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Post('sellers')
  createSeller(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: UserDocument,
  ) {
    if (user.role === UserRole.DISTRIBUTOR) {
      return this.usersService.createSellerForDistributor(
        createUserDto,
        user._id.toString(),
      );
    }

    return this.usersService.create({
      ...createUserDto,
      role: UserRole.SELLER,
    });
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Get('sellers')
  findSellers(@CurrentUser() user: UserDocument) {
    return this.usersService.findSellersForUser(user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.usersService.findByIdForUser(
      id,
      user._id.toString(),
      user.role,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.usersService.updateForUser(
      id,
      updateUserDto,
      user._id.toString(),
      user.role,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Patch(':id/status')
  toggleStatus(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.usersService.toggleStatusForUser(
      id,
      user._id.toString(),
      user.role,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
