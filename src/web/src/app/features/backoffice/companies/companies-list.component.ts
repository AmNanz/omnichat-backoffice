import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ENTITY_STATUS_OPTIONS, EntityStatus } from '../../../models/common.model';
import { Company } from '../../../models/company.model';
import { Profile } from '../../../models/profile.model';
import { CompaniesService } from '../../../services/companies.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { ProfilesService } from '../../../services/profiles.service';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { StatStripComponent, StatTile } from '../../../shared/stat-strip.component';
import { StatusTagComponent } from '../../../shared/status-tag.component';
import { SummaryStore, daysUntil, initials } from '../../../shared/ui';

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    ProgressSpinnerModule,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusTagComponent,
    StatStripComponent,
  ],
  template: `
    <div class="page">
      <app-page-header title="บริษัท" subtitle="จัดการบริษัท แพ็กเกจ และวันหมดอายุ">
        <p-button
          label="เพิ่มบริษัท"
          icon="ph ph-plus"
          (onClick)="create()"
          data-testid="companies-new"
        />
      </app-page-header>

      <app-stat-strip [tiles]="tiles()" />

      <div class="panel">
        <div class="panel-head">
          <div class="search-field">
            <i class="ph ph-magnifying-glass"></i>
            <input
              pInputText
              placeholder="ค้นหาชื่อบริษัท หรือ slug"
              [(ngModel)]="search"
              (keyup.enter)="applyFilters()"
              data-testid="companies-search"
            />
          </div>
          <p-select
            [(ngModel)]="status"
            [options]="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="สถานะ"
            (onChange)="applyFilters()"
            [showClear]="true"
            styleClass="w-40"
            data-testid="companies-status"
          />
          @if (expiringWithinDays != null) {
            <span class="chip chip-soon"><span class="dot"></span>ใกล้หมดอายุ</span>
            <p-button
              label="ล้างตัวกรอง"
              icon="ph ph-x"
              severity="secondary"
              size="small"
              (onClick)="clearExpiringFilter()"
            />
          }
          <p-button
            label="ค้นหา"
            icon="ph ph-magnifying-glass"
            severity="secondary"
            (onClick)="applyFilters()"
            data-testid="companies-search-btn"
          />
          <span class="ml-auto text-[12px] text-[var(--color-neutral-500)]">
            {{ items().length }} จาก {{ total() }} รายการ
          </span>
        </div>

        @if (loading()) {
          <div class="flex justify-center py-8"><p-progressSpinner /></div>
        } @else if (error()) {
          <div class="p-3"><app-empty-state [message]="error()!" variant="error" /></div>
        } @else if (!items().length) {
          <div class="p-3"><app-empty-state message="ไม่พบบริษัท" /></div>
        } @else {
          <div class="panel-body">
            <p-table
              [value]="items()"
              [paginator]="true"
              [rows]="limit"
              [totalRecords]="total()"
              [lazy]="true"
              (onPage)="onPage($event)"
              [rowsPerPageOptions]="[10, 20, 50]"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>บริษัท</th>
                  <th>โปรไฟล์</th>
                  <th>สถานะ</th>
                  <th>วันเริ่ม</th>
                  <th>วันหมดอายุ</th>
                  <th class="col-fit"></th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-row>
                <tr class="clickable-row" (click)="open(row._id)">
                  <td>
                    <span class="cell-lead">
                      <span class="initials">{{ initials(row.name) }}</span>
                      <span class="cell-lead-text">
                        <strong>{{ row.name }}</strong>
                        <span>{{ row.slug }}</span>
                      </span>
                    </span>
                  </td>
                  <td>{{ profileLabel(row.profileId) }}</td>
                  <td><app-status-tag [value]="row.status" /></td>
                  <td class="whitespace-nowrap">{{ row.startDate | date: 'mediumDate' }}</td>
                  <td class="whitespace-nowrap">
                    {{ row.expirationDate | date: 'mediumDate' }}
                    @if (expiryNote(row); as note) {
                      <div class="text-[11px]" [class]="note.tone">{{ note.text }}</div>
                    }
                  </td>
                  <td class="col-fit" (click)="$event.stopPropagation()">
                    <p-button
                      icon="ph ph-pencil-simple"
                      [rounded]="true"
                      [text]="true"
                      (onClick)="open(row._id)"
                      ariaLabel="แก้ไข"
                    />
                    <p-button
                      icon="ph ph-trash"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      (onClick)="remove(row._id)"
                      ariaLabel="ลบ"
                    />
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        }
      </div>
    </div>
  `,
})
export class CompaniesListComponent implements OnInit {
  private readonly service = inject(CompaniesService);
  private readonly profilesService = inject(ProfilesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly helper = inject(ConfirmHelper);
  private readonly summary = inject(SummaryStore);

  readonly items = signal<Company[]>([]);
  readonly profiles = signal<Profile[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statusOptions = ENTITY_STATUS_OPTIONS;
  readonly initials = initials;

  /** Counts come from /backoffice/dashboard, the only source that spans pages. */
  readonly tiles = computed<StatTile[]>(() => {
    const data = this.summary.summary();
    if (!data) {
      return [];
    }
    const activeShare = data.totalCompanies
      ? `${Math.round((data.activeCompanies / data.totalCompanies) * 100)}%`
      : '';
    return [
      {
        label: 'บริษัททั้งหมด',
        value: data.totalCompanies,
        icon: 'ph ph-buildings',
        tone: 'accent',
      },
      {
        label: 'ใช้งาน',
        value: data.activeCompanies,
        delta: activeShare,
        icon: 'ph ph-check-circle',
        tone: 'good',
      },
      {
        label: 'ใกล้หมดอายุ 30 วัน',
        value: data.expiringSoon?.companies ?? 0,
        delta: (data.expiringSoon?.companies ?? 0) > 0 ? 'ต้องต่ออายุ' : '',
        icon: 'ph ph-clock-countdown',
        tone: 'warn',
      },
      {
        label: 'หมดอายุแล้ว',
        value: data.expiredCompanies,
        icon: 'ph ph-x-circle',
        tone: 'bad',
      },
    ];
  });

  search = '';
  status: EntityStatus | '' = '';
  profileId: string | null = null;
  expiringWithinDays: number | null = null;
  page = 1;
  limit = 20;

  ngOnInit(): void {
    this.summary.load().subscribe();

    this.profilesService.list({ page: 1, limit: 100 }).subscribe({
      next: (res) => this.profiles.set(res.items),
    });

    this.route.queryParamMap.subscribe((params) => {
      this.search = params.get('search') ?? '';
      this.status = (params.get('status') as EntityStatus | null) ?? '';
      this.profileId = params.get('profileId');
      const days = params.get('expiringWithinDays');
      this.expiringWithinDays = days ? Number(days) : null;
      if (this.expiringWithinDays != null) {
        this.status = '';
      }
      this.page = 1;
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .list({
        page: this.page,
        limit: this.limit,
        search: this.search,
        status: this.expiringWithinDays != null ? undefined : this.status,
        profileId: this.profileId ?? undefined,
        expiringWithinDays: this.expiringWithinDays ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err));
          this.loading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    if (this.status) {
      this.expiringWithinDays = null;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: this.expiringWithinDays != null ? null : this.status || null,
        profileId: this.profileId || null,
        expiringWithinDays: this.expiringWithinDays,
        search: this.search || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  clearExpiringFilter(): void {
    this.expiringWithinDays = null;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { expiringWithinDays: null },
      queryParamsHandling: 'merge',
    });
  }

  onPage(event: { first?: number | null; rows?: number | null }): void {
    this.limit = event.rows ?? 20;
    this.page = Math.floor((event.first ?? 0) / this.limit) + 1;
    this.load();
  }

  open(id: string): void {
    void this.router.navigate(['/backoffice/companies', id]);
  }

  create(): void {
    void this.router.navigate(['/backoffice/companies', 'new'], {
      queryParams: this.profileId ? { profileId: this.profileId } : undefined,
    });
  }

  profileLabel(profileId?: string | null): string {
    if (!profileId) {
      return '-';
    }
    const id = String(profileId);
    const profile = this.profiles().find((item) => item._id === id);
    return profile ? `${profile.name} (${profile.code})` : id;
  }

  /** A short countdown under the expiry date, once it is worth flagging. */
  expiryNote(row: Company): { text: string; tone: string } | null {
    const days = daysUntil(row.expirationDate);
    if (days == null) {
      return null;
    }
    if (days < 0) {
      return { text: `เกินกำหนด ${Math.abs(days)} วัน`, tone: 'tone-bad' };
    }
    if (days <= 30) {
      return { text: `เหลืออีก ${days} วัน`, tone: 'tone-warn' };
    }
    return null;
  }

  remove(id: string): void {
    this.helper.confirm({
      message: 'ต้องการลบบริษัทนี้หรือไม่?',
      accept: () =>
        this.service.remove(id).subscribe({
          next: () => {
            this.helper.toastSuccess('ลบบริษัทแล้ว');
            this.summary.invalidate();
            this.summary.load().subscribe();
            this.load();
          },
          error: (err) => this.helper.toastError(apiErrorMessage(err)),
        }),
    });
  }
}
