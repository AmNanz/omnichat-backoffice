import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Package } from '../../../models/package.model';
import { PackagesService } from '../../../services/packages.service';
import { ProfilesService } from '../../../services/profiles.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    ProgressSpinnerModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page">
      <app-page-header [title]="isNew ? 'เพิ่มโปรไฟล์' : 'แก้ไขโปรไฟล์'" />

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
          <div class="form-field">
            <label>ชื่อ</label>
            <input pInputText formControlName="name" data-testid="profile-name" />
          </div>
          <div class="form-field">
            <label>รหัส</label>
            <input pInputText formControlName="code" data-testid="profile-code" />
          </div>
          <div class="form-field" style="grid-column: 1 / -1">
            <label>แพ็กเกจ</label>
            <p-select
              formControlName="packageId"
              [options]="packageOptions()"
              optionLabel="label"
              optionValue="value"
              placeholder="ค้นหาหรือเลือกแพ็กเกจ"
              [filter]="true"
              filterBy="label"
              filterPlaceholder="ค้นหาแพ็กเกจ"
              fluid
              data-testid="profile-package"
            />
          </div>
          <div class="form-field">
            <label>หมายเหตุ</label>
            <textarea pTextarea rows="4" formControlName="notes" data-testid="profile-notes"></textarea>
          </div>
            </div>
            <div class="form-actions">
              <p-button type="button" label="ย้อนกลับ" severity="secondary" [outlined]="true" (onClick)="back()" />
              <div class="form-actions-right">
                <p-button type="submit" label="บันทึก" icon="pi pi-check" [loading]="saving()" data-testid="profile-save" />
              </div>
            </div>
          </p-card>
        </form>
      }
    </div>
  `,
})
export class ProfileDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ProfilesService);
  private readonly packagesService = inject(PackagesService);
  private readonly helper = inject(ConfirmHelper);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly packages = signal<Package[]>([]);

  id = '';
  isNew = true;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: [''],
    packageId: [''],
    notes: [''],
  });

  packageOptions(): { label: string; value: string }[] {
    return [
      { label: 'None', value: '' },
      ...this.packages().map((pkg) => ({ label: pkg.name, value: pkg._id })),
    ];
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? 'new';
    this.isNew = this.id === 'new';
    this.packagesService.list({ page: 1, limit: 100, status: 'ACTIVE' }).subscribe({
      next: (res) => this.packages.set(res.items),
      error: (err) => this.helper.toastError(apiErrorMessage(err, 'โหลดแพ็กเกจไม่สำเร็จ')),
    });
    if (!this.isNew) {
      this.loading.set(true);
      this.service.get(this.id).subscribe({
        next: (item) => {
          this.form.patchValue({
            name: item.name,
            code: item.code,
            packageId: item.packageId ? String(item.packageId) : '',
            notes: item.notes ?? '',
          });
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err));
          this.loading.set(false);
        },
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
      name: raw.name!,
      code: raw.code || undefined,
      packageId: raw.packageId || null,
      notes: raw.notes || undefined,
    };
    this.saving.set(true);
    const req = this.isNew
      ? this.service.create(payload)
      : this.service.update(this.id, payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.helper.toastSuccess('บันทึกโปรไฟล์แล้ว');
        void this.router.navigate(['/backoffice/profiles']);
      },
      error: (err) => {
        this.saving.set(false);
        this.helper.toastError(apiErrorMessage(err));
      },
    });
  }

  back(): void {
    void this.router.navigate(['/backoffice/profiles']);
  }
}
