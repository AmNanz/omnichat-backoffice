export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DELETED';

export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'ONE_TIME';

export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'DISABLE'
  | 'ENABLE'
  | 'CHANGE_ROLE'
  | 'CHANGE_PERMISSION'
  | 'CHANGE_PACKAGE'
  | 'CHANGE_LIMIT'
  | 'CREATE_INVOICE'
  | 'UPDATE_INVOICE'
  | 'CANCEL_INVOICE';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: EntityStatus | '';
  [key: string]: string | number | boolean | undefined | '';
}

export const ENTITY_STATUS_OPTIONS: { label: string; value: EntityStatus | '' }[] = [
  { label: 'ทุกสถานะ', value: '' },
  { label: 'ใช้งาน', value: 'ACTIVE' },
  { label: 'ระงับ', value: 'INACTIVE' },
  { label: 'หมดอายุ', value: 'EXPIRED' },
];

export const BILLING_CYCLE_OPTIONS: { label: string; value: BillingCycle }[] = [
  { label: 'รายเดือน', value: 'MONTHLY' },
];

export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export function statusSeverity(status: string | null | undefined): TagSeverity {
  switch (status) {
    case 'ACTIVE':
    case 'PAID':
      return 'success';
    case 'PENDING':
    case 'DRAFT':
      return 'warn';
    case 'EXPIRED':
    case 'OVERDUE':
    case 'CANCELLED':
    case 'DELETED':
      return 'danger';
    case 'INACTIVE':
    default:
      return 'secondary';
  }
}

export const INVOICE_STATUS_OPTIONS: { label: string; value: InvoiceStatus | '' }[] = [
  { label: 'ทุกสถานะ', value: '' },
  { label: 'ร่าง', value: 'DRAFT' },
  { label: 'รอดำเนินการ', value: 'PENDING' },
  { label: 'ชำระแล้ว', value: 'PAID' },
  { label: 'เกินกำหนด', value: 'OVERDUE' },
  { label: 'ยกเลิก', value: 'CANCELLED' },
];

const ENUM_LABELS: Record<string, string> = {
  ACTIVE: 'ใช้งาน',
  INACTIVE: 'ระงับ',
  EXPIRED: 'หมดอายุ',
  DELETED: 'ลบแล้ว',
  DRAFT: 'ร่าง',
  PENDING: 'รอดำเนินการ',
  PAID: 'ชำระแล้ว',
  OVERDUE: 'เกินกำหนด',
  CANCELLED: 'ยกเลิก',
  MONTHLY: 'รายเดือน',
  YEARLY: 'รายปี',
  ONE_TIME: 'ครั้งเดียว',
  LOGIN: 'เข้าสู่ระบบ',
  LOGOUT: 'ออกจากระบบ',
  CREATE: 'สร้าง',
  UPDATE: 'แก้ไข',
  DELETE: 'ลบ',
  DISABLE: 'ระงับ',
  ENABLE: 'เปิดใช้งาน',
  CHANGE_ROLE: 'เปลี่ยนบทบาท',
  CHANGE_PERMISSION: 'เปลี่ยนสิทธิ์',
  CHANGE_PACKAGE: 'เปลี่ยนแพ็กเกจ',
  CHANGE_LIMIT: 'เปลี่ยนโควตา',
  CREATE_INVOICE: 'สร้างใบแจ้งหนี้',
  UPDATE_INVOICE: 'แก้ไขใบแจ้งหนี้',
  CANCEL_INVOICE: 'ยกเลิกใบแจ้งหนี้',
};

export function enumLabel(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  return ENUM_LABELS[value] ?? value;
}
