import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { User } from '../../../models/user.model';
import { UsersService } from '../../../services/users.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { StatStripComponent, StatTile } from '../../../shared/stat-strip.component';
import { StatusTagComponent } from '../../../shared/status-tag.component';
import { SummaryStore, initials } from '../../../shared/ui';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    ProgressSpinnerModule,
    PageHeaderComponent,
    EmptyStateComponent,
    StatStripComponent,
    StatusTagComponent,
  ],
  template: `
    <div class="page">
      <app-page-header title="ผู้ใช้" subtitle="ผู้ใช้ระบบจัดการและสิทธิ์ที่ได้รับ">
        <p-button label="เพิ่มผู้ใช้" icon="ph ph-plus" (onClick)="create()" data-testid="users-new" />
      </app-page-header>

      <app-stat-strip [tiles]="tiles()" />

      <div class="panel">
        <div class="panel-head">
          <div class="search-field">
            <i class="ph ph-magnifying-glass"></i>
            <input
              pInputText
              placeholder="ค้นหาชื่อ หรืออีเมล"
              [(ngModel)]="search"
              (keyup.enter)="load()"
              data-testid="users-search"
            />
          </div>
          <p-button
            label="ค้นหา"
            icon="ph ph-magnifying-glass"
            severity="secondary"
            (onClick)="load()"
            data-testid="users-search-btn"
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
          <div class="p-3"><app-empty-state message="ไม่พบผู้ใช้" /></div>
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
                  <th>ผู้ใช้</th>
                  <th>บริษัทที่ดูแล</th>
                  <th>สถานะ</th>
                  <th>วันหมดอายุ</th>
                  <th class="col-fit"></th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-row>
                <tr class="clickable-row" (click)="open(row._id)">
                  <td>
                    <span class="cell-lead">
                      <span class="initials">{{ initials(row.displayName || row.email) }}</span>
                      <span class="cell-lead-text">
                        <strong>{{ row.displayName || '—' }}</strong>
                        <span>{{ row.email }}</span>
                      </span>
                    </span>
                  </td>
                  <td>{{ row.companyIds?.length || 0 }}</td>
                  <td><app-status-tag [value]="row.status" /></td>
                  <td class="whitespace-nowrap">{{ row.expirationDate | date: 'mediumDate' }}</td>
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
export class UsersListComponent implements OnInit {
  private readonly service = inject(UsersService);
  private readonly router = inject(Router);
  private readonly helper = inject(ConfirmHelper);
  private readonly summary = inject(SummaryStore);

  readonly items = signal<User[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly initials = initials;

  readonly tiles = computed<StatTile[]>(() => {
    const data = this.summary.summary();
    if (!data) {
      return [];
    }
    const activeShare = data.totalUsers
      ? `${Math.round((data.activeUsers / data.totalUsers) * 100)}%`
      : '';
    return [
      { label: 'ผู้ใช้ทั้งหมด', value: data.totalUsers, icon: 'ph ph-users-three', tone: 'accent' },
      {
        label: 'ใช้งาน',
        value: data.activeUsers,
        delta: activeShare,
        icon: 'ph ph-check-circle',
        tone: 'good',
      },
      {
        label: 'ใกล้หมดอายุ 30 วัน',
        value: data.expiringSoon?.users ?? 0,
        delta: (data.expiringSoon?.users ?? 0) > 0 ? 'ต้องต่ออายุ' : '',
        icon: 'ph ph-clock-countdown',
        tone: 'warn',
      },
      { label: 'หมดอายุแล้ว', value: data.expiredUsers, icon: 'ph ph-prohibit', tone: 'bad' },
    ];
  });

  search = '';
  page = 1;
  limit = 20;

  ngOnInit(): void {
    this.summary.load().subscribe();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .list({ page: this.page, limit: this.limit, search: this.search, isStaff: true })
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

  onPage(event: { first?: number | null; rows?: number | null }): void {
    this.limit = event.rows ?? 20;
    this.page = Math.floor((event.first ?? 0) / this.limit) + 1;
    this.load();
  }

  open(id: string): void {
    void this.router.navigate(['/backoffice/users', id]);
  }

  create(): void {
    void this.router.navigate(['/backoffice/users', 'new']);
  }

  remove(id: string): void {
    this.helper.confirm({
      message: 'ต้องการลบผู้ใช้นี้หรือไม่?',
      accept: () =>
        this.service.remove(id).subscribe({
          next: () => {
            this.helper.toastSuccess('ลบผู้ใช้แล้ว');
            this.summary.invalidate();
            this.summary.load().subscribe();
            this.load();
          },
          error: (err) => this.helper.toastError(apiErrorMessage(err)),
        }),
    });
  }
}
