import { BillingCycle, EntityStatus } from './common.model';

export interface Package {
  _id: string;
  name: string;
  slug?: string;
  description?: string | null;
  price: number;
  billingCycle?: BillingCycle;
  companyLimit: number;
  userLimit: number;
  status: EntityStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type PackagePayload = Partial<Omit<Package, '_id' | 'createdAt' | 'updatedAt'>> & {
  name?: string;
  price?: number;
  companyLimit?: number;
  userLimit?: number;
};
