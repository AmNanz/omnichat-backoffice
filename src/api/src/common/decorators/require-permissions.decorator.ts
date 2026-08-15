import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'required_permissions';

export type RequiredPermissionsMeta = {
  permissions: string[];
  mode: 'all' | 'any';
};

export const RequirePermissions = (
  ...permissions: string[]
): ReturnType<typeof SetMetadata> =>
  SetMetadata(PERMISSIONS_KEY, {
    permissions,
    mode: 'all',
  } satisfies RequiredPermissionsMeta);

export const RequireAnyPermission = (
  ...permissions: string[]
): ReturnType<typeof SetMetadata> =>
  SetMetadata(PERMISSIONS_KEY, {
    permissions,
    mode: 'any',
  } satisfies RequiredPermissionsMeta);
