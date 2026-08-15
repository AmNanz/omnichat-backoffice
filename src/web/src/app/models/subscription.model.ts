import { EntityStatus } from './common.model';

export interface Subscription {
  _id: string;
  profileId: string;
  companyId?: string | null;
  packageId: string;
  startDate?: string | Date | null;
  expirationDate?: string | Date | null;
  status: EntityStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type SubscriptionPayload = Partial<
  Omit<Subscription, '_id' | 'createdAt' | 'updatedAt'>
> & {
  profileId?: string;
  packageId?: string;
};
