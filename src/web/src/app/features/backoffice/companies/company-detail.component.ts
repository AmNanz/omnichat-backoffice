import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { EntityStatus } from '../../../models/common.model';
import { Package } from '../../../models/package.model';
import { Profile } from '../../../models/profile.model';
import { CompaniesService } from '../../../services/companies.service';
import { apiErrorMessage, toIsoDate } from '../../../services/http-utils';
import { PackagesService } from '../../../services/packages.service';
import { ProfilesService } from '../../../services/profiles.service';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    InputTextModule,
    SelectModule,
    ProgressSpinnerModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page">
      <app-page-header [title]="isNew ? 'เพิ่มบริษัท' : 'แก้ไขบริษัท'" />

      @if (loading()) {
        <p-card>
          <div class="flex justify-center py-8"><p-progressSpinner /></div>
        </p-card>
      } @else if (error()) {
        <p-card>
          <app-empty-state [message]="error()!" variant="error" />
        </p-card>
      } @else {
        <form class="detail-form" [formGroup]="form" (ngSubmit)="save()">
          <p-card>
            <div class="form-grid">
              <div class="form-section-title">ข้อมูลบริษัท</div>
              <div class="form-field">
                <label>ชื่อ</label>
                <input pInputText formControlName="name" data-testid="company-name" />
              </div>
              <div class="form-field">
                <label>รหัส (slug)</label>
                <input pInputText formControlName="slug" data-testid="company-slug" />
              </div>
              <div class="form-field">
                <label>โปรไฟล์</label>
                <p-select
                  formControlName="profileId"
                  [options]="profileOptions()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="ค้นหาหรือเลือกโปรไฟล์"
                  [filter]="true"
                  filterBy="label"
                  filterPlaceholder="ค้นหาโปรไฟล์"
                  fluid
                  data-testid="company-profile"
                />
              </div>
              <div class="form-field">
                <label>แพ็กเกจ</label>
                <p-select
                  formControlName="packageId"
                  [options]="packageOptions()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="ไม่ระบุ"
                  [filter]="true"
                  filterBy="label"
                  filterPlaceholder="ค้นหาแพ็กเกจ"
                  [showClear]="true"
                  fluid
                  data-testid="company-package"
                />
              </div>
              <div class="form-section-title">กำหนดการ</div>
              <div class="form-field">
                <label>วันเริ่มต้น</label>
                <p-datepicker
                  formControlName="startDate"
                  [showIcon]="true"
                  dateFormat="yy-mm-dd"
                  fluid
                  data-testid="company-start-date"
                />
              </div>
              <div class="form-field">
                <label>วันหมดอายุ</label>
                <p-datepicker
                  formControlName="expirationDate"
                  [showIcon]="true"
                  dateFormat="yy-mm-dd"
                  fluid
                  data-testid="company-expiration-date"
                />
              </div>
            </div>
            <div class="form-actions">
              <p-button
                type="button"
                label="ย้อนกลับ"
                severity="secondary"
                [outlined]="true"
                (onClick)="back()"
              />
              <div class="form-actions-right">
                @if (!isNew) {
                  @if (currentStatus() !== 'ACTIVE') {
                    <p-button
                      type="button"
                      label="เปิดใช้งาน"
                      severity="success"
                      [outlined]="true"
                      (onClick)="enable()"
                      data-testid="company-activate"
                    />
                  }
                  @if (currentStatus() === 'ACTIVE') {
                    <p-button
                      type="button"
                      label="ระงับ"
                      severity="warn"
                      [outlined]="true"
                      (onClick)="disable()"
                      data-testid="company-suspend"
                    />
                  }
                  <p-button
                    type="button"
                    label="ลบ"
                    severity="danger"
                    [outlined]="true"
                    (onClick)="remove()"
                    data-testid="company-delete"
                  />
                }
                <p-button
                  type="submit"
                  label="บันทึก"
                  icon="pi pi-check"
                  [loading]="saving()"
                  data-testid="company-save"
                />
              </div>
            </div>
          </p-card>
        </form>
      }
    </div>
  `,
})
export class CompanyDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(CompaniesService);
  private readonly profilesService = inject(ProfilesService);
  private readonly packagesService = inject(PackagesService);
  private readonly helper = inject(ConfirmHelper);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentStatus = signal<EntityStatus>('ACTIVE');
  readonly profiles = signal<Profile[]>([]);
  readonly packages = signal<Package[]>([]);

  id = '';
  isNew = true;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [''],
    profileId: ['', Validators.required],
    packageId: [null as string | null],
    startDate: [null as Date | null],
    expirationDate: [null as Date | null],
  });

  profileOptions(): { label: string; value: string }[] {
    return this.profiles().map((item) => ({
      label: item.code ? `${item.name} (${item.code})` : item.name,
      value: String(item._id),
    }));
  }

  packageOptions(): { label: string; value: string }[] {
    return this.packages().map((item) => ({
      label: item.name,
      value: String(item._id),
    }));
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? 'new';
    this.isNew = this.id === 'new';
    this.loading.set(true);

    forkJoin({
      profiles: this.profilesService.list({ page: 1, limit: 100, status: 'ACTIVE' }),
      packages: this.packagesService.list({ page: 1, limit: 100, status: 'ACTIVE' }),
    }).subscribe({
      next: ({ profiles, packages }) => {
        this.profiles.set(profiles.items);
        this.packages.set(packages.items);

        if (this.isNew) {
          const profileId = this.route.snapshot.queryParamMap.get('profileId');
          if (profileId) {
            this.form.patchValue({ profileId });
            this.ensureProfileOption(profileId);
          }
          this.loading.set(false);
          return;
        }
        this.form.controls.profileId.disable();
        this.loadItem();
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private loadItem(): void {
    this.service.get(this.id).subscribe({
      next: (item) => {
        const profileId = String(item.profileId);
        const packageId = item.packageId ? String(item.packageId) : null;
        this.ensureProfileOption(profileId);
        if (packageId) {
          this.ensurePackageOption(packageId);
        }
        this.form.patchValue({
          name: item.name,
          slug: item.slug,
          profileId,
          packageId,
          startDate: item.startDate ? new Date(item.startDate) : null,
          expirationDate: item.expirationDate
            ? new Date(item.expirationDate)
            : null,
        });
        this.currentStatus.set(item.status);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private ensureProfileOption(profileId: string): void {
    if (!this.profiles().some((item) => String(item._id) === profileId)) {
      this.profilesService.get(profileId).subscribe({
        next: (item) => this.profiles.update((list) => [item, ...list]),
      });
    }
  }

  private ensurePackageOption(packageId: string): void {
    if (!this.packages().some((item) => String(item._id) === packageId)) {
      this.packagesService.get(packageId).subscribe({
        next: (item) => this.packages.update((list) => [item, ...list]),
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      ...(this.isNew ? { profileId: raw.profileId! } : {}),
      name: raw.name!,
      slug: raw.slug || undefined,
      packageId: raw.packageId || null,
      startDate: toIsoDate(raw.startDate),
      expirationDate: toIsoDate(raw.expirationDate) ?? null,
    };
    this.saving.set(true);
    const req = this.isNew
      ? this.service.create(payload)
      : this.service.update(this.id, payload);
    req.subscribe({
      next: (item) => {
        this.saving.set(false);
        this.helper.toastSuccess('บันทึกบริษัทแล้ว');
        void this.router.navigate(['/backoffice/companies', item._id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.helper.toastError(apiErrorMessage(err));
      },
    });
  }

  enable(): void {
    this.service.enable(this.id).subscribe({
      next: (item) => {
        this.currentStatus.set(item.status);
        this.helper.toastSuccess('เปิดใช้งานบริษัทแล้ว');
      },
      error: (err) => this.helper.toastError(apiErrorMessage(err)),
    });
  }

  disable(): void {
    this.helper.confirm({
      message: 'ต้องการระงับบริษัทนี้หรือไม่?',
      accept: () =>
        this.service.disable(this.id).subscribe({
          next: (item) => {
            this.currentStatus.set(item.status);
            this.helper.toastSuccess('ระงับบริษัทแล้ว');
          },
          error: (err) => this.helper.toastError(apiErrorMessage(err)),
        }),
    });
  }

  remove(): void {
    this.helper.confirm({
      message: 'ต้องการลบบริษัทนี้หรือไม่?',
      accept: () =>
        this.service.remove(this.id).subscribe({
          next: () => {
            this.helper.toastSuccess('ลบบริษัทแล้ว');
            void this.router.navigate(['/backoffice/companies']);
          },
          error: (err) => this.helper.toastError(apiErrorMessage(err)),
        }),
    });
  }

  back(): void {
    void this.router.navigate(['/backoffice/companies']);
  }
}
