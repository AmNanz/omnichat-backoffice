export interface NotificationItem {
  _id: string;
  title: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
  type?: string;
  channel?: string;
}

export interface AuditLog {
  _id: string;
  userId?: string;
  userName?: string;
  action: string;
  module: string;
  resourceId?: string;
  details?: unknown;
  createdAt?: string;
}

export interface DashboardSummary {
  totalProfiles: number;
  totalCompanies: number;
  totalUsers: number;
  activeCompanies: number;
  activeUsers: number;
  expiredCompanies: number;
  expiredUsers: number;
  expiringSoon: {
    companies: number;
    users: number;
  };
  activeSubscriptions: number;
  pendingInvoices: number;
  overdueInvoices: number;
  revenue: number;
}

export interface UsageOverview {
  profiles: number;
  companies: number;
  users: number;
}

export interface UsageByProfile {
  profileId: string;
  profileName: string;
  companies: {
    used: number;
    limit: number;
    remaining: number;
    nearLimit: boolean;
  };
  users: {
    used: number;
    limit: number;
    remaining: number;
    nearLimit: boolean;
  };
}
