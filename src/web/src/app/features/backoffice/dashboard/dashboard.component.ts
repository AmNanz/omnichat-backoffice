import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { enumLabel } from '../../../models/common.model';
import { AuditLog, DashboardSummary } from '../../../models/misc.model';
import { AuditLogsService, DashboardService } from '../../../services/misc.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { actionChipClass, actionIcon, initials, moduleLabel } from '../../../shared/ui';

type Tone = 'accent' | 'good' | 'warn' | 'bad' | 'mute';

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  tone: Tone;
  /** Money and other large figures read better with thousands separators. */
  numeric?: boolean;
  link?: string[];
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    ButtonModule,
    ProgressSpinnerModule,
    EmptyStateComponent,
    PageHeaderComponent,
  ],
  styles: `
    .range-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 34px;
      padding: 0 10px;
      background: var(--color-surface);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      color: var(--color-neutral-400);
      font-size: 13px;
      white-space: nowrap;
    }

    .range-chip i {
      color: var(--color-accent);
      font-size: 15px;
    }

    .dash-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
    }

    .dash-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-height: 7.5rem;
      padding: 12px 14px;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    a.dash-card {
      text-decoration: none;
      color: inherit;
      transition: box-shadow 0.15s ease;
    }

    a.dash-card:hover {
      box-shadow: var(--shadow-md);
    }

    .dash-card-top {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    /* Tinted round icon wells — the tint comes from the status tokens, so a
       card's colour means the same thing here as in a status chip. */
    .tone-well {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-size: 15px;
      flex-shrink: 0;
    }

    .tone-well.accent {
      background: var(--tag-accent-bg);
      color: var(--tag-accent-fg);
    }
    .tone-well.good {
      background: var(--tag-active-bg);
      color: var(--tag-active-fg);
    }
    .tone-well.warn {
      background: var(--tag-soon-bg);
      color: var(--tag-soon-fg);
    }
    .tone-well.bad {
      background: var(--tag-expired-bg);
      color: var(--tag-expired-fg);
    }
    .tone-well.mute {
      background: var(--tag-suspended-bg);
      color: var(--tag-suspended-fg);
    }

    .dash-card .label {
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-neutral-500);
      line-height: 1.3;
    }

    .dash-card .value {
      margin-top: 2px;
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text);
      line-height: 1.1;
      letter-spacing: -0.02em;
    }

    .dash-card .foot {
      margin-top: auto;
      padding-top: 10px;
      box-shadow: inset 0 1px 0 var(--color-divider);
      color: var(--color-neutral-600);
      font-size: 11px;
    }

    .activity-row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      padding: 9px 0;
      box-shadow: inset 0 -1px 0 var(--color-divider);
    }

    .activity-row:last-child {
      box-shadow: none;
    }

    .activity-copy {
      min-width: 0;
    }

    .activity-copy strong {
      display: block;
      font-size: 13px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .activity-copy span {
      color: var(--color-neutral-500);
      font-size: 11px;
    }

    .activity-time {
      color: var(--color-neutral-600);
      font-size: 11px;
      white-space: nowrap;
    }

    .dash-state {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 12rem;
      padding: var(--space-8);
      background: var(--color-surface);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    @media (max-width: 1280px) {
      .dash-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
    @media (max-width: 1080px) {
      .dash-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (max-width: 720px) {
      .dash-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
  template: `
    <div class="page">
      <app-page-header title="แดชบอร์ด" subtitle="ภาพรวมผู้เช่า การเรียกเก็บเงิน และความเสี่ยง">
        <div class="range-chip">
          <i class="ph ph-calendar-blank"></i>
          <span>{{ rangeStart | date: 'd MMM y' }} — {{ rangeEnd | date: 'd MMM y' }}</span>
        </div>
        <p-button
          label="รีเฟรช"
          icon="ph ph-arrows-clockwise"
          severity="secondary"
          (onClick)="load(true)"
          [loading]="refreshing()"
        />
      </app-page-header>

      @if (loading()) {
        <div class="dash-state"><p-progressSpinner /></div>
      } @else if (error()) {
        <div class="dash-state"><app-empty-state [message]="error()!" variant="error" /></div>
      } @else if (summary()) {
        <div class="dash-grid">
          @for (card of cards(summary()!); track card.label) {
            @if (card.link; as link) {
              <a class="dash-card" [routerLink]="link" [queryParams]="card.queryParams ?? null">
                <div class="dash-card-top">
                  <div class="tone-well" [class]="'tone-well ' + card.tone">
                    <i [class]="card.icon"></i>
                  </div>
                  <div>
                    <div class="label">{{ card.label }}</div>
                    <div class="value">
                      {{ card.numeric ? (+card.value | number) : card.value }}
                    </div>
                  </div>
                </div>
                <div class="foot">คลิกเพื่อดูรายการ</div>
              </a>
            } @else {
              <article class="dash-card">
                <div class="dash-card-top">
                  <div class="tone-well" [class]="'tone-well ' + card.tone">
                    <i [class]="card.icon"></i>
                  </div>
                  <div>
                    <div class="label">{{ card.label }}</div>
                    <div class="value">
                      {{ card.numeric ? (+card.value | number) : card.value }}
                    </div>
                  </div>
                </div>
                <div class="foot">ข้อมูล ณ ปัจจุบัน</div>
              </article>
            }
          }
        </div>

        <section class="surface-card surface-pad">
          <div class="flex items-center justify-between gap-3 mb-3">
            <div>
              <div class="text-[15px] font-medium">กิจกรรมล่าสุด</div>
              <div class="text-[12px] text-[var(--color-neutral-500)]">
                จากบันทึกการใช้งานทั้งระบบ
              </div>
            </div>
            <a routerLink="/backoffice/audit-logs" class="text-[12px]">ดูทั้งหมด</a>
          </div>

          @if (!activities().length) {
            <app-empty-state message="ยังไม่มีกิจกรรมล่าสุด" />
          } @else {
            @for (item of activities(); track item._id) {
              <div class="activity-row">
                <span class="initials initials-round">
                  {{ initials(item.userName || item.userId) }}
                </span>
                <div class="activity-copy">
                  <strong>{{ item.userName || item.userId || 'ระบบ' }}</strong>
                  <span>{{ moduleLabel(item.module) }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span [class]="actionChipClass(item.action)">
                    <i [class]="actionIcon(item.action)"></i>
                    {{ enumLabel(item.action) }}
                  </span>
                  <span class="activity-time">{{ item.createdAt | date: 'd MMM y HH:mm' }}</span>
                </div>
              </div>
            }
          }
        </section>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly auditLogsService = inject(AuditLogsService);

  readonly enumLabel = enumLabel;
  readonly actionIcon = actionIcon;
  readonly actionChipClass = actionChipClass;
  readonly initials = initials;
  readonly moduleLabel = moduleLabel;

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly activities = signal<AuditLog[]>([]);

  readonly rangeEnd = new Date();
  readonly rangeStart = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);

  ngOnInit(): void {
    this.load();
  }

  load(refresh = false): void {
    if (refresh) {
      this.refreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);

    forkJoin({
      summary: this.dashboardService.summary(),
      logs: this.auditLogsService.list({ page: 1, limit: 7 }),
    }).subscribe({
      next: ({ summary, logs }) => {
        this.summary.set(summary);
        this.activities.set(logs.items);
        this.loading.set(false);
        this.refreshing.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'โหลดแดชบอร์ดไม่สำเร็จ'));
        this.loading.set(false);
        this.refreshing.set(false);
      },
    });
  }

  cards(data: DashboardSummary): StatCard[] {
    return [
      {
        label: 'โปรไฟล์',
        value: data.totalProfiles,
        icon: 'ph ph-identification-card',
        tone: 'accent',
      },
      {
        label: 'บริษัท',
        value: data.totalCompanies,
        icon: 'ph ph-buildings',
        tone: 'accent',
        link: ['/backoffice/companies'],
      },
      { label: 'ผู้ใช้', value: data.totalUsers, icon: 'ph ph-users-three', tone: 'mute' },
      {
        label: 'บริษัทที่ใช้งาน',
        value: data.activeCompanies,
        icon: 'ph ph-check-circle',
        tone: 'good',
        link: ['/backoffice/companies'],
        queryParams: { status: 'ACTIVE' },
      },
      { label: 'ผู้ใช้ที่ใช้งาน', value: data.activeUsers, icon: 'ph ph-user', tone: 'good' },
      {
        label: 'บริษัทหมดอายุ',
        value: data.expiredCompanies,
        icon: 'ph ph-x-circle',
        tone: 'bad',
        link: ['/backoffice/companies'],
        queryParams: { status: 'EXPIRED' },
      },
      {
        label: 'ใกล้หมดอายุ (บริษัท)',
        value: data.expiringSoon.companies,
        icon: 'ph ph-clock-countdown',
        tone: 'warn',
        link: ['/backoffice/companies'],
        queryParams: { expiringWithinDays: '30' },
      },
      {
        label: 'ใกล้หมดอายุ (ผู้ใช้)',
        value: data.expiringSoon.users,
        icon: 'ph ph-hourglass',
        tone: 'warn',
      },
      {
        label: 'การสมัครที่ใช้งาน',
        value: data.activeSubscriptions,
        icon: 'ph ph-arrows-clockwise',
        tone: 'accent',
      },
      {
        label: 'รายได้ที่ชำระแล้ว',
        value: data.revenue,
        icon: 'ph ph-wallet',
        tone: 'good',
        numeric: true,
      },
    ];
  }
}
