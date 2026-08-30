import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { EntityStatus, enumLabel } from '../../../models/common.model';
import { AuditLog, UsageByProfile } from '../../../models/misc.model';
import { Package } from '../../../models/package.model';
import { Profile } from '../../../models/profile.model';
import { CompaniesService } from '../../../services/companies.service';
import { apiErrorMessage, toIsoDate } from '../../../services/http-utils';
import { AuditLogsService, UsageService } from '../../../services/misc.service';
import { PackagesService } from '../../../services/packages.service';
import { ProfilesService } from '../../../services/profiles.service';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { StatusTagComponent } from '../../../shared/status-tag.component';
import { actionIcon, chipClass, daysUntil, percent, quotaTone } from '../../../shared/ui';

interface QuotaBar {
  label: string;
  text: string;
  pct: number;
  color: string;
}

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    InputTextModule,
    SelectModule,
    ProgressSpinnerModule,
    EmptyStateComponent,
    StatusTagComponent,
  ],
  styles: [
    `
      .detail-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
        gap: 16px;
        align-items: start;
      }

      @media (max-width: 1100px) {
        .detail-grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }

      .rail-card {
        padding: 14px;
      }

      .quota-row {
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin-top: 10px;
      }

      .quota-row .labels {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
      }

      .timeline-row {
        display: flex;
        gap: 10px;
        padding: 7px 0;
      }

      .timeline-icon {
        width: 22px;
        height: 22px;
        flex: none;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--color-neutral-900);
        box-shadow: inset 0 0 0 1px var(--color-divider);
        font-size: 12px;
      }

      .timeline-text {
        display: flex;
        flex-direction: column;
        line-height: 1.35;
        min-width: 0;
      }

      .timeline-text strong {
        font-size: 13px;
        font-weight: 400;
      }

      .timeline-text span {
        font-size: 11px;
        color: var(--color-neutral-600);
      }
    `,
  ],
  template: `
    <div class="page">
      @if (loading()) {
        <div class="surface-card surface-pad">
          <div class="flex justify-center py-8"><p-progressSpinner /></div>
        </div>
      } @else if (error()) {
        <div class="surface-card surface-pad">
          <app-empty-state [message]="error()!" variant="error" />
        </div>
      } @else {
        <div class="flex items-center gap-3 flex-wrap">
          <p-button
            label="บริษัท"
            icon="ph ph-arrow-left"
            severity="secondary"
            (onClick)="back()"
          />
          <div class="flex-1 min-w-[200px]">
            <div class="flex items-center gap-[9px] flex-wrap">
              <h1 class="m-0 text-[25px] font-medium tracking-[-0.02em]">
                {{ isNew ? 'เพิ่มบริษัท' : form.controls.name.value || 'บริษัท' }}
              </h1>
              @if (!isNew) {
                <app-status-tag [value]="currentStatus()" />
              }
            </div>
            @if (!isNew && metaLine()) {
              <p class="m-0 mt-1 text-[13px] text-[var(--color-neutral-500)]">{{ metaLine() }}</p>
            }
          </div>
          <div class="flex gap-2 flex-wrap">
            @if (!isNew) {
              @if (currentStatus() !== 'ACTIVE') {
                <p-button
                  type="button"
                  label="เปิดใช้งาน"
                  icon="ph ph-check-circle"
                  severity="secondary"
                  (onClick)="enable()"
                  data-testid="company-activate"
                />
              } @else {
                <p-button
                  type="button"
                  label="ระงับ"
                  icon="ph ph-pause"
                  severity="secondary"
                  (onClick)="disable()"
                  data-testid="company-suspend"
                />
              }
              <p-button
                type="button"
                label="ลบ"
                icon="ph ph-trash"
                severity="danger"
                (onClick)="remove()"
                data-testid="company-delete"
              />
            }
            <p-button
              type="button"
              label="บันทึก"
              icon="ph ph-check"
              [loading]="saving()"
              (onClick)="save()"
              data-testid="company-save"
            />
          </div>
        </div>

        <div class="detail-grid">
          <form class="detail-form surface-card surface-pad" [formGroup]="form" (ngSubmit)="save()">
            <div class="form-grid">
              <div class="form-section-title">ข้อมูลบริษัท</div>
              <div class="form-field">
                <label>ชื่อบริษัท</label>
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

              <hr class="hr" style="grid-column: 1 / -1" />

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
              @if (expiryHint(); as hint) {
                <p class="form-hint" style="grid-column: 1 / -1">{{ hint }}</p>
              }
            </div>

            <div class="form-actions">
              <p-button
                type="button"
                label="ย้อนกลับ"
                icon="ph ph-arrow-left"
                severity="secondary"
                (onClick)="back()"
              />
              <div class="form-actions-right">
                <p-button
                  type="submit"
                  label="บันทึก"
                  icon="ph ph-check"
                  [loading]="saving()"
                />
              </div>
            </div>
          </form>

          @if (!isNew) {
            <div class="flex flex-col gap-3">
              @if (quotaBars().length) {
                <div class="surface-card rail-card">
                  <div class="section-label">โควตาของโปรไฟล์</div>
                  @for (bar of quotaBars(); track bar.label) {
                    <div class="quota-row">
                      <div class="labels">
                        <span class="text-[var(--color-neutral-300)]">{{ bar.label }}</span>
                        <span class="text-[var(--color-neutral-400)]">{{ bar.text }}</span>
                      </div>
                      <div class="meter">
                        <div
                          class="meter-fill"
                          [style.width.%]="bar.pct"
                          [style.background]="bar.color"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              }

              <div class="surface-card rail-card">
                <div class="section-label mb-1">ไทม์ไลน์</div>
                @if (!timeline().length) {
                  <p class="form-hint mt-2">ยังไม่มีประวัติการเปลี่ยนแปลง</p>
                } @else {
                  @for (entry of timeline(); track entry._id) {
                    <div class="timeline-row">
                      <span class="timeline-icon">
                        <i [class]="icon(entry.action)"></i>
                      </span>
                      <span class="timeline-text">
                        <strong>{{ label(entry.action) }}</strong>
                        <span>
                          {{ entry.userName || entry.userId || 'ระบบ' }} ·
                          {{ entry.createdAt | date: 'medium' }}
                        </span>
                      </span>
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>
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
  private readonly usageService = inject(UsageService);
  private readonly auditService = inject(AuditLogsService);
  private readonly helper = inject(ConfirmHelper);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentStatus = signal<EntityStatus>('ACTIVE');
  readonly profiles = signal<Profile[]>([]);
  readonly packages = signal<Package[]>([]);
  readonly quotaBars = signal<QuotaBar[]>([]);
  readonly timeline = signal<AuditLog[]>([]);
  readonly metaLine = signal('');

  readonly icon = actionIcon;
  readonly label = enumLabel;
  readonly chipClass = chipClass;

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

  /** A countdown under the date fields, mirroring the list's expiry note. */
  expiryHint(): string | null {
    const days = daysUntil(this.form.controls.expirationDate.value);
    if (days == null) {
      return null;
    }
    if (days < 0) {
      return `หมดอายุแล้ว ${Math.abs(days)} วัน`;
    }
    return `เหลืออีก ${days} วัน — ระบบจะแจ้งเตือนอัตโนมัติ 30 วันก่อนหมดอายุ`;
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
          expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
        });
        this.currentStatus.set(item.status);
        this.metaLine.set(
          [item.slug, item.updatedAt ? `แก้ไขล่าสุด ${new Date(item.updatedAt).toLocaleString('th-TH')}` : '']
            .filter(Boolean)
            .join(' · '),
        );
        this.loading.set(false);
        this.loadRail(profileId);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  /**
   * The right rail reads real data only: quota comes from the profile's usage
   * record, the timeline from the audit log for this company's id.
   */
  private loadRail(profileId: string): void {
    this.usageService
      .byProfile(profileId)
      .pipe(catchError(() => of(null)))
      .subscribe((usage: UsageByProfile | null) => {
        if (!usage) {
          this.quotaBars.set([]);
          return;
        }
        this.quotaBars.set([
          this.toBar('บริษัท', usage.companies),
          this.toBar('ผู้ใช้', usage.users),
        ]);
      });

    this.auditService
      .list({ page: 1, limit: 50, module: 'companies', resourceId: this.id })
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        const rows = (res?.items ?? []).filter(
          (row) => !row.resourceId || String(row.resourceId) === this.id,
        );
        this.timeline.set(rows.slice(0, 6));
      });
  }

  private toBar(label: string, quota: { used: number; limit: number }): QuotaBar {
    const pct = percent(quota.used, quota.limit);
    return {
      label,
      text: `${quota.used} / ${quota.limit}`,
      pct,
      color: quotaTone(pct),
    };
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
    const req = this.isNew ? this.service.create(payload) : this.service.update(this.id, payload);
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
