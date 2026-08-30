import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { EntityStatus } from '../../../models/common.model';
import { Role } from '../../../models/role.model';
import { RolesService } from '../../../services/roles.service';
import { UsersService } from '../../../services/users.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    DialogModule,
    PasswordModule,
    ProgressSpinnerModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page">
      <app-page-header [title]="isNew ? 'เพิ่มผู้ใช้' : 'แก้ไขผู้ใช้'" />
      @if (loading()) { <p-card><div class="flex justify-center py-8"><p-progressSpinner /></div></p-card> }
      @else if (error()) { <p-card><app-empty-state [message]="error()!" variant="error" /></p-card> }
      @else {
        <form class="detail-form" [formGroup]="form" (ngSubmit)="save()">
          <p-card>
            <div class="form-grid">
          <div class="form-section-title">บัญชี</div>
          <div class="form-field"><label>ชื่อที่แสดง</label><input pInputText formControlName="displayName" data-testid="user-display-name" /></div>
          <div class="form-field"><label>อีเมล</label><input pInputText formControlName="email" data-testid="user-email" /></div>
          @if (isNew) {
            <div class="form-field"><label>รหัสผ่าน</label>
              <p-password formControlName="password" [feedback]="false" [toggleMask]="true" fluid data-testid="user-password" />
            </div>
          }
          <div class="form-field">
            <label>บทบาท</label>
            <p-select
              formControlName="roleId"
              [options]="roleOptions()"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกบทบาท"
              fluid
              data-testid="user-role"
            />
          </div>
            </div>
            <div class="form-actions">
              <p-button type="button" label="ย้อนกลับ" severity="secondary" [outlined]="true" (onClick)="back()" />
              <div class="form-actions-right">
            @if (!isNew) {
              @if (currentStatus() !== 'ACTIVE') {
                <p-button type="button" label="เปิดใช้งาน" severity="success" [outlined]="true" (onClick)="enable()" data-testid="user-activate" />
              }
              @if (currentStatus() === 'ACTIVE') {
                <p-button type="button" label="ระงับ" severity="warn" [outlined]="true" (onClick)="disable()" data-testid="user-suspend" />
              }
              <p-button type="button" label="ลบ" severity="danger" [outlined]="true" (onClick)="remove()" data-testid="user-delete" />
              <p-button type="button" label="รีเซ็ตรหัสผ่าน" severity="secondary" [outlined]="true" (onClick)="showReset = true" data-testid="user-reset-password" />
            }
            <p-button type="submit" label="บันทึก" icon="ph ph-check" [loading]="saving()" data-testid="user-save" />
              </div>
            </div>
          </p-card>
        </form>
      }
      <p-dialog header="รีเซ็ตรหัสผ่าน" [(visible)]="showReset" [modal]="true" [style]="{ width: '400px' }">
        <div class="form-field">
          <label>รหัสผ่านใหม่</label>
          <p-password [(ngModel)]="resetPassword" [feedback]="false" [toggleMask]="true" fluid data-testid="user-reset-new-password" />
        </div>
        <ng-template pTemplate="footer">
          <p-button label="ยกเลิก" severity="secondary" [text]="true" (onClick)="showReset = false" />
          <p-button label="รีเซ็ต" (onClick)="doReset()" />
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class UserDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly helper = inject(ConfirmHelper);
  private readonly destroyRef = inject(DestroyRef);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentStatus = signal<EntityStatus>('ACTIVE');
  readonly roleOptions = signal<{ label: string; value: string }[]>([]);
  id = ''; isNew = true; showReset = false; resetPassword = '';
  readonly form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    roleId: ['', Validators.required],
  });
  ngOnInit() {
    this.rolesService.list({ page: 1, limit: 100, status: 'ACTIVE' }).subscribe({
      next: (res) => {
        this.roleOptions.set(res.items.map((role) => this.toRoleOption(role)));
      },
      error: (err) => this.helper.toastError(apiErrorMessage(err, 'โหลดบทบาทไม่สำเร็จ')),
    });
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.applyRoute(params.get('id') ?? 'new');
    });
  }
  private applyRoute(id: string) {
    this.id = id;
    this.isNew = id === 'new';
    if (this.isNew) {
      this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.controls.password.updateValueAndValidity();
      this.error.set(null);
      this.loading.set(false);
      return;
    }
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.loadUser();
  }
  private toRoleOption(role: Role) {
    return { label: role.name, value: role._id };
  }
  private loadUser() {
    this.loading.set(true);
    this.service.get(this.id).subscribe({
      next: (item) => {
        const roleId = item.roleIds?.[0] ?? '';
        if (roleId && !this.roleOptions().some((opt) => opt.value === roleId)) {
          this.roleOptions.update((opts) => [...opts, { label: roleId, value: roleId }]);
        }
        this.form.patchValue({
          displayName: item.displayName,
          email: item.email,
          roleId,
        });
        this.currentStatus.set(item.status);
        this.loading.set(false);
      },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
    });
  }
  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const raw = this.form.getRawValue();
    const roleIds = raw.roleId ? [raw.roleId] : [];
    this.saving.set(true);
    if (this.isNew) {
      this.service.create({
        email: raw.email!, password: raw.password!, displayName: raw.displayName!,
        roleIds, isStaff: true,
      }).subscribe({
        next: (item) => { this.saving.set(false); this.helper.toastSuccess('สร้างผู้ใช้แล้ว'); void this.router.navigate(['/backoffice/users', item._id]); },
        error: (err) => { this.saving.set(false); this.helper.toastError(apiErrorMessage(err)); },
      });
    } else {
      this.service.update(this.id, {
        email: raw.email!, displayName: raw.displayName!,
        roleIds, isStaff: true,
      }).subscribe({
        next: () => { this.saving.set(false); this.helper.toastSuccess('บันทึกผู้ใช้แล้ว'); },
        error: (err) => { this.saving.set(false); this.helper.toastError(apiErrorMessage(err)); },
      });
    }
  }
  enable() {
    this.service.enable(this.id).subscribe({
      next: (item) => { this.currentStatus.set(item.status); this.helper.toastSuccess('เปิดใช้งานผู้ใช้แล้ว'); },
      error: (err) => this.helper.toastError(apiErrorMessage(err)),
    });
  }
  disable() {
    this.helper.confirm({
      message: 'ต้องการระงับผู้ใช้นี้หรือไม่?',
      accept: () => this.service.disable(this.id).subscribe({
        next: (item) => { this.currentStatus.set(item.status); this.helper.toastSuccess('ระงับผู้ใช้แล้ว'); },
        error: (err) => this.helper.toastError(apiErrorMessage(err)),
      }),
    });
  }
  remove() {
    this.helper.confirm({
      message: 'ต้องการลบผู้ใช้นี้หรือไม่?',
      accept: () => this.service.remove(this.id).subscribe({
        next: () => { this.helper.toastSuccess('ลบผู้ใช้แล้ว'); void this.router.navigate(['/backoffice/users']); },
        error: (err) => this.helper.toastError(apiErrorMessage(err)),
      }),
    });
  }
  doReset() {
    if (!this.resetPassword || this.resetPassword.length < 6) {
      this.helper.toastError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    this.service.resetPassword(this.id, this.resetPassword).subscribe({
      next: () => { this.showReset = false; this.resetPassword = ''; this.helper.toastSuccess('รีเซ็ตรหัสผ่านแล้ว'); },
      error: (err) => this.helper.toastError(apiErrorMessage(err)),
    });
  }
  back() { void this.router.navigate(['/backoffice/users']); }
}
