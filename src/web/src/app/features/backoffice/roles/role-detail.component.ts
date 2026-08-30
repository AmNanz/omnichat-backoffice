import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { EntityStatus } from '../../../models/common.model';
import { PermissionModule } from '../../../models/permission.model';
import { PermissionsService } from '../../../services/permissions.service';
import { RolesService } from '../../../services/roles.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    InputTextModule,
    TextareaModule,
    ProgressSpinnerModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  styles: [
    `
      .perm-modules {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }
      .perm-module {
        border: 1px solid var(--color-divider);
        border-radius: 0.65rem;
        padding: 0.7rem 0.8rem;
        background: color-mix(in srgb, var(--color-bg) 55%, var(--color-surface));
      }
      .perm-module-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.55rem;
      }
      .perm-module-title {
        font-size: 0.8rem;
        font-weight: 500;
        text-transform: capitalize;
        color: var(--color-neutral-200);
      }
      .perm-actions {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
        gap: 0.4rem 0.75rem;
      }
      .perm-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.82rem;
        color: var(--color-neutral-400);
      }
    `,
  ],
  template: `
    <div class="page">
      <app-page-header [title]="isNew ? 'เพิ่มบทบาท' : 'แก้ไขบทบาท'" />
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
            <div class="form-section-title">บทบาท</div>
            <div class="form-field"><label>ชื่อ</label><input pInputText formControlName="name" data-testid="role-name" /></div>
            <div class="form-field" style="grid-column: 1 / -1">
              <label>คำอธิบาย</label>
              <textarea pTextarea rows="2" formControlName="description" data-testid="role-description"></textarea>
            </div>
            <div class="form-section-title">สิทธิ์</div>
            <div class="form-field" style="grid-column: 1 / -1">
              <div class="flex items-center justify-between mb-2">
                <label class="m-0">สิทธิ์ ({{ selectedPermissions().length }})</label>
                <p-button type="button" label="เลือกทั้งหมด" [text]="true" size="small" (onClick)="selectAll(true)" />
              </div>
              <div class="perm-modules">
                @for (mod of modules(); track mod.module) {
                  <div class="perm-module">
                    <div class="perm-module-head">
                      <span class="perm-module-title">{{ moduleLabel(mod) }}</span>
                      <p-checkbox
                        [binary]="true"
                        [ngModel]="isModuleSelected(mod)"
                        [ngModelOptions]="{ standalone: true }"
                        [inputId]="'mod-' + mod.module"
                        (onChange)="toggleModule(mod, $event.checked)"
                      />
                    </div>
                    <div class="perm-actions">
                      @for (permission of mod.permissions; track permission) {
                        <label class="perm-item" [for]="permission">
                          <p-checkbox
                            [binary]="true"
                            [ngModel]="isSelected(permission)"
                            [ngModelOptions]="{ standalone: true }"
                            [inputId]="permission"
                            (onChange)="togglePermission(permission, $event.checked)"
                          />
                          <span>{{ actionLabel(permission) }}</span>
                        </label>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
            </div>
            <div class="form-actions">
              <p-button type="button" label="ย้อนกลับ" severity="secondary" [outlined]="true" (onClick)="back()" />
              <div class="form-actions-right">
                @if (!isNew) {
                  @if (currentStatus() !== 'ACTIVE') {
                    <p-button type="button" label="เปิดใช้งาน" severity="success" [outlined]="true" (onClick)="enable()" data-testid="role-activate" />
                  }
                  @if (currentStatus() === 'ACTIVE') {
                    <p-button type="button" label="ระงับ" severity="warn" [outlined]="true" (onClick)="disable()" data-testid="role-suspend" />
                  }
                  <p-button type="button" label="ลบ" severity="danger" [outlined]="true" (onClick)="remove()" data-testid="role-delete" />
                }
                <p-button type="submit" label="บันทึก" icon="ph ph-check" [loading]="saving()" data-testid="role-save" />
              </div>
            </div>
          </p-card>
        </form>
      }
    </div>
  `,
})
export class RoleDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(RolesService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly helper = inject(ConfirmHelper);

  readonly modules = signal<PermissionModule[]>([]);
  readonly selectedPermissions = signal<string[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentStatus = signal<EntityStatus>('ACTIVE');
  id = '';
  isNew = true;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? 'new';
    this.isNew = this.id === 'new';
    this.permissionsService.catalog().subscribe({
      next: (catalog) => {
        const modules = catalog.modules;
        if (Array.isArray(modules)) {
          this.modules.set(modules);
        } else {
          this.modules.set(
            Object.entries(modules).map(([module, permissions]) => ({ module, permissions })),
          );
        }
      },
      error: (err) => this.helper.toastError(apiErrorMessage(err, 'โหลดสิทธิ์ไม่สำเร็จ')),
    });
    if (!this.isNew) {
      this.loading.set(true);
      this.service.get(this.id).subscribe({
        next: (role) => {
          this.form.patchValue({
            name: role.name,
            description: role.description ?? '',
          });
          this.currentStatus.set(role.status);
          this.selectedPermissions.set([...(role.permissions ?? [])]);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err));
          this.loading.set(false);
        },
      });
    }
  }

  isSelected(permission: string): boolean {
    return this.selectedPermissions().includes(permission);
  }

  isModuleSelected(mod: PermissionModule): boolean {
    return mod.permissions.length > 0 && mod.permissions.every((p) => this.isSelected(p));
  }

  togglePermission(permission: string, checked: boolean): void {
    const next = new Set(this.selectedPermissions());
    if (checked) {
      next.add(permission);
    } else {
      next.delete(permission);
    }
    this.selectedPermissions.set([...next]);
  }

  toggleModule(mod: PermissionModule, checked: boolean): void {
    const next = new Set(this.selectedPermissions());
    for (const permission of mod.permissions) {
      if (checked) {
        next.add(permission);
      } else {
        next.delete(permission);
      }
    }
    this.selectedPermissions.set([...next]);
  }

  selectAll(checked: boolean): void {
    if (!checked) {
      this.selectedPermissions.set([]);
      return;
    }
    this.selectedPermissions.set(this.modules().flatMap((mod) => mod.permissions));
  }

  moduleLabel(mod: PermissionModule): string {
    const map: Record<string, string> = {
      user: 'ผู้ใช้',
      users: 'ผู้ใช้',
      role: 'บทบาท',
      roles: 'บทบาท',
      profile: 'โปรไฟล์',
      profiles: 'โปรไฟล์',
      company: 'บริษัท',
      companies: 'บริษัท',
      package: 'แพ็กเกจ',
      packages: 'แพ็กเกจ',
      subscription: 'การสมัคร',
      subscriptions: 'การสมัคร',
      invoice: 'ใบแจ้งหนี้',
      invoices: 'ใบแจ้งหนี้',
      notification: 'การแจ้งเตือน',
      notifications: 'การแจ้งเตือน',
      audit: 'บันทึกการใช้งาน',
      usage: 'การใช้งาน',
      dashboard: 'แดชบอร์ด',
    };
    const key = (mod.module || '').toLowerCase();
    return map[key] ?? mod.label ?? mod.module;
  }

  actionLabel(permission: string): string {
    const action = permission.split('.')[1] ?? permission;
    const map: Record<string, string> = {
      view: 'ดู',
      create: 'สร้าง',
      update: 'แก้ไข',
      delete: 'ลบ',
      enable: 'เปิดใช้งาน',
      disable: 'ระงับ',
      reset: 'รีเซ็ต',
      cancel: 'ยกเลิก',
      export: 'ส่งออก',
      assign: 'มอบหมาย',
    };
    return map[action] ?? action;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name!,
      permissions: this.selectedPermissions(),
      description: raw.description || undefined,
    };
    this.saving.set(true);
    const req = this.isNew ? this.service.create(payload) : this.service.update(this.id, payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.helper.toastSuccess('บันทึกบทบาทแล้ว');
        void this.router.navigate(['/backoffice/roles']);
      },
      error: (err) => {
        this.saving.set(false);
        this.helper.toastError(apiErrorMessage(err));
      },
    });
  }

  enable(): void {
    this.service.enable(this.id).subscribe({
      next: (role) => {
        this.currentStatus.set(role.status);
        this.helper.toastSuccess('เปิดใช้งานบทบาทแล้ว');
      },
      error: (err) => this.helper.toastError(apiErrorMessage(err)),
    });
  }

  disable(): void {
    this.helper.confirm({
      message: 'ต้องการระงับบทบาทนี้หรือไม่?',
      accept: () =>
        this.service.disable(this.id).subscribe({
          next: (role) => {
            this.currentStatus.set(role.status);
            this.helper.toastSuccess('ระงับบทบาทแล้ว');
          },
          error: (err) => this.helper.toastError(apiErrorMessage(err)),
        }),
    });
  }

  remove(): void {
    this.helper.confirm({
      message: 'ต้องการลบบทบาทนี้หรือไม่?',
      accept: () =>
        this.service.remove(this.id).subscribe({
          next: () => {
            this.helper.toastSuccess('ลบบทบาทแล้ว');
            void this.router.navigate(['/backoffice/roles']);
          },
          error: (err) => this.helper.toastError(apiErrorMessage(err)),
        }),
    });
  }

  back(): void {
    void this.router.navigate(['/backoffice/roles']);
  }
}
