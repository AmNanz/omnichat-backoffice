import { EntityStatus } from './common.model';

export interface Role {
  _id: string;
  name: string;
  slug?: string;
  permissions: string[];
  status: EntityStatus;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type RolePayload = Partial<Omit<Role, '_id' | 'createdAt' | 'updatedAt'>> & {
  name?: string;
  permissions?: string[];
};
