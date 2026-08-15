import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthUser = {
  _id: string;
  email: string;
  displayName: string;
  profileId?: string;
  roleIds: string[];
  permissions: string[];
  companyIds: string[];
  isStaff?: boolean;
  status: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
