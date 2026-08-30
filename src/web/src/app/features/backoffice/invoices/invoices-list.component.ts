import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { INVOICE_STATUS_OPTIONS } from '../../../models/common.model';
import { Invoice } from '../../../models/invoice.model';
import { Profile } from '../../../models/profile.model';
import { InvoicesService } from '../../../services/invoices.service';
import { ProfilesService } from '../../../services/profiles.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { StatusTagComponent } from '../../../shared/status-tag.component';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [DatePipe, FormsModule, ButtonModule, InputTextModule, SelectModule, TableModule, ProgressSpinnerModule, PageHeaderComponent, EmptyStateComponent, StatusTagComponent],
  template: `
    <div class="page">
      <app-page-header title="ใบแจ้งหนี้" subtitle="ใบแจ้งหนี้การเรียกเก็บเงิน">
        <p-button label="เพิ่มใบแจ้งหนี้" icon="ph ph-plus" (onClick)="create()" />
      </app-page-header>
      <div class="panel">
      <div class="panel-head">
        <div class="search-field">
          <i class="ph ph-magnifying-glass"></i>
          <input pInputText placeholder="ค้นหาเลขที่ใบแจ้งหนี้" [(ngModel)]="search" (keyup.enter)="load()" />
        </div>
        <p-select
          [options]="profileOptions()"
          [(ngModel)]="profileId"
          optionLabel="label"
          optionValue="value"
          placeholder="โปรไฟล์"
          [filter]="true"
          filterBy="label"
          filterPlaceholder="ค้นหาโปรไฟล์"
          [showClear]="true"
          (onChange)="load()"
          styleClass="w-64"
        />
        <p-select [options]="statusOptions" [(ngModel)]="invoiceStatus" optionLabel="label" optionValue="value" (onChange)="load()" styleClass="w-44" />
        <p-button label="ค้นหา" icon="ph ph-magnifying-glass" severity="secondary" (onClick)="load()" />
      </div>
      @if (loading()) { <div class="flex justify-center py-8"><p-progressSpinner /></div> }
      @else if (error()) { <div class="p-3"><app-empty-state [message]="error()!" variant="error" /></div> }
      @else if (!items().length) { <div class="p-3"><app-empty-state message="ไม่พบใบแจ้งหนี้" /></div> }
      @else {
        <div class="panel-body">
        <p-table [value]="items()" [paginator]="true" [rows]="limit" [totalRecords]="total()" [lazy]="true" (onPage)="onPage($event)">
          <ng-template pTemplate="header"><tr><th>เลขที่</th><th>โปรไฟล์</th><th>จำนวนเงิน</th><th>ครบกำหนด</th><th class="col-fit">สถานะ</th><th class="col-fit">จัดการ</th></tr></ng-template>
          <ng-template pTemplate="body" let-row>
            <tr class="clickable-row" (click)="open(row._id)">
              <td>{{ row.invoiceNumber || row._id }}</td>
              <td>{{ profileLabel(row.profileId) }}</td>
              <td>{{ row.totalAmount ?? row.amount }}</td>
              <td>{{ row.dueDate | date:'mediumDate' }}</td>
              <td class="col-fit"><app-status-tag [value]="row.status" /></td>
              <td class="col-fit" (click)="$event.stopPropagation()">
                <p-button icon="ph ph-pencil-simple" [rounded]="true" [text]="true" (onClick)="open(row._id)" ariaLabel="แก้ไข" />
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
export class InvoicesListComponent implements OnInit {
  private readonly service = inject(InvoicesService);
  private readonly profilesService = inject(ProfilesService);
  private readonly router = inject(Router);
  readonly statusOptions = INVOICE_STATUS_OPTIONS;
  readonly items = signal<Invoice[]>([]);
  readonly profiles = signal<Profile[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  search = ''; invoiceStatus: string = ''; profileId: string | null = null; page = 1; limit = 20;
  ngOnInit() {
    this.profilesService.list({ page: 1, limit: 100 }).subscribe({
      next: (res) => this.profiles.set(res.items),
    });
    this.load();
  }
  profileOptions(): { label: string; value: string }[] {
    return this.profiles().map((item) => ({
      label: item.code ? `${item.name} (${item.code})` : item.name,
      value: String(item._id),
    }));
  }
  profileLabel(profileId?: string | null): string {
    if (!profileId) {
      return '-';
    }
    const id = String(profileId);
    const profile = this.profiles().find((item) => item._id === id);
    return profile ? `${profile.name} (${profile.code})` : id;
  }
  load() {
    this.loading.set(true); this.error.set(null);
    this.service.list({
      page: this.page, limit: this.limit, search: this.search,
      profileId: this.profileId || undefined, invoiceStatus: this.invoiceStatus || undefined,
    }).subscribe({
      next: (res) => { this.items.set(res.items); this.total.set(res.total); this.loading.set(false); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
    });
  }
  onPage(event: { first?: number | null; rows?: number | null }) { this.limit = event.rows ?? 20; this.page = Math.floor((event.first ?? 0) / this.limit) + 1; this.load(); }
  open(id: string) { void this.router.navigate(['/backoffice/invoices', id]); }
  create() { void this.router.navigate(['/backoffice/invoices', 'new']); }
}
