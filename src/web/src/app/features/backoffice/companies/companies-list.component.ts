import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import {
  ENTITY_STATUS_OPTIONS,
  EntityStatus,
} from '../../../models/common.model';
import { Company } from '../../../models/company.model';
import { Profile } from '../../../models/profile.model';
import { CompaniesService } from '../../../services/companies.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { ProfilesService } from '../../../services/profiles.service';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { StatusTagComponent } from '../../../shared/status-tag.component';

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusTagComponent,
  ],
  template: `
    <div class="page">
      <app-page-header title="บริษัท" subtitle="จัดการบริษัทและวันหมดอายุ">
        <p-button
          label="เพิ่มบริษัท"
          icon="pi pi-plus"
          (onClick)="create()"
          data-testid="companies-new"
        />
      </app-page-header>

      <p-card>
        <div class="page-filters">
          <input
            pInputText
            placeholder="ค้นหา..."
            [(ngModel)]="search"
            (keyup.enter)="applyFilters()"
            data-testid="companies-search"
          />
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
            <p-tag value="ใกล้หมดอายุ" severity="warn" />
            <p-button
              label="ล้างตัวกรองใกล้หมดอายุ"
              severity="secondary"
              [outlined]="true"
              size="small"
              (onClick)="clearExpiringFilter()"
            />
          }
          <p-button
            label="ค้นหา"
            icon="pi pi-search"
            (onClick)="applyFilters()"
            data-testid="companies-search-btn"
          />
        </div>

        @if (loading()) {
          <div class="flex justify-center py-8"><p-progressSpinner /></div>
        } @else if (error()) {
          <app-empty-state [message]="error()!" variant="error" />
        } @else if (!items().length) {
          <app-empty-state message="ไม่พบบริษัท" />
        } @else {
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
                <th>ชื่อ</th>
                <th>รหัส</th>
                <th>โปรไฟล์</th>
                <th>สถานะ</th>
                <th>วันเริ่ม</th>
                <th>วันหมดอายุ</th>
                <th class="col-fit">จัดการ</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-row>
              <tr class="clickable-row" (click)="open(row._id)">
                <td>{{ row.name }}</td>
                <td>{{ row.slug }}</td>
                <td>{{ profileLabel(row.profileId) }}</td>
                <td><app-status-tag [value]="row.status" /></td>
                <td>{{ row.startDate | date: 'mediumDate' }}</td>
                <td>{{ row.expirationDate | date: 'mediumDate' }}</td>
                <td class="col-fit" (click)="$event.stopPropagation()">
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    (onClick)="open(row._id)"
                    ariaLabel="แก้ไข"
                  />
                  <p-button
                    icon="pi pi-trash"
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
        }
      </p-card>
    </div>
  `,
})
export class CompaniesListComponent implements OnInit {
  private readonly service = inject(CompaniesService);
  private readonly profilesService = inject(ProfilesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly helper = inject(ConfirmHelper);

  readonly items = signal<Company[]>([]);
  readonly profiles = signal<Profile[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statusOptions = ENTITY_STATUS_OPTIONS;

  search = '';
  status: EntityStatus | '' = '';
  profileId: string | null = null;
  expiringWithinDays: number | null = null;
  page = 1;
  limit = 20;

  ngOnInit(): void {
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

  remove(id: string): void {
    this.helper.confirm({
      message: 'ต้องการลบบริษัทนี้หรือไม่?',
      accept: () =>
        this.service.remove(id).subscribe({
          next: () => {
            this.helper.toastSuccess('ลบบริษัทแล้ว');
            this.load();
          },
          error: (err) => this.helper.toastError(apiErrorMessage(err)),
        }),
    });
  }
}
