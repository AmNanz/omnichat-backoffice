import { EntityStatus } from './common.model';

export interface User {
  _id: string;
  email: string;
  displayName: string;
  profileId?: string | null;
  roleIds?: string[];
  companyIds?: string[];
  status: EntityStatus;
  startDate?: string | Date | null;
  expirationDate?: string | Date | null;
  isStaff?: boolean;
  omnichatUserId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserCreatePayload {
  email: string;
  password: string;
  displayName: string;
  profileId?: string;
  roleIds?: string[];
  companyIds?: string[];
  status?: EntityStatus;
  startDate?: string | Date | null;
  expirationDate?: string | Date | null;
  isStaff?: boolean;
  omnichatUserId?: string;
}

export type UserUpdatePayload = Partial<Omit<UserCreatePayload, 'password'>>;
