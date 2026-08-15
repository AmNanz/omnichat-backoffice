import { EntityStatus } from './common.model';

export interface Profile {
  _id: string;
  name: string;
  code: string;
  packageId?: string | null;
  companyLimit: number;
  userLimit: number;
  startDate?: string | Date | null;
  expirationDate?: string | Date | null;
  status: EntityStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type ProfilePayload = Partial<
  Omit<Profile, '_id' | 'createdAt' | 'updatedAt'>
> & {
  name?: string;
  packageId?: string | null;
};
