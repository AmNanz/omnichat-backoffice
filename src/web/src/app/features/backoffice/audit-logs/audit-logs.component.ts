import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { enumLabel } from '../../../models/common.model';
import { AuditLog } from '../../../models/misc.model';
import { AuditLogsService } from '../../../services/misc.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { MODULE_LABELS, actionChipClass, actionIcon, initials, moduleLabel } from '../../../shared/ui';

/** The modules and actions the API records, offered as filters. */
const MODULE_OPTIONS = [
  { label: 'ทุกโมดูล', value: '' },
  ...Object.entries(MODULE_LABELS).map(([value, label]) => ({ label, value })),
];

const ACTION_OPTIONS = [
  { label: 'ทุกการกระทำ', value: '' },
  { label: 'เข้าสู่ระบบ', value: 'LOGIN' },
  { label: 'ออกจากระบบ', value: 'LOGOUT' },
  { label: 'สร้าง', value: 'CREATE' },
  { label: 'แก้ไข', value: 'UPDATE' },
  { label: 'ลบ', value: 'DELETE' },
  { label: 'ระงับ', value: 'DISABLE' },
  { label: 'เปิดใช้งาน', value: 'ENABLE' },
  { label: 'เปลี่ยนบทบาท', value: 'CHANGE_ROLE' },
  { label: 'เปลี่ยนสิทธิ์', value: 'CHANGE_PERMISSION' },
  { label: 'เปลี่ยนแพ็กเกจ', value: 'CHANGE_PACKAGE' },
  { label: 'เปลี่ยนโควตา', value: 'CHANGE_LIMIT' },
  { label: 'สร้างใบแจ้งหนี้', value: 'CREATE_INVOICE' },
];

@Component({
  selector: 'app-audit-logs',
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
  ],
  template: `
    <div class="page">
      <app-page-header title="บันทึกการใช้งาน" subtitle="ประวัติความปลอดภัยและการเปลี่ยนแปลง" />

      <div class="panel">
        <div class="panel-head">
          <div class="search-field">
            <i class="ph ph-magnifying-glass"></i>
            <input
              pInputText
              placeholder="ค้นหารหัสผู้ใช้"
              [(ngModel)]="userId"
              (keyup.enter)="applyFilters()"
            />
          </div>
          <p-select
            [(ngModel)]="module"
            [options]="moduleOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="ทุกโมดูล"
            styleClass="w-44"
            (onChange)="applyFilters()"
          />
          <p-select
            [(ngModel)]="action"
            [options]="actionOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="ทุกการกระทำ"
            styleClass="w-44"
            (onChange)="applyFilters()"
          />
          <p-button
            label="ค้นหา"
            icon="ph ph-magnifying-glass"
            severity="secondary"
            (onClick)="applyFilters()"
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
          <div class="p-3"><app-empty-state message="ไม่พบบันทึกการใช้งาน" /></div>
        } @else {
          <div class="panel-body">
            <p-table
              [value]="items()"
              [paginator]="true"
              [rows]="limit"
              [totalRecords]="total()"
              [lazy]="true"
              (onPage)="onPage($event)"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>เวลา</th>
                  <th>ผู้ใช้</th>
                  <th>โมดูล</th>
                  <th>การกระทำ</th>
                  <th>ทรัพยากร</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-row>
                <tr>
                  <td class="whitespace-nowrap text-[13px] text-[var(--color-neutral-400)]">
                    {{ row.createdAt | date: 'medium' }}
                  </td>
                  <td class="whitespace-nowrap">
                    <span class="cell-lead">
                      <span class="initials initials-round">
                        {{ initials(row.userName || row.userId) }}
                      </span>
                      <span>{{ row.userName || row.userId || '—' }}</span>
                    </span>
                  </td>
                  <td class="text-[13px] text-[var(--color-neutral-400)]">
                    {{ moduleLabel(row.module) }}
                  </td>
                  <td>
                    <span [class]="actionChipClass(row.action)">
                      <i [class]="actionIcon(row.action)"></i>
                      {{ enumLabel(row.action) }}
                    </span>
                  </td>
                  <td><span class="cell-mono">{{ row.resourceId || '—' }}</span></td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        }
      </div>
    </div>
  `,
})
export class AuditLogsComponent implements OnInit {
  private readonly service = inject(AuditLogsService);

  readonly enumLabel = enumLabel;
  readonly actionIcon = actionIcon;
  readonly actionChipClass = actionChipClass;
  readonly initials = initials;
  readonly moduleLabel = moduleLabel;
  readonly moduleOptions = MODULE_OPTIONS;
  readonly actionOptions = ACTION_OPTIONS;

  readonly items = signal<AuditLog[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  module = '';
  action = '';
  userId = '';
  page = 1;
  limit = 20;

  ngOnInit(): void {
    this.load();
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .list({
        page: this.page,
        limit: this.limit,
        module: this.module || undefined,
        action: this.action || undefined,
        userId: this.userId || undefined,
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

  onPage(event: { first?: number | null; rows?: number | null }): void {
    this.limit = event.rows ?? 20;
    this.page = Math.floor((event.first ?? 0) / this.limit) + 1;
    this.load();
  }
}
