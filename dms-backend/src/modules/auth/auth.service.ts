import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Request } from 'express';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditLogsService: AuditLogsService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, request?: Request) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      await this.writeAuthAudit({
        action: 'login_failed',
        targetLabel: loginDto.email,
        description: 'Login failed: invalid credentials',
        request,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      await this.writeAuthAudit({
        actor: user,
        action: 'login_failed',
        targetLabel: user.email,
        description: 'Login failed: account is inactive',
        request,
      });

      throw new UnauthorizedException('Account is inactive');
    }

    if (this.isAccountLocked(user)) {
      await this.writeAuthAudit({
        actor: user,
        action: 'login_blocked',
        targetLabel: user.email,
        description: 'Login blocked: account is temporarily locked',
        metadata: {
          lockUntil: user.lockUntil,
        },
        request,
      });

      throw new UnauthorizedException('Account is temporarily locked');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      const updatedUser = await this.usersService.recordFailedLogin(
        user,
        this.getMaxFailedLoginAttempts(),
        this.getLoginLockMinutes(),
      );
      const isNowLocked = this.isAccountLocked(updatedUser);

      await this.writeAuthAudit({
        actor: user,
        action: isNowLocked ? 'account_locked' : 'login_failed',
        targetLabel: user.email,
        description: isNowLocked
          ? 'Account locked after too many failed login attempts'
          : 'Login failed: invalid credentials',
        metadata: {
          failedLoginAttempts: updatedUser.failedLoginAttempts,
          lockUntil: updatedUser.lockUntil,
        },
        request,
      });

      throw new UnauthorizedException(
        isNowLocked ? 'Account is temporarily locked' : 'Invalid credentials',
      );
    }

    await this.usersService.markLoginSuccess(user._id.toString());

    const { accessToken, refreshToken } = await this.issueTokens(user);

    await this.writeAuthAudit({
      actor: user,
      action: 'login_success',
      targetLabel: user.email,
      description: 'Login successfully',
      request,
    });

    return {
      message: 'Login successfully',
      accessToken,
      refreshToken,
      user,
    };
  }

  async me(userId: string) {
    return this.usersService.findById(userId);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    return this.usersService.update(userId, updateProfileDto);
  }

  async refresh(refreshToken: string, request?: Request) {
    const subject = this.getRefreshTokenSubject(refreshToken);
    const user = subject
      ? await this.usersService.findByRefreshTokenSubject(subject)
      : null;

    if (!user?.refreshTokenHash) {
      await this.writeAuthAudit({
        action: 'refresh_failed',
        description: 'Refresh token failed: invalid token',
        request,
      });

      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      await this.writeAuthAudit({
        actor: user,
        action: 'refresh_failed',
        targetLabel: user.email,
        description: 'Refresh token failed: token mismatch',
        request,
      });

      throw new UnauthorizedException('Invalid refresh token');
    }

    const { accessToken, refreshToken: nextRefreshToken } =
      await this.issueTokens(user);

    await this.writeAuthAudit({
      actor: user,
      action: 'token_refreshed',
      targetLabel: user.email,
      description: 'Access token refreshed successfully',
      request,
    });

    return {
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken: nextRefreshToken,
      user,
    };
  }

  async logout(user: UserDocument, request?: Request) {
    await this.usersService.clearRefreshToken(user._id.toString());

    await this.writeAuthAudit({
      actor: user,
      action: 'logout',
      targetLabel: user.email,
      description: 'Logout successfully',
      request,
    });

    return {
      message: 'Logout successfully',
    };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    currentUser?: UserDocument,
    request?: Request,
  ) {
    const user = await this.usersService.findById(userId);

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      await this.writeAuthAudit({
        actor: currentUser ?? user,
        action: 'password_change_failed',
        targetLabel: user.email,
        description: 'Password change failed: current password is incorrect',
        request,
      });

      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.usersService.changePassword(
      userId,
      changePasswordDto.newPassword,
    );

    await this.writeAuthAudit({
      actor: currentUser ?? user,
      action: 'password_changed',
      targetLabel: user.email,
      description: 'Password changed successfully',
      request,
    });

    return {
      message: 'Password changed successfully',
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    request?: Request,
  ) {
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const hasUser = await this.usersService.setResetPasswordToken(
      forgotPasswordDto.email,
      resetToken,
      expiresAt,
    );

    await this.writeAuthAudit({
      action: 'password_reset_requested',
      targetLabel: forgotPasswordDto.email,
      description: 'Password reset requested',
      metadata: {
        hasUser,
      },
      request,
    });

    const response: {
      message: string;
      resetToken?: string;
    } = {
      message: 'If the email exists, a reset password link has been created',
    };

    if (hasUser && process.env.NODE_ENV !== 'production') {
      response.resetToken = resetToken;
    }

    return response;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, request?: Request) {
    const user = await this.usersService.findByValidResetToken(
      resetPasswordDto.token,
    );

    if (!user) {
      await this.writeAuthAudit({
        action: 'password_reset_failed',
        description: 'Password reset failed: invalid or expired token',
        request,
      });

      throw new UnauthorizedException('Invalid or expired reset token');
    }

    await this.usersService.changePassword(
      user._id.toString(),
      resetPasswordDto.password,
    );

    await this.writeAuthAudit({
      actor: user,
      action: 'password_reset_completed',
      targetLabel: user.email,
      description: 'Password reset successfully',
      request,
    });

    return {
      message: 'Password reset successfully',
    };
  }

  private async writeAuthAudit(payload: {
    actor?: UserDocument;
    action: string;
    targetLabel?: string;
    description: string;
    metadata?: Record<string, unknown>;
    request?: Request;
  }) {
    try {
      await this.auditLogsService.create({
        actor: payload.actor,
        action: payload.action,
        module: 'auth',
        targetId: payload.actor?._id.toString(),
        targetLabel: payload.targetLabel,
        description: payload.description,
        metadata: {
          ...payload.metadata,
          ip: this.getClientIp(payload.request),
          userAgent: payload.request?.headers['user-agent'],
          path: payload.request?.path,
          method: payload.request?.method,
        },
      });
    } catch {
      // Auth audit logging must never block authentication flows.
    }
  }

  private async issueTokens(user: UserDocument) {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = this.createRefreshToken(user._id.toString());
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpires = this.getRefreshTokenExpires();

    await this.usersService.setRefreshToken(
      user._id.toString(),
      refreshTokenHash,
      refreshTokenExpires,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  private signAccessToken(user: UserDocument) {
    return this.jwtService.signAsync({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });
  }

  private createRefreshToken(userId: string): string {
    return `${userId}.${randomBytes(48).toString('hex')}`;
  }

  private getRefreshTokenSubject(refreshToken: string): string | undefined {
    return refreshToken.split('.')[0];
  }

  private getRefreshTokenExpires(): Date {
    const days = Number(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN_DAYS') ?? 30,
    );

    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private isAccountLocked(user: UserDocument): boolean {
    return Boolean(user.lockUntil && user.lockUntil > new Date());
  }

  private getMaxFailedLoginAttempts(): number {
    return Number(
      this.configService.get<string>('AUTH_MAX_FAILED_LOGIN_ATTEMPTS') ?? 5,
    );
  }

  private getLoginLockMinutes(): number {
    return Number(
      this.configService.get<string>('AUTH_LOGIN_LOCK_MINUTES') ?? 15,
    );
  }

  private getClientIp(request?: Request): string | undefined {
    if (!request) return undefined;

    const forwardedFor = request.headers['x-forwarded-for'];

    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0];
    }

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0]?.trim();
    }

    return request.ip || request.socket.remoteAddress;
  }
}
