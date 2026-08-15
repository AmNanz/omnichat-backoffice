import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission } from '../../../common/constants/permissions';
import { AuthUser } from '../../../common/decorators/current-user.decorator';
import {
  PERMISSIONS_KEY,
  RequiredPermissionsMeta,
} from '../../../common/decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const meta = this.reflector.getAllAndOverride<RequiredPermissionsMeta>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!meta?.permissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const permissions = user.permissions ?? [];
    const allowed =
      meta.mode === 'any'
        ? meta.permissions.some((permission) =>
            hasPermission(permissions, permission),
          )
        : meta.permissions.every((permission) =>
            hasPermission(permissions, permission),
          );

    if (!allowed) {
      throw new ForbiddenException(
        `Missing required permission(s): ${meta.permissions.join(', ')}`,
      );
    }
    return true;
  }
}
