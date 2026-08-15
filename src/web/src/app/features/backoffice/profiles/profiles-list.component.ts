import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Package } from '../../../models/package.model';
import { Profile } from '../../../models/profile.model';
import { PackagesService } from '../../../services/packages.service';
import { ProfilesService } from '../../../services/profiles.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';

@Component({
  selector: 'app-profiles-list',
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
      <app-page-header title="โปรไฟล์" subtitle="จัดการโปรไฟล์ผู้เช่า">
        <p-button label="เพิ่มโปรไฟล์" icon="pi pi-plus" (onClick)="create()" data-testid="profiles-new" />
      </app-page-header>

      <p-card>
      <div class="page-filters">
        <input pInputText placeholder="ค้นหา..." [(ngModel)]="search" (keyup.enter)="load()" data-testid="profiles-search" />
        <p-button label="ค้นหา" icon="pi pi-search" (onClick)="load()" data-testid="profiles-search-btn" />
      </div>

      @if (loading()) {
        <div class="flex justify-center py-8"><p-progressSpinner /></div>
      } @else if (error()) {
        <app-empty-state [message]="error()!" variant="error" />
      } @else if (!items().length) {
        <app-empty-state message="ไม่พบโปรไฟล์" />
      } @else {
        <p-table [value]="items()" [paginator]="true" [rows]="limit" [totalRecords]="total()"
          [lazy]="true" (onPage)="onPage($event)" [rowsPerPageOptions]="[10,20,50]">
          <ng-template pTemplate="header">
            <tr>
              <th>ชื่อ</th>
              <th>รหัส</th>
              <th>แพ็กเกจ</th>
              <th class="col-fit">จัดการ</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr class="clickable-row" (click)="open(row._id)">
              <td>{{ row.name }}</td>
              <td>{{ row.code }}</td>
              <td>{{ packageName(row.packageId) }}</td>
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
export class ProfilesListComponent implements OnInit {
  private readonly service = inject(ProfilesService);
  private readonly packagesService = inject(PackagesService);
  private readonly router = inject(Router);
  private readonly helper = inject(ConfirmHelper);

  readonly items = signal<Profile[]>([]);
  readonly packages = signal<Package[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  search = '';
  page = 1;
  limit = 20;

  ngOnInit(): void {
    this.packagesService.list({ page: 1, limit: 100 }).subscribe({
      next: (res) => this.packages.set(res.items),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .list({ page: this.page, limit: this.limit, search: this.search })
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
            this.load();
          },
          error: (err) => this.helper.toastError(apiErrorMessage(err)),
        }),
    });
  }

  packageName(packageId?: string | null): string {
    if (!packageId) {
      return '-';
    }
    const id = String(packageId);
    return this.packages().find((pkg) => pkg._id === id)?.name ?? id;
  }
}
