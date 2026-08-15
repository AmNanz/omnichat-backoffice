import { PermissionAction } from '../enums/permission-action.enum';

export const PERMISSION_MODULES = [
  'profile',
  'company',
  'user',
  'role',
  'permission',
  'package',
  'subscription',
  'usage',
  'invoice',
  'notification',
  'audit_log',
  'dashboard',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

const ACTIONS = Object.values(PermissionAction).map((action) =>
  action.toLowerCase(),
);

export const ALL_PERMISSIONS: string[] = PERMISSION_MODULES.flatMap((module) =>
  ACTIONS.map((action) => `${module}.${action}`),
);

export const PERMISSION_CATALOG = PERMISSION_MODULES.map((module) => ({
  module,
  actions: ACTIONS,
  permissions: ACTIONS.map((action) => `${module}.${action}`),
}));

export function hasPermission(
  userPermissions: string[] | undefined | null,
  required: string,
): boolean {
  if (!userPermissions?.length) {
    return false;
  }
  return userPermissions.includes(required) || userPermissions.includes('*');
}
