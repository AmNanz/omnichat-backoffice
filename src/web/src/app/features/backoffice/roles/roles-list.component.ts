import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Role } from '../../../models/role.model';
import { RolesService } from '../../../services/roles.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TableModule,
    ProgressSpinnerModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page">
      <app-page-header title="บทบาท" subtitle="บทบาทและสิทธิ์การเข้าถึง">
        <p-button label="เพิ่มบทบาท" icon="pi pi-plus" (onClick)="create()" data-testid="roles-new" />
      </app-page-header>
      <p-card>
      <div class="page-filters">
        <input pInputText placeholder="ค้นหา..." [(ngModel)]="search" (keyup.enter)="load()" data-testid="roles-search" />
        <p-button label="ค้นหา" icon="pi pi-search" (onClick)="load()" data-testid="roles-search-btn" />
      </div>
      @if (loading()) { <div class="flex justify-center py-8"><p-progressSpinner /></div> }
      @else if (error()) { <app-empty-state [message]="error()!" variant="error" /> }
      @else if (!items().length) { <app-empty-state message="ไม่พบบทบาท" /> }
      @else {
        <p-table [value]="items()" [paginator]="true" [rows]="limit" [totalRecords]="total()" [lazy]="true" (onPage)="onPage($event)">
          <ng-template pTemplate="header"><tr><th>ชื่อ</th><th>สิทธิ์</th><th class="col-fit">จัดการ</th></tr></ng-template>
          <ng-template pTemplate="body" let-row>
            <tr class="clickable-row" (click)="open(row._id)">
              <td>{{ row.name }}</td>
              <td>{{ (row.permissions || []).length }}</td>
              <td class="col-fit" (click)="$event.stopPropagation()">
                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (onClick)="open(row._id)" ariaLabel="แก้ไข" />
                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="remove(row._id)" ariaLabel="ลบ" />
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
      </p-card>
    </div>
  `,
})
export class RolesListComponent implements OnInit {
  private readonly service = inject(RolesService);
  private readonly router = inject(Router);
  private readonly helper = inject(ConfirmHelper);
  readonly items = signal<Role[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  search = ''; page = 1; limit = 20;
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true); this.error.set(null);
    this.service.list({ page: this.page, limit: this.limit, search: this.search }).subscribe({
      next: (res) => { this.items.set(res.items); this.total.set(res.total); this.loading.set(false); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
    });
  }
  onPage(event: { first?: number | null; rows?: number | null }) { this.limit = event.rows ?? 20; this.page = Math.floor((event.first ?? 0) / this.limit) + 1; this.load(); }
  open(id: string) { void this.router.navigate(['/backoffice/roles', id]); }
  create() { void this.router.navigate(['/backoffice/roles', 'new']); }
  remove(id: string) {
    this.helper.confirm({
      message: 'ต้องการลบบทบาทนี้หรือไม่?',
      accept: () => this.service.remove(id).subscribe({
        next: () => { this.helper.toastSuccess('ลบบทบาทแล้ว'); this.load(); },
        error: (err) => this.helper.toastError(apiErrorMessage(err)),
      }),
    });
  }
}
