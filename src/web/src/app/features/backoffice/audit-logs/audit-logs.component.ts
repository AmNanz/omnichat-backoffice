import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { enumLabel } from '../../../models/common.model';
import { AuditLog } from '../../../models/misc.model';
import { AuditLogsService } from '../../../services/misc.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [DatePipe, FormsModule, ButtonModule, CardModule, InputTextModule, TableModule, TagModule, ProgressSpinnerModule, PageHeaderComponent, EmptyStateComponent],
  template: `
    <div class="page">
      <app-page-header title="บันทึกการใช้งาน" subtitle="ประวัติความปลอดภัยและการเปลี่ยนแปลง" />
      <p-card>
      <div class="page-filters">
        <input pInputText placeholder="โมดูล" [(ngModel)]="module" />
        <input pInputText placeholder="การกระทำ" [(ngModel)]="action" />
        <input pInputText placeholder="รหัสผู้ใช้" [(ngModel)]="userId" />
        <p-button label="ค้นหา" icon="pi pi-search" (onClick)="load()" />
      </div>
      @if (loading()) { <div class="flex justify-center py-8"><p-progressSpinner /></div> }
      @else if (error()) { <app-empty-state [message]="error()!" variant="error" /> }
      @else if (!items().length) { <app-empty-state message="ไม่พบบันทึกการใช้งาน" /> }
      @else {
        <p-table [value]="items()" [paginator]="true" [rows]="limit" [totalRecords]="total()" [lazy]="true" (onPage)="onPage($event)">
          <ng-template pTemplate="header"><tr><th>เวลา</th><th>ผู้ใช้</th><th>โมดูล</th><th>การกระทำ</th><th>ทรัพยากร</th></tr></ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>{{ row.createdAt | date:'short' }}</td>
              <td>{{ row.userName || row.userId }}</td>
              <td>{{ row.module }}</td>
              <td><p-tag [value]="enumLabel(row.action)" /></td>
              <td>{{ row.resourceId }}</td>
            </tr>
          </ng-template>
        </p-table>
      }
      </p-card>
    </div>
  `,
})
export class AuditLogsComponent implements OnInit {
  private readonly service = inject(AuditLogsService);
  readonly enumLabel = enumLabel;
  readonly items = signal<AuditLog[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  module = ''; action = ''; userId = ''; page = 1; limit = 20;
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true); this.error.set(null);
    this.service.list({
      page: this.page, limit: this.limit,
      module: this.module || undefined, action: this.action || undefined, userId: this.userId || undefined,
    }).subscribe({
      next: (res) => { this.items.set(res.items); this.total.set(res.total); this.loading.set(false); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
    });
  }
  onPage(event: { first?: number | null; rows?: number | null }) { this.limit = event.rows ?? 20; this.page = Math.floor((event.first ?? 0) / this.limit) + 1; this.load(); }
}
