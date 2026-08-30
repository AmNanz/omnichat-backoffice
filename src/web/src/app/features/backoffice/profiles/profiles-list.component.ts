import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Profile } from '../../../models/profile.model';
import { ProfilesService } from '../../../services/profiles.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { StatStripComponent, StatTile } from '../../../shared/stat-strip.component';
import { StatusTagComponent } from '../../../shared/status-tag.component';
import { SummaryStore, initials } from '../../../shared/ui';

@Component({
  selector: 'app-profiles-list',
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
      <app-page-header title="โปรไฟล์" subtitle="ผู้เช่าทั้งหมดในระบบ และบัญชีเจ้าของ">
        <p-button
          label="เพิ่มโปรไฟล์"
          icon="ph ph-plus"
          (onClick)="create()"
          data-testid="profiles-new"
        />
      </app-page-header>

      <app-stat-strip [tiles]="tiles()" />

      <div class="panel">
        <div class="panel-head">
          <div class="search-field">
            <i class="ph ph-magnifying-glass"></i>
            <input
              pInputText
              placeholder="ค้นหาชื่อโปรไฟล์ หรือรหัส"
              [(ngModel)]="search"
              (keyup.enter)="load()"
              data-testid="profiles-search"
            />
          </div>
          <p-button
            label="ค้นหา"
            icon="ph ph-magnifying-glass"
            severity="secondary"
            (onClick)="load()"
            data-testid="profiles-search-btn"
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
          <div class="p-3"><app-empty-state message="ไม่พบโปรไฟล์" /></div>
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
                  <th>โปรไฟล์</th>
                  <th>รหัส</th>
                  <th>บัญชีเจ้าของ</th>
                  <th>โควตา</th>
                  <th>สถานะ</th>
                  <th>สร้างเมื่อ</th>
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
                        <span>{{ row.accountEmail || row.email || '—' }}</span>
                      </span>
                    </span>
                  </td>
                  <td><span class="cell-mono">{{ row.code }}</span></td>
                  <td>{{ row.accountName || row.accountDisplayName || '—' }}</td>
                  <td class="whitespace-nowrap text-[13px] text-[var(--color-neutral-400)]">
                    {{ row.companyLimit }} บริษัท · {{ row.userLimit }} ผู้ใช้
                  </td>
                  <td><app-status-tag [value]="row.status" /></td>
                  <td class="whitespace-nowrap">{{ row.createdAt | date: 'mediumDate' }}</td>
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
export class ProfilesListComponent implements OnInit {
  private readonly service = inject(ProfilesService);
  private readonly router = inject(Router);
  private readonly helper = inject(ConfirmHelper);
  private readonly summary = inject(SummaryStore);

  readonly items = signal<Profile[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly initials = initials;

  readonly tiles = computed<StatTile[]>(() => {
    const data = this.summary.summary();
    if (!data) {
      return [];
    }
    return [
      {
        label: 'โปรไฟล์ทั้งหมด',
        value: data.totalProfiles,
        icon: 'ph ph-identification-card',
        tone: 'accent',
      },
      {
        label: 'บริษัทในสังกัด',
        value: data.totalCompanies,
        delta: `ใช้งาน ${data.activeCompanies}`,
        icon: 'ph ph-buildings',
        tone: 'good',
      },
      {
        label: 'การสมัครที่ใช้งาน',
        value: data.activeSubscriptions,
        icon: 'ph ph-arrows-clockwise',
        tone: 'accent',
      },
      {
        label: 'ใบแจ้งหนี้ค้างชำระ',
        value: data.pendingInvoices,
        delta: data.overdueInvoices > 0 ? `เกินกำหนด ${data.overdueInvoices}` : '',
        icon: 'ph ph-receipt',
        tone: data.overdueInvoices > 0 ? 'bad' : 'warn',
      },
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
    this.service.list({ page: this.page, limit: this.limit, search: this.search }).subscribe({
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
    void this.router.navigate(['/backoffice/profiles', id]);
  }

  create(): void {
    void this.router.navigate(['/backoffice/profiles', 'new']);
  }

  remove(id: string): void {
    this.helper.confirm({
      message: 'ต้องการลบโปรไฟล์นี้หรือไม่?',
      accept: () =>
        this.service.remove(id).subscribe({
          next: () => {
            this.helper.toastSuccess('ลบโปรไฟล์แล้ว');
            this.summary.invalidate();
            this.summary.load().subscribe();
            this.load();
          },
          error: (err) => this.helper.toastError(apiErrorMessage(err)),
        }),
    });
  }
}
