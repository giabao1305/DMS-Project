import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthRateLimitGuard } from '../../common/guards/auth-rate-limit.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { UserDocument } from '../users/schemas/user.schema';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthRateLimitGuard)
  @Post('login')
  login(@Body() loginDto: LoginDto, @Req() request: Request) {
    return this.authService.login(loginDto, request);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: UserDocument) {
    return this.authService.me(user._id.toString());
  }

  @UseGuards(AuthRateLimitGuard)
  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto, @Req() request: Request) {
    return this.authService.refresh(refreshTokenDto.refreshToken, request);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: UserDocument, @Req() request: Request) {
    return this.authService.logout(user, request);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(
    @CurrentUser() user: UserDocument,
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() request: Request,
  ) {
    return this.authService.changePassword(
      user._id.toString(),
      changePasswordDto,
      user,
      request,
    );
  }

  @UseGuards(AuthRateLimitGuard)
  @Post('forgot-password')
  forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() request: Request,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto, request);
  }

  @UseGuards(AuthRateLimitGuard)
  @Post('reset-password')
  resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() request: Request,
  ) {
    return this.authService.resetPassword(resetPasswordDto, request);
  }
}
