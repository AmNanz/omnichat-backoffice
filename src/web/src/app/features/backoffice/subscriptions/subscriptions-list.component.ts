import { DatePipe } from '@angular/common';
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
import { Subscription } from '../../../models/subscription.model';
import { PackagesService } from '../../../services/packages.service';
import { ProfilesService } from '../../../services/profiles.service';
import { SubscriptionsService } from '../../../services/subscriptions.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';

@Component({
  selector: 'app-subscriptions-list',
  standalone: true,
  imports: [
    DatePipe,
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
      <app-page-header title="การสมัคร" subtitle="การกำหนดแพ็กเกจ">
        <p-button label="เพิ่มการสมัคร" icon="pi pi-plus" (onClick)="create()" data-testid="subscriptions-new" />
      </app-page-header>
      <p-card>
      <div class="page-filters">
        <input pInputText placeholder="ค้นหา..." [(ngModel)]="search" (keyup.enter)="load()" data-testid="subscriptions-search" />
        <p-button label="ค้นหา" icon="pi pi-search" (onClick)="load()" data-testid="subscriptions-search-btn" />
      </div>
      @if (loading()) { <div class="flex justify-center py-8"><p-progressSpinner /></div> }
      @else if (error()) { <app-empty-state [message]="error()!" variant="error" /> }
      @else if (!items().length) { <app-empty-state message="ไม่พบการสมัคร" /> }
      @else {
        <p-table [value]="items()" [paginator]="true" [rows]="limit" [totalRecords]="total()" [lazy]="true" (onPage)="onPage($event)">
          <ng-template pTemplate="header"><tr><th>โปรไฟล์</th><th>แพ็กเกจ</th><th>วันหมดอายุ</th><th class="col-fit">จัดการ</th></tr></ng-template>
          <ng-template pTemplate="body" let-row>
            <tr class="clickable-row" (click)="open(row._id)">
              <td>{{ profileLabel(row.profileId) }}</td>
              <td>{{ packageName(row.packageId) }}</td>
              <td>{{ row.expirationDate | date:'mediumDate' }}</td>
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
export class SubscriptionsListComponent implements OnInit {
  private readonly service = inject(SubscriptionsService);
  private readonly profilesService = inject(ProfilesService);
  private readonly packagesService = inject(PackagesService);
  private readonly router = inject(Router);
  private readonly helper = inject(ConfirmHelper);
  readonly items = signal<Subscription[]>([]);
  readonly profiles = signal<Profile[]>([]);
  readonly packages = signal<Package[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  search = ''; page = 1; limit = 20;
  ngOnInit() {
    this.profilesService.list({ page: 1, limit: 100 }).subscribe({
      next: (res) => this.profiles.set(res.items),
    });
    this.packagesService.list({ page: 1, limit: 100 }).subscribe({
      next: (res) => this.packages.set(res.items),
    });
    this.load();
  }
  load() {
    this.loading.set(true); this.error.set(null);
    this.service.list({ page: this.page, limit: this.limit, search: this.search }).subscribe({
      next: (res) => { this.items.set(res.items); this.total.set(res.total); this.loading.set(false); },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
    });
  }
  onPage(event: { first?: number | null; rows?: number | null }) { this.limit = event.rows ?? 20; this.page = Math.floor((event.first ?? 0) / this.limit) + 1; this.load(); }
  open(id: string) { void this.router.navigate(['/backoffice/subscriptions', id]); }
  create() { void this.router.navigate(['/backoffice/subscriptions', 'new']); }
  profileLabel(profileId?: string | null): string {
    if (!profileId) {
      return '-';
    }
    const id = String(profileId);
    const profile = this.profiles().find((item) => item._id === id);
    return profile ? `${profile.name} (${profile.code})` : id;
  }
  packageName(packageId?: string | null): string {
    if (!packageId) {
      return '-';
    }
    const id = String(packageId);
    return this.packages().find((pkg) => pkg._id === id)?.name ?? id;
  }
  remove(id: string) {
    this.helper.confirm({
      message: 'ต้องการลบการสมัครนี้หรือไม่?',
      accept: () => this.service.remove(id).subscribe({
        next: () => { this.helper.toastSuccess('ลบการสมัครแล้ว'); this.load(); },
        error: (err) => this.helper.toastError(apiErrorMessage(err)),
      }),
    });
  }
}
