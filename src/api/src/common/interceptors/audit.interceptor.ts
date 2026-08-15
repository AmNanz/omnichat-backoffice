import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditAction } from '../enums/audit-action.enum';
import { AuthUser } from '../decorators/current-user.decorator';

/**
 * Lightweight audit stub. Prefer calling AuditLogsService.create() from services
 * for important mutations. This interceptor only records coarse HTTP mutations
 * when AuditLogsService is available via DI.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Optional()
    private readonly auditLogsService?: {
      create: (payload: {
        userId?: string;
        userName?: string;
        action: AuditAction;
        module: string;
        resourceId?: string;
        before?: unknown;
        after?: unknown;
        ip?: string;
        userAgent?: string;
      }) => Promise<unknown>;
    },
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      user?: AuthUser;
      ip?: string;
      headers: Record<string, string | undefined>;
    }>();

    const started = Date.now();
    return next.handle().pipe(
      tap({
        next: () => {
          void this.maybeAudit(request, context, started);
        },
      }),
    );
  }

  private async maybeAudit(
    request: {
      method: string;
      url: string;
      user?: AuthUser;
      ip?: string;
      headers: Record<string, string | undefined>;
    },
    context: ExecutionContext,
    started: number,
  ): Promise<void> {
    if (!this.auditLogsService) {
      return;
    }
    const method = request.method.toUpperCase();
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return;
    }
    try {
      await this.auditLogsService.create({
        userId: request.user?._id,
        userName: request.user?.displayName ?? request.user?.email,
        action:
          method === 'POST'
            ? AuditAction.CREATE
            : method === 'DELETE'
              ? AuditAction.DELETE
              : AuditAction.UPDATE,
        module: context.getClass().name.replace(/Controller$/, ''),
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        after: {
          method,
          url: request.url,
          durationMs: Date.now() - started,
        },
      });
    } catch {
      // Never fail the request because of audit logging
    }
  }
}
