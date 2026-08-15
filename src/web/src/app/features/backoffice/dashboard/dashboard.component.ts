import { DatePipe } from '@angular/common';
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

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, ButtonModule, ProgressSpinnerModule, EmptyStateComponent],
  styles: `
    .dash-head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
    }

    .dash-kicker {
      margin: 0 0 0.35rem;
      color: #7a93a8;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .dash-head h1 {
      margin: 0;
      color: #1c3550;
      font-size: 1.85rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    .dash-head p {
      margin: 0.35rem 0 0;
      color: #5b738a;
    }

    .dash-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.7rem;
    }

    .range-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 2.6rem;
      padding: 0 0.95rem;
      background: #fff;
      border: 1px solid #d5e0ea;
      border-radius: 0.75rem;
      color: #3d556b;
      font-size: 0.92rem;
      box-shadow: 0 6px 16px rgba(28, 53, 80, 0.04);
    }

    .range-chip i {
      color: #6699bb;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0.85rem;
    }

    .dash-card {
      display: flex;
      flex-direction: column;
      min-height: 8.4rem;
      padding: 1rem 1.05rem 0.85rem;
      background: #fff;
      border: 1px solid #e4edf3;
      border-radius: 1.05rem;
      box-shadow: 0 8px 22px rgba(28, 53, 80, 0.05);
    }

    .dash-card-top {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .stat-icon {
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-size: 0.95rem;
      flex-shrink: 0;
    }

    .stat-icon.blue { background: #d7e8f4; color: #2f5f86; }
    .stat-icon.emerald { background: #d8f3e7; color: #1f8a5b; }
    .stat-icon.amber { background: #fdecc8; color: #c47b14; }
    .stat-icon.rose { background: #fde2e4; color: #d13b4a; }
    .stat-icon.violet { background: #e8e2fb; color: #6b4ec4; }
    .stat-icon.slate { background: #e4eef5; color: #385a73; }

    .stat-label {
      font-size: 0.86rem;
      color: #7a93a8;
      line-height: 1.3;
    }

    .stat-value {
      margin-top: 0.2rem;
      font-size: 1.7rem;
      font-weight: 700;
      color: #1c3550;
      line-height: 1.1;
      letter-spacing: -0.03em;
    }

    .stat-foot {
      margin-top: auto;
      padding-top: 0.7rem;
      border-top: 1px solid #eef3f7;
      color: #94a3b8;
      font-size: 0.75rem;
    }

    .panel {
      background: #fff;
      border: 1px solid #e4edf3;
      border-radius: 1.15rem;
      box-shadow: 0 8px 22px rgba(28, 53, 80, 0.05);
      padding: 1.15rem 1.2rem 1.1rem;
      min-width: 0;
    }

    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.95rem;
    }

    .panel-head h2 {
      margin: 0;
      color: #1c3550;
      font-size: 1.05rem;
      font-weight: 700;
    }

    .panel-link {
      color: #5589ac;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
    }

    .panel-link:hover {
      text-decoration: underline;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
    }

    .activity-row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 0.75rem;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eef3f7;
    }

    .activity-row:last-child {
      border-bottom: 0;
      padding-bottom: 0.15rem;
    }

    .activity-copy {
      min-width: 0;
    }

    .activity-copy strong {
      display: block;
      color: #1c3550;
      font-size: 0.92rem;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .activity-copy span {
      color: #7a93a8;
      font-size: 0.8rem;
    }

    .activity-time {
      color: #94a3b8;
      font-size: 0.75rem;
      white-space: nowrap;
    }

    .dash-loading,
    .dash-error {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 12rem;
      padding: 2rem;
      background: #fff;
      border: 1px solid #d5e0ea;
      border-radius: 1.15rem;
    }

    @media (max-width: 1280px) {
      .stat-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
    @media (max-width: 1080px) {
      .stat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-width: 720px) {
      .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `,
  template: `
    <div class="page">
      <div class="dash-head">
        <div>
          <div class="dash-kicker">ระบบจัดการ</div>
          <h1>แดชบอร์ด</h1>
          <p>ภาพรวมผู้เช่า การเรียกเก็บเงิน และความเสี่ยง</p>
        </div>
        <div class="dash-actions">
          <div class="range-chip">
            <i class="pi pi-calendar"></i>
            <span>{{ rangeStart | date:'d MMM y' }} - {{ rangeEnd | date:'d MMM y' }}</span>
          </div>
          <p-button
            label="รีเฟรชข้อมูล"
            icon="pi pi-refresh"
            (onClick)="load(true)"
            [loading]="refreshing()"
          />
        </div>
      </div>

      @if (loading()) {
        <div class="dash-loading"><p-progressSpinner /></div>
      } @else if (error()) {
        <div class="dash-error"><app-empty-state [message]="error()!" variant="error" /></div>
      } @else {
        @if (summary(); as data) {
        <div class="stat-grid">
          @for (card of cards(data); track card.label) {
            <article class="dash-card">
              <div class="dash-card-top">
                <div class="stat-icon" [class]="card.tone">
                  <i [class]="card.icon"></i>
                </div>
                <div>
                  <div class="stat-label">{{ card.label }}</div>
                  <div class="stat-value">{{ card.value }}</div>
                </div>
              </div>
              <div class="stat-foot">ข้อมูล ณ ปัจจุบัน</div>
            </article>
          }
        </div>

        <section class="panel">
          <div class="panel-head">
            <h2>กิจกรรมล่าสุด</h2>
            <a routerLink="/backoffice/audit-logs" class="panel-link">ดูทั้งหมด</a>
          </div>
          @if (!activities().length) {
            <app-empty-state message="ยังไม่มีกิจกรรมล่าสุด" />
          } @else {
            <div class="activity-list">
              @for (item of activities(); track item._id) {
                <div class="activity-row">
                  <div class="stat-icon" [class]="activityTone(item.action)">
                    <i [class]="activityIcon(item.action)"></i>
                  </div>
                  <div class="activity-copy">
                    <strong>{{ item.userName || item.userId || 'ระบบ' }}</strong>
                    <span>{{ enumLabel(item.action) }} · {{ item.module }}</span>
                  </div>
                  <div class="activity-time">{{ item.createdAt | date:'d MMM y HH:mm' }}</div>
                </div>
              }
            </div>
          }
        </section>
        }
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly auditLogsService = inject(AuditLogsService);

  readonly enumLabel = enumLabel;
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
      { label: 'โปรไฟล์', value: data.totalProfiles, icon: 'pi pi-id-card', tone: 'blue' },
      { label: 'บริษัท', value: data.totalCompanies, icon: 'pi pi-building', tone: 'violet' },
      { label: 'ผู้ใช้', value: data.totalUsers, icon: 'pi pi-users', tone: 'slate' },
      { label: 'บริษัทที่ใช้งาน', value: data.activeCompanies, icon: 'pi pi-check-circle', tone: 'emerald' },
      { label: 'ผู้ใช้ที่ใช้งาน', value: data.activeUsers, icon: 'pi pi-user', tone: 'emerald' },
      { label: 'บริษัทหมดอายุ', value: data.expiredCompanies, icon: 'pi pi-times-circle', tone: 'rose' },
      { label: 'ใกล้หมดอายุ (บริษัท)', value: data.expiringSoon.companies, icon: 'pi pi-clock', tone: 'amber' },
      { label: 'ใกล้หมดอายุ (ผู้ใช้)', value: data.expiringSoon.users, icon: 'pi pi-hourglass', tone: 'amber' },
      { label: 'การสมัครที่ใช้งาน', value: data.activeSubscriptions, icon: 'pi pi-sync', tone: 'blue' },
      { label: 'รายได้ที่ชำระแล้ว', value: data.revenue, icon: 'pi pi-wallet', tone: 'emerald' },
    ];
  }

  activityIcon(action: string): string {
    if (action === 'LOGIN') return 'pi pi-sign-in';
    if (action === 'LOGOUT') return 'pi pi-sign-out';
    if (action === 'CREATE') return 'pi pi-plus';
    if (action === 'UPDATE') return 'pi pi-pencil';
    if (action === 'DELETE') return 'pi pi-trash';
    if (action === 'ENABLE') return 'pi pi-check';
    if (action === 'DISABLE') return 'pi pi-ban';
    return 'pi pi-circle';
  }

  activityTone(action: string): StatCard['tone'] {
    if (action === 'LOGIN' || action === 'CREATE' || action === 'ENABLE') return 'emerald';
    if (action === 'DELETE' || action === 'DISABLE') return 'rose';
    if (action === 'UPDATE') return 'violet';
    if (action === 'LOGOUT') return 'slate';
    return 'blue';
  }
}
