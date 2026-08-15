import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { NotificationItem } from '../../../models/misc.model';
import { NotificationsService } from '../../../services/misc.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, ButtonModule, CardModule, TableModule, TagModule, ProgressSpinnerModule, PageHeaderComponent, EmptyStateComponent],
  template: `
    <div class="page">
      <app-page-header title="การแจ้งเตือน" subtitle="การแจ้งเตือนของคุณ" />
      <p-card>
      @if (loading()) { <div class="flex justify-center py-8"><p-progressSpinner /></div> }
      @else if (error()) { <app-empty-state [message]="error()!" variant="error" /> }
      @else if (!items().length) { <app-empty-state message="ไม่มีการแจ้งเตือน" /> }
      @else {
        <p-table [value]="items()" [paginator]="true" [rows]="limit" [totalRecords]="total()" [lazy]="true" (onPage)="onPage($event)">
          <ng-template pTemplate="header"><tr><th>หัวข้อ</th><th>ข้อความ</th><th class="col-fit">สถานะ</th><th>สร้างเมื่อ</th><th class="col-fit">จัดการ</th></tr></ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>{{ row.title }}</td><td>{{ row.message }}</td>
              <td class="col-fit"><p-tag [value]="row.isRead ? 'อ่านแล้ว' : 'ยังไม่อ่าน'" [severity]="row.isRead ? 'secondary' : 'info'" /></td>
              <td>{{ row.createdAt | date:'short' }}</td>
              <td class="col-fit">
                @if (!row.isRead) {
                  <p-button label="ทำเครื่องหมายว่าอ่านแล้ว" [text]="true" (onClick)="markRead(row)" />
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
      </p-card>
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private readonly service = inject(NotificationsService);
  private readonly helper = inject(ConfirmHelper);
  readonly items = signal<NotificationItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  page = 1; limit = 20;
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true); this.error.set(null);
    this.service.listMine({ page: this.page, limit: this.limit }).subscribe({
      next: (res) => { this.items.set(res.items); this.total.set(res.total); this.loading.set(false); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
    });
  }
  onPage(event: { first?: number | null; rows?: number | null }) { this.limit = event.rows ?? 20; this.page = Math.floor((event.first ?? 0) / this.limit) + 1; this.load(); }
  markRead(item: NotificationItem) {
    this.service.markRead(item._id).subscribe({
      next: () => { this.helper.toastSuccess('ทำเครื่องหมายว่าอ่านแล้ว'); this.load(); },
      error: (err) => this.helper.toastError(apiErrorMessage(err)),
    });
  }
}
