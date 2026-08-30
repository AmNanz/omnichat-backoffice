import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { UsageByProfile, UsageOverview } from '../../../models/misc.model';
import { Profile } from '../../../models/profile.model';
import { UsageService } from '../../../services/misc.service';
import { ProfilesService } from '../../../services/profiles.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { StatStripComponent, StatTile } from '../../../shared/stat-strip.component';
import { SummaryStore, initials, percent, quotaTone } from '../../../shared/ui';

interface ProfileQuotaRow {
  id: string;
  code: string;
  name: string;
  text: string;
  pct: number;
  color: string;
  /** The higher of the two ratios — what the list is ordered by. */
  risk: number;
}

@Component({
  selector: 'app-usage',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    ProgressSpinnerModule,
    PageHeaderComponent,
    EmptyStateComponent,
    StatStripComponent,
  ],
  styles: [
    `
      .usage-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 16px;
        align-items: start;
      }

      @media (max-width: 1100px) {
        .usage-grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }

      .quota-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
        padding: 9px 0;
        box-shadow: inset 0 -1px 0 var(--color-divider);
      }

      .quota-item:last-child {
        box-shadow: none;
      }

      .quota-item .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-size: 13px;
      }

      .quota-item .name {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .quota-item .name span.text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .detail-quota {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 14px;
      }
    `,
  ],
  template: `
    <div class="page">
      <app-page-header title="การใช้งาน" subtitle="โควตาและการใช้จริงของแต่ละโปรไฟล์">
        <p-button
          label="รีเฟรช"
          icon="ph ph-arrows-clockwise"
          severity="secondary"
          (onClick)="reload()"
        />
      </app-page-header>

      @if (loadingOverview()) {
        <div class="surface-card surface-pad">
          <div class="flex justify-center py-8"><p-progressSpinner /></div>
        </div>
      } @else if (overviewError()) {
        <app-empty-state [message]="overviewError()!" variant="error" />
      } @else {
        <app-stat-strip [tiles]="tiles()" />
      }

      <div class="usage-grid">
        <div class="surface-card surface-pad">
          <div class="flex items-center justify-between gap-3 mb-3">
            <div>
              <div class="text-[15px] font-medium">โควตาตามโปรไฟล์</div>
              <div class="text-[12px] text-[var(--color-neutral-500)]">
                เรียงตามความเสี่ยงเต็มโควตา
              </div>
            </div>
            <a routerLink="/backoffice/profiles" class="text-[12px]">ดูทั้งหมด</a>
          </div>

          @if (loadingQuotas()) {
            <div class="flex justify-center py-6"><p-progressSpinner /></div>
          } @else if (!quotaRows().length) {
            <app-empty-state message="ยังไม่มีข้อมูลโควตาของโปรไฟล์" />
          } @else {
            @for (row of quotaRows(); track row.id) {
              <div class="quota-item">
                <div class="head">
                  <span class="name">
                    <span class="initials initials-round">{{ row.code }}</span>
                    <span class="text">{{ row.name }}</span>
                  </span>
                  <span
                    class="text-[12px] whitespace-nowrap"
                    [style.color]="row.color"
                    >{{ row.text }}</span
                  >
                </div>
                <div class="meter" style="height: 5px">
                  <div
                    class="meter-fill"
                    [style.width.%]="row.pct"
                    [style.background]="row.color"
                  ></div>
                </div>
              </div>
            }
          }
        </div>

        <div class="surface-card surface-pad">
          <div class="text-[15px] font-medium">รายละเอียดรายโปรไฟล์</div>
          <div class="text-[12px] text-[var(--color-neutral-500)] mb-3">
            เลือกโปรไฟล์เพื่อดูโควตาบริษัทและผู้ใช้
          </div>

          <div class="page-filters">
            <p-select
              [(ngModel)]="profileId"
              [options]="profileOptions()"
              optionLabel="label"
              optionValue="value"
              placeholder="ค้นหาหรือเลือกโปรไฟล์"
              [filter]="true"
              filterBy="label"
              filterPlaceholder="ค้นหาโปรไฟล์"
              [showClear]="true"
              [loading]="loadingProfiles()"
              styleClass="w-80"
              (onChange)="onProfileChange()"
            />
            <p-button
              label="โหลดการใช้งาน"
              icon="ph ph-magnifying-glass"
              severity="secondary"
              (onClick)="loadProfile()"
            />
          </div>

          @if (loadingProfile()) {
            <div class="flex justify-center py-6"><p-progressSpinner /></div>
          } @else if (profileError()) {
            <div class="mt-3"><app-empty-state [message]="profileError()!" variant="error" /></div>
          } @else if (profileUsage()) {
            <div class="mt-4">
              <div class="section-label">{{ profileUsage()!.profileName }}</div>
              @for (bar of detailBars(); track bar.label) {
                <div class="detail-quota">
                  <div class="flex items-center justify-between text-[13px]">
                    <span class="text-[var(--color-neutral-300)]">{{ bar.label }}</span>
                    <span [style.color]="bar.color">{{ bar.text }}</span>
                  </div>
                  <div class="meter">
                    <div
                      class="meter-fill"
                      [style.width.%]="bar.pct"
                      [style.background]="bar.color"
                    ></div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="form-hint mt-3">ยังไม่ได้เลือกโปรไฟล์</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class UsageComponent implements OnInit {
  private readonly service = inject(UsageService);
  private readonly profilesService = inject(ProfilesService);
  private readonly summary = inject(SummaryStore);

  readonly overview = signal<UsageOverview | null>(null);
  readonly profileUsage = signal<UsageByProfile | null>(null);
  readonly profiles = signal<Profile[]>([]);
  readonly quotaRows = signal<ProfileQuotaRow[]>([]);
  readonly loadingOverview = signal(true);
  readonly loadingProfiles = signal(false);
  readonly loadingProfile = signal(false);
  readonly loadingQuotas = signal(false);
  readonly overviewError = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);

  profileId = '';

  readonly tiles = computed<StatTile[]>(() => {
    const data = this.overview();
    if (!data) {
      return [];
    }
    const summary = this.summary.summary();
    const atRisk = this.quotaRows().filter((row) => row.risk >= 0.85).length;
    return [
      { label: 'โปรไฟล์', value: data.profiles, icon: 'ph ph-identification-card', tone: 'accent' },
      {
        label: 'บริษัท',
        value: data.companies,
        delta: summary ? `ใช้งาน ${summary.activeCompanies}` : '',
        icon: 'ph ph-buildings',
        tone: 'good',
      },
      {
        label: 'ผู้ใช้',
        value: data.users,
        delta: summary ? `ใช้งาน ${summary.activeUsers}` : '',
        icon: 'ph ph-users-three',
        tone: 'good',
      },
      {
        label: 'โปรไฟล์ใกล้เต็มโควตา',
        value: atRisk,
        delta: atRisk > 0 ? 'เฝ้าระวัง' : 'ปกติ',
        icon: 'ph ph-warning',
        tone: atRisk > 0 ? 'warn' : 'mute',
      },
    ];
  });

  /** The two meters shown for the selected profile. */
  detailBars(): { label: string; text: string; pct: number; color: string }[] {
    const usage = this.profileUsage();
    if (!usage) {
      return [];
    }
    return [
      this.toBar('บริษัท', usage.companies),
      this.toBar('ผู้ใช้', usage.users),
    ];
  }

  profileOptions(): { label: string; value: string }[] {
    return this.profiles().map((item) => ({
      label: item.code ? `${item.name} (${item.code})` : item.name,
      value: String(item._id),
    }));
  }

  ngOnInit(): void {
    this.summary.load().subscribe();
    this.loadOverview();
    this.loadProfiles();
  }

  reload(): void {
    this.summary.invalidate();
    this.summary.load().subscribe();
    this.loadOverview();
    this.loadProfiles();
    if (this.profileId) {
      this.loadProfile();
    }
  }

  private loadOverview(): void {
    this.loadingOverview.set(true);
    this.overviewError.set(null);
    this.service.overview().subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loadingOverview.set(false);
      },
      error: (err) => {
        this.overviewError.set(apiErrorMessage(err));
        this.loadingOverview.set(false);
      },
    });
  }

  private loadProfiles(): void {
    this.loadingProfiles.set(true);
    this.profilesService.list({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.profiles.set(res.items);
        this.loadingProfiles.set(false);
        this.loadQuotaRanking(res.items);
      },
      error: (err) => {
        this.profileError.set(apiErrorMessage(err, 'โหลดโปรไฟล์ไม่สำเร็จ'));
        this.loadingProfiles.set(false);
      },
    });
  }

  /**
   * There is no bulk usage endpoint, so the ranking is assembled from one
   * per-profile call each. It is capped at the first 20 profiles to keep the
   * page to a bounded number of requests.
   */
  private loadQuotaRanking(profiles: Profile[]): void {
    const subset = profiles.slice(0, 20);
    if (!subset.length) {
      this.quotaRows.set([]);
      return;
    }
    this.loadingQuotas.set(true);
    forkJoin(
      subset.map((profile) =>
        this.service.byProfile(String(profile._id)).pipe(catchError(() => of(null))),
      ),
    ).subscribe((results) => {
      const rows: ProfileQuotaRow[] = [];
      results.forEach((usage, index) => {
        if (!usage) {
          return;
        }
        const profile = subset[index];
        const companyRatio = usage.companies.limit ? usage.companies.used / usage.companies.limit : 0;
        const userRatio = usage.users.limit ? usage.users.used / usage.users.limit : 0;
        const risk = Math.max(companyRatio, userRatio);
        const worst = companyRatio >= userRatio ? usage.companies : usage.users;
        const worstLabel = companyRatio >= userRatio ? 'บริษัท' : 'ผู้ใช้';
        const pct = percent(worst.used, worst.limit);
        rows.push({
          id: String(profile._id),
          code: profile.code ? profile.code.slice(0, 2).toUpperCase() : initials(profile.name),
          name: profile.name,
          text:
            worst.used > worst.limit
              ? `${worstLabel} ${worst.used} / ${worst.limit} เกินโควตา`
              : `${worstLabel} ${worst.used} / ${worst.limit}`,
          pct,
          color: quotaTone(pct),
          risk,
        });
      });
      rows.sort((a, b) => b.risk - a.risk);
      this.quotaRows.set(rows);
      this.loadingQuotas.set(false);
    });
  }

  onProfileChange(): void {
    if (!this.profileId) {
      this.profileUsage.set(null);
      this.profileError.set(null);
      return;
    }
    this.loadProfile();
  }

  loadProfile(): void {
    if (!this.profileId) {
      this.profileError.set('ต้องเลือกโปรไฟล์');
      return;
    }
    this.loadingProfile.set(true);
    this.profileError.set(null);
    this.service.byProfile(this.profileId).subscribe({
      next: (data) => {
        this.profileUsage.set(data);
        this.loadingProfile.set(false);
      },
      error: (err) => {
        this.profileError.set(apiErrorMessage(err));
        this.loadingProfile.set(false);
      },
    });
  }

  private toBar(
    label: string,
    quota: { used: number; limit: number; remaining: number },
  ): { label: string; text: string; pct: number; color: string } {
    const pct = percent(quota.used, quota.limit);
    return {
      label,
      text: `${quota.used} / ${quota.limit} (เหลือ ${quota.remaining})`,
      pct,
      color: quotaTone(pct),
    };
  }
}
