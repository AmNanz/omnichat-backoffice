import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListQuery, PaginatedResponse } from '../models/common.model';
import {
  AuditLog,
  DashboardSummary,
  NotificationItem,
  UsageByProfile,
  UsageOverview,
} from '../models/misc.model';
import { toHttpParams } from './http-utils';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  summary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${environment.apiUrl}/backoffice/dashboard`);
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly base = `${environment.apiUrl}/backoffice/notifications`;

  constructor(private readonly http: HttpClient) {}

  listMine(query: ListQuery = {}): Observable<PaginatedResponse<NotificationItem>> {
    return this.http.get<PaginatedResponse<NotificationItem>>(`${this.base}/mine`, {
      params: toHttpParams(query),
    });
  }

  markRead(id: string): Observable<NotificationItem> {
    return this.http.patch<NotificationItem>(`${this.base}/${id}/read`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private readonly base = `${environment.apiUrl}/backoffice/audit-logs`;

  constructor(private readonly http: HttpClient) {}

  list(query: ListQuery = {}): Observable<PaginatedResponse<AuditLog>> {
    return this.http.get<PaginatedResponse<AuditLog>>(this.base, {
      params: toHttpParams(query),
    });
  }
}

@Injectable({ providedIn: 'root' })
export class UsageService {
  private readonly base = `${environment.apiUrl}/backoffice/usage`;

  constructor(private readonly http: HttpClient) {}

  overview(): Observable<UsageOverview> {
    return this.http.get<UsageOverview>(this.base);
  }

  byProfile(profileId: string): Observable<UsageByProfile> {
    return this.http.get<UsageByProfile>(`${this.base}/profile/${profileId}`);
  }
}
