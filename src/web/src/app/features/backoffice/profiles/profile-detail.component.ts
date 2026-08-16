import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TextareaModule } from 'primeng/textarea';
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
    PasswordModule,
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
            <label>ที่อยู่</label>
            <textarea pTextarea rows="3" formControlName="address" data-testid="profile-address"></textarea>
          </div>
          <div class="form-field">
            <label>เมล</label>
            <input pInputText formControlName="email" data-testid="profile-email" />
          </div>
          <div class="form-field">
            <label>เบอร์โทรศัพท์</label>
            <input pInputText formControlName="phone" data-testid="profile-phone" />
          </div>
          <div class="form-field" style="grid-column: 1 / -1">
            <label>เลขนิติบุคคล</label>
            <input pInputText formControlName="legalEntityNumber" data-testid="profile-legal-entity" />
          </div>
          <div class="form-field" style="grid-column: 1 / -1">
            <label>หมายเหตุ</label>
            <textarea pTextarea rows="4" formControlName="notes" data-testid="profile-notes"></textarea>
          </div>
          <div class="form-section-title">บัญชี</div>
          @if (isNew) {
            <p class="form-hint" style="grid-column: 1 / -1">
              ระบบจะสร้างบทบาท Admin ในแอปแชทให้อัตโนมัติ และผูกกับบัญชีนี้
            </p>
          }
          <div class="form-field">
            <label>ชื่อที่แสดง</label>
            <input pInputText formControlName="accountDisplayName" data-testid="profile-account-name" />
          </div>
          <div class="form-field">
            <label>อีเมล</label>
            <input pInputText formControlName="accountEmail" data-testid="profile-account-email" />
          </div>
          <div class="form-field">
            <label>{{ isNew ? 'รหัสผ่าน' : 'รหัสผ่านใหม่' }}</label>
            <p-password
              formControlName="accountPassword"
              [feedback]="false"
              [toggleMask]="true"
              [placeholder]="isNew ? '' : 'เว้นว่างหากไม่เปลี่ยน'"
              fluid
              data-testid="profile-account-password"
            />
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
  private readonly helper = inject(ConfirmHelper);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  id = '';
  isNew = true;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: [''],
    address: [''],
    email: ['', [Validators.email]],
    phone: [''],
    legalEntityNumber: [''],
    notes: [''],
    accountDisplayName: ['', [Validators.required, Validators.minLength(2)]],
    accountEmail: ['', [Validators.required, Validators.email]],
    accountPassword: [''],
  });

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? 'new';
    this.isNew = this.id === 'new';
    if (this.isNew) {
      this.form.controls.accountPassword.setValidators([
        Validators.required,
        Validators.minLength(6),
      ]);
    }
    this.form.controls.accountPassword.updateValueAndValidity();
    if (!this.isNew) {
      this.loading.set(true);
      this.service.get(this.id).subscribe({
        next: (item) => {
          this.form.patchValue({
            name: item.name,
            code: item.code,
            address: item.address ?? '',
            email: item.email ?? '',
            phone: item.phone ?? '',
            legalEntityNumber: item.legalEntityNumber ?? '',
            notes: item.notes ?? '',
            accountDisplayName: item.accountDisplayName ?? item.accountName ?? '',
            accountEmail: item.accountEmail ?? '',
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
    if (!this.isNew && raw.accountPassword && raw.accountPassword.length < 6) {
      this.helper.toastError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    const payload = {
      name: raw.name!,
      code: raw.code || undefined,
      address: raw.address || null,
      email: raw.email || null,
      phone: raw.phone || null,
      legalEntityNumber: raw.legalEntityNumber || null,
      notes: raw.notes || null,
      accountDisplayName: raw.accountDisplayName!,
      accountEmail: raw.accountEmail!,
      ...(raw.accountPassword ? { accountPassword: raw.accountPassword } : {}),
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
