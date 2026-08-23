import { EntityStatus } from './common.model';

export interface Company {
  _id: string;
  profileId: string;
  name: string;
  slug: string;
  packageId?: string | null;
  status: EntityStatus;
  startDate?: string | Date | null;
  expirationDate?: string | Date | null;
  omnichatCompanyId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CompanyPayload = Partial<
  Omit<Company, '_id' | 'createdAt' | 'updatedAt'>
> & {
  profileId?: string;
  name?: string;
};
