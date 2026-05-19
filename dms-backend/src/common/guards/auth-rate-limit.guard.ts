import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private static readonly attempts = new Map<string, RateLimitEntry>();

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const now = Date.now();
    const windowMs = Number(
      this.configService.get<string>('AUTH_RATE_LIMIT_WINDOW_MS') ?? 60_000,
    );
    const maxAttempts = Number(
      this.configService.get<string>('AUTH_RATE_LIMIT_MAX') ?? 10,
    );
    const key = `${this.getClientIp(request)}:${request.path}`;
    const current = AuthRateLimitGuard.attempts.get(key);

    this.cleanup(now);

    if (!current || current.resetAt <= now) {
      AuthRateLimitGuard.attempts.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });

      return true;
    }

    if (current.count >= maxAttempts) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Try again in ${retryAfterSeconds} seconds.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
    AuthRateLimitGuard.attempts.set(key, current);

    return true;
  }

  private getClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0] ?? 'unknown';
    }

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0]?.trim() || 'unknown';
    }

    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private cleanup(now: number) {
    for (const [key, value] of AuthRateLimitGuard.attempts.entries()) {
      if (value.resetAt <= now) {
        AuthRateLimitGuard.attempts.delete(key);
      }
    }
  }
}
