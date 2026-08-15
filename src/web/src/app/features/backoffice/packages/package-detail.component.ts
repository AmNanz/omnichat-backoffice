import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BillingCycle } from '../../../models/common.model';
import { PackagesService } from '../../../services/packages.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';

@Component({
  selector: 'app-package-detail',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, InputNumberModule, TextareaModule, ProgressSpinnerModule, PageHeaderComponent, EmptyStateComponent],
  template: `
    <div class="page">
      <app-page-header [title]="isNew ? 'เพิ่มแพ็กเกจ' : 'แก้ไขแพ็กเกจ'" />
      @if (loading()) { <p-card><div class="flex justify-center py-8"><p-progressSpinner /></div></p-card> }
      @else if (error()) { <p-card><app-empty-state [message]="error()!" variant="error" /></p-card> }
      @else {
        <form class="detail-form detail-form-fit" [formGroup]="form" (ngSubmit)="save()">
          <p-card>
            <div class="form-compact">
              <div class="form-section-title">แพ็กเกจ</div>
              <div class="form-row">
                <div class="form-field form-field-grow">
                  <label>ชื่อ</label>
                  <input pInputText formControlName="name" data-testid="package-name" />
                </div>
                <div class="form-field form-field-compact">
                  <label>ราคา</label>
                  <p-inputNumber formControlName="price" [min]="0" mode="decimal" [allowEmpty]="false" data-testid="package-price" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label>รอบบิล</label>
                  <span class="form-static-value">รายเดือน</span>
                </div>
              </div>
              <div class="form-section-title">โควตา</div>
              <div class="form-row">
                <div class="form-field form-field-compact">
                  <label>จำกัดจำนวนบริษัท</label>
                  <input pInputText type="number" min="0" step="1" formControlName="companyLimit" data-testid="package-company-limit" />
                </div>
                <div class="form-field form-field-compact">
                  <label>จำกัดจำนวนผู้ใช้</label>
                  <input pInputText type="number" min="0" step="1" formControlName="userLimit" data-testid="package-user-limit" />
                </div>
              </div>
              <div class="form-field">
                <label>คำอธิบาย</label>
                <textarea pTextarea rows="3" formControlName="description" data-testid="package-description"></textarea>
              </div>
            </div>
            <div class="form-actions">
              <p-button type="button" label="ย้อนกลับ" severity="secondary" [outlined]="true" (onClick)="back()" />
              <div class="form-actions-right">
                <p-button type="submit" label="บันทึก" icon="pi pi-check" [loading]="saving()" data-testid="package-save" />
              </div>
            </div>
          </p-card>
        </form>
      }
    </div>
  `,
})
export class PackageDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(PackagesService);
  private   readonly helper = inject(ConfirmHelper);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  id = ''; isNew = true;
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''], price: [0, [Validators.required, Validators.min(0)]],
    companyLimit: [1, [Validators.required, Validators.min(0)]],
    userLimit: [1, [Validators.required, Validators.min(0)]],
  });
  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ?? 'new';
    this.isNew = this.id === 'new';
    if (!this.isNew) {
      this.loading.set(true);
      this.service.get(this.id).subscribe({
        next: (item) => {
          this.form.patchValue({
            name: item.name, description: item.description ?? '',
            price: item.price,
            companyLimit: item.companyLimit, userLimit: item.userLimit,
          });
          this.loading.set(false);
        },
        error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
      });
    }
  }
  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const raw = this.form.getRawValue();
    const toLimit = (value: unknown) => {
      const n = typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
      return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 1;
    };
    const payload = {
      name: raw.name!, description: raw.description || undefined,
      price: Number(raw.price ?? 0), billingCycle: 'MONTHLY' as BillingCycle,
      companyLimit: toLimit(raw.companyLimit), userLimit: toLimit(raw.userLimit),
    };
    this.saving.set(true);
    const req = this.isNew ? this.service.create(payload) : this.service.update(this.id, payload);
    req.subscribe({
      next: (item) => { this.saving.set(false); this.helper.toastSuccess('บันทึกแพ็กเกจแล้ว'); void this.router.navigate(['/backoffice/packages', item._id]); },
      error: (err) => { this.saving.set(false); this.helper.toastError(apiErrorMessage(err)); },
    });
  }
  back() { void this.router.navigate(['/backoffice/packages']); }
}
