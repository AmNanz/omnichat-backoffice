import { InvoiceStatus } from './common.model';

export interface Invoice {
  _id: string;
  profileId: string;
  companyId?: string | null;
  invoiceNumber?: string;
  invoiceDate?: string | Date | null;
  dueDate: string | Date;
  billingPeriod?: string | null;
  amount: number;
  vat?: number;
  totalAmount?: number;
  status: InvoiceStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type InvoicePayload = Partial<Omit<Invoice, '_id' | 'createdAt' | 'updatedAt'>> & {
  profileId?: string;
  dueDate?: string | Date;
  amount?: number;
};
