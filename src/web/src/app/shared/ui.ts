import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { DashboardSummary } from '../models/misc.model';
import { DashboardService } from '../services/misc.service';

/** Maps an entity/invoice status onto the Nocturne status-chip classes. */
export function chipClass(status: string | null | undefined): string {
  switch (status) {
    case 'ACTIVE':
    case 'PAID':
    case 'ENABLE':
      return 'chip chip-active';
    case 'EXPIRED':
    case 'OVERDUE':
    case 'CANCELLED':
    case 'DELETED':
      return 'chip chip-expired';
    case 'PENDING':
    case 'DRAFT':
      return 'chip chip-soon';
    case 'INACTIVE':
    default:
      return 'chip chip-suspended';
  }
}

/** Thai labels for the modules the audit log records. */
export const MODULE_LABELS: Record<string, string> = {
  auth: 'การเข้าสู่ระบบ',
  profiles: 'โปรไฟล์',
  companies: 'บริษัท',
  users: 'ผู้ใช้',
  roles: 'บทบาท',
  packages: 'แพ็กเกจ',
  subscriptions: 'การสมัคร',
  invoices: 'ใบแจ้งหนี้',
  notifications: 'การแจ้งเตือน',
};

export function moduleLabel(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  return MODULE_LABELS[value] ?? value;
}

/** Phosphor icon for an audit action. */
export function actionIcon(action: string | null | undefined): string {
  switch (action) {
    case 'CREATE':
      return 'ph ph-plus';
    case 'UPDATE':
      return 'ph ph-pencil-simple';
    case 'DELETE':
      return 'ph ph-trash';
    case 'LOGIN':
      return 'ph ph-sign-in';
    case 'LOGOUT':
      return 'ph ph-sign-out';
    case 'DISABLE':
      return 'ph ph-prohibit';
    case 'ENABLE':
      return 'ph ph-check-circle';
    case 'CHANGE_PACKAGE':
      return 'ph ph-package';
    case 'CHANGE_LIMIT':
      return 'ph ph-gauge';
    case 'CHANGE_ROLE':
    case 'CHANGE_PERMISSION':
      return 'ph ph-shield-check';
    case 'CREATE_INVOICE':
    case 'UPDATE_INVOICE':
    case 'CANCEL_INVOICE':
      return 'ph ph-receipt';
    default:
      return 'ph ph-dot-outline';
  }
}

/** Chip tint for an audit action — creates read green, removals read red. */
export function actionChipClass(action: string | null | undefined): string {
  switch (action) {
    case 'CREATE':
    case 'ENABLE':
    case 'CREATE_INVOICE':
      return 'chip chip-active';
    case 'DELETE':
    case 'DISABLE':
    case 'CANCEL_INVOICE':
      return 'chip chip-expired';
    case 'CHANGE_PACKAGE':
    case 'CHANGE_LIMIT':
    case 'CHANGE_ROLE':
    case 'CHANGE_PERMISSION':
      return 'chip chip-soon';
    case 'UPDATE':
    case 'UPDATE_INVOICE':
      return 'chip chip-accent';
    default:
      return 'chip chip-suspended';
  }
}

/** Up to two leading characters, latin or Thai, for an avatar square. */
export function initials(value: string | null | undefined): string {
  const cleaned = (value ?? '').replace(/[^A-Za-zก-๙0-9]/g, ' ').trim();
  if (!cleaned) {
    return '—';
  }
  return cleaned.slice(0, 2).toUpperCase();
}

/** Whole days from today until `date`; null when there is no date. */
export function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) {
    return null;
  }
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) {
    return null;
  }
  return Math.ceil((target - Date.now()) / 86_400_000);
}

export function percent(used: number, limit: number): number {
  if (!limit || limit <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((used / limit) * 100));
}

/** Tone for a quota meter — red once it is full, amber as it approaches. */
export function quotaTone(pct: number): string {
  if (pct >= 100) {
    return 'var(--tone-bad)';
  }
  if (pct >= 85) {
    return 'var(--tone-warn)';
  }
  if (pct >= 60) {
    return 'var(--color-accent)';
  }
  return 'var(--tone-good)';
}

/**
 * One shared read of `/backoffice/dashboard`. The KPI strips on the list
 * pages and the sidebar's invoice badge all read the same counts, so the
 * summary is fetched once per session rather than once per screen.
 */
@Injectable({ providedIn: 'root' })
export class SummaryStore {
  private readonly service = inject(DashboardService);
  private request?: Observable<DashboardSummary | null>;

  readonly summary = signal<DashboardSummary | null>(null);
  readonly pendingInvoices = computed(() => this.summary()?.pendingInvoices ?? 0);

  load(): Observable<DashboardSummary | null> {
    if (!this.request) {
      this.request = this.service.summary().pipe(
        tap((data) => this.summary.set(data)),
        catchError(() => of(null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.request;
  }

  /** Drops the cache so the next `load()` refetches — used after mutations. */
  invalidate(): void {
    this.request = undefined;
  }
}
