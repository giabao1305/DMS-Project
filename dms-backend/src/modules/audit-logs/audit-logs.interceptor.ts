import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';

import { UserDocument } from '../users/schemas/user.schema';
import { AuditLogsService } from './audit-logs.service';

type AuditedRequest = Request & {
  user?: UserDocument;
  params?: {
    id?: string;
    [key: string]: string | undefined;
  };
};

const ACTION_BY_METHOD: Record<string, string> = {
  POST: 'create',
  PATCH: 'update',
  PUT: 'update',
  DELETE: 'delete',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Tạo',
  update: 'Cập nhật',
  delete: 'Xóa',
};

const MODULE_LABELS: Record<string, string> = {
  categories: 'danh mục',
  customers: 'khách hàng',
  inventory: 'kho',
  kpis: 'KPI',
  leaves: 'đơn nghỉ phép',
  orders: 'đơn hàng',
  products: 'sản phẩm',
  promotions: 'khuyến mãi',
  routes: 'tuyến bán hàng',
  users: 'nhân viên',
  visits: 'lượt ghé thăm',
};

@Injectable()
export class AuditLogsInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuditedRequest>();
    const action = ACTION_BY_METHOD[request.method];

    if (!action || this.shouldSkip(request)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((response) => {
        void this.writeLog(request, action, response);
      }),
    );
  }

  private shouldSkip(request: AuditedRequest): boolean {
    const path = request.path || request.url || '';

    return (
      path.startsWith('/auth/login') ||
      path.startsWith('/auth/forgot-password') ||
      path.startsWith('/auth/reset-password') ||
      path.startsWith('/audit-logs')
    );
  }

  private async writeLog(
    request: AuditedRequest,
    action: string,
    response: unknown,
  ): Promise<void> {
    try {
      const path = request.path || request.url || '';
      const module = this.getModuleName(path);
      const responseData = this.asRecord(response);
      const targetId =
        this.valueToString(responseData?._id) ||
        this.valueToString(responseData?.id) ||
        request.params?.id;
      const targetLabel =
        this.valueToString(responseData?.name) ||
        this.valueToString(responseData?.fullName) ||
        this.valueToString(responseData?.code) ||
        this.valueToString(responseData?.title);

      await this.auditLogsService.create({
        actor: request.user,
        action,
        module,
        targetId,
        targetLabel,
        description: this.getDescription(action, module, targetLabel, targetId),
        metadata: {
          method: request.method,
          path,
          params: request.params,
        },
      });
    } catch {
      // Audit logging must not block the main business action.
    }
  }

  private getModuleName(path: string): string {
    return path.split('/').filter(Boolean)[0] || 'system';
  }

  private getDescription(
    action: string,
    module: string,
    targetLabel?: string,
    targetId?: string,
  ): string {
    const actionLabel = ACTION_LABELS[action] || action;
    const moduleLabel = MODULE_LABELS[module] || module;
    const target = targetLabel || targetId;

    return target
      ? `${actionLabel} ${moduleLabel} ${target}`
      : `${actionLabel} ${moduleLabel}`;
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    return value as Record<string, unknown>;
  }

  private valueToString(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();

    if (value && typeof value === 'object') {
      const maybeStringifiable = value as { toString?: () => string };

      if (
        typeof maybeStringifiable.toString === 'function' &&
        maybeStringifiable.toString !== Object.prototype.toString
      ) {
        return maybeStringifiable.toString();
      }
    }

    return undefined;
  }
}
