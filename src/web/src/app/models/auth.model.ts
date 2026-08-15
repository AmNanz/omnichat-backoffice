import { EntityStatus } from './common.model';

export interface AuthUser {
  _id: string;
  email: string;
  displayName: string;
  profileId: string | null;
  roleIds: string[];
  permissions: string[];
  companyIds: string[];
  isStaff?: boolean;
  status: EntityStatus;
  startDate?: string | Date | null;
  expirationDate?: string | Date | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
