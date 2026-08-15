import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { INVOICE_STATUS_OPTIONS } from '../../../models/common.model';
import { Profile } from '../../../models/profile.model';
import { InvoicesService } from '../../../services/invoices.service';
import { ProfilesService } from '../../../services/profiles.service';
import { apiErrorMessage, toIsoDate } from '../../../services/http-utils';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, InputNumberModule, SelectModule, TextareaModule, DatePickerModule, ProgressSpinnerModule, PageHeaderComponent, EmptyStateComponent],
  template: `
    <div class="page">
      <app-page-header [title]="isNew ? 'เพิ่มใบแจ้งหนี้' : 'แก้ไขใบแจ้งหนี้'" />
      @if (loading()) { <p-card><div class="flex justify-center py-8"><p-progressSpinner /></div></p-card> }
      @else if (error()) { <p-card><app-empty-state [message]="error()!" variant="error" /></p-card> }
      @else {
        <form class="detail-form" [formGroup]="form" (ngSubmit)="save()">
          <p-card>
            <div class="form-grid">
          <div class="form-section-title">การเรียกเก็บเงิน</div>
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
              [showClear]="false"
              fluid
            />
          </div>
          <div class="form-field"><label>จำนวนเงิน</label><p-inputNumber formControlName="amount" [min]="0" mode="decimal" fluid /></div>
          <div class="form-field"><label>ภาษีมูลค่าเพิ่ม</label><p-inputNumber formControlName="vat" [min]="0" mode="decimal" fluid /></div>
          <div class="form-field"><label>สถานะ</label>
            <p-select formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" fluid />
          </div>
          <div class="form-field"><label>รอบบิล</label><input pInputText formControlName="billingPeriod" /></div>
          <div class="form-section-title">วันที่</div>
          <div class="form-field"><label>วันที่ออกใบแจ้งหนี้</label><p-datepicker formControlName="invoiceDate" [showIcon]="true" dateFormat="yy-mm-dd" fluid /></div>
          <div class="form-field"><label>วันครบกำหนด</label><p-datepicker formControlName="dueDate" [showIcon]="true" dateFormat="yy-mm-dd" fluid /></div>
          <div class="form-field" style="grid-column: 1 / -1"><label>หมายเหตุ</label><textarea pTextarea rows="3" formControlName="notes"></textarea></div>
            </div>
            <div class="form-actions">
              <p-button type="button" label="ย้อนกลับ" severity="secondary" [outlined]="true" (onClick)="back()" />
              <div class="form-actions-right">
            @if (!isNew) {
              <p-button type="button" label="ยกเลิกใบแจ้งหนี้" severity="danger" [outlined]="true" (onClick)="cancelInvoice()" />
            }
            <p-button type="submit" label="บันทึก" icon="pi pi-check" [loading]="saving()" />
              </div>
            </div>
          </p-card>
        </form>
      }
    </div>
  `,
})
export class InvoiceDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(InvoicesService);
  private readonly profilesService = inject(ProfilesService);
  private readonly helper = inject(ConfirmHelper);
  readonly statusOptions = INVOICE_STATUS_OPTIONS.filter((o) => o.value);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly profiles = signal<Profile[]>([]);
  id = ''; isNew = true;
  readonly form = this.fb.group({
    profileId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0)]],
    vat: [0],
    status: ['DRAFT'],
    billingPeriod: [''],
    invoiceDate: [null as Date | null],
    dueDate: [null as Date | null, Validators.required],
    notes: [''],
  });

  profileOptions(): { label: string; value: string }[] {
    return this.profiles().map((item) => ({
      label: item.code ? `${item.name} (${item.code})` : item.name,
      value: String(item._id),
    }));
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ?? 'new';
    this.isNew = this.id === 'new';
    this.loading.set(true);
    this.profilesService.list({ page: 1, limit: 100, status: 'ACTIVE' }).subscribe({
      next: (res) => {
        this.profiles.set(res.items);
        if (!this.isNew) {
          this.loadItem();
          return;
        }
        this.loading.set(false);
      },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
    });
  }

  private loadItem(): void {
    this.service.get(this.id).subscribe({
      next: (item) => {
        const profileId = String(item.profileId);
        this.ensureSelectedProfile(profileId);
        this.form.patchValue({
          profileId,
          amount: item.amount, vat: item.vat ?? 0, status: item.status,
          billingPeriod: item.billingPeriod ?? '',
          invoiceDate: item.invoiceDate ? new Date(item.invoiceDate) : null,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          notes: item.notes ?? '',
        });
        this.form.controls.profileId.disable();
        this.loading.set(false);
      },
      error: (err) => { this.error.set(apiErrorMessage(err)); this.loading.set(false); },
    });
  }

  private ensureSelectedProfile(profileId: string): void {
    if (!this.profiles().some((item) => String(item._id) === profileId)) {
      this.profilesService.get(profileId).subscribe({
        next: (item) => this.profiles.update((list) => [item, ...list]),
      });
    }
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const raw = this.form.getRawValue();
    const payload = {
      profileId: raw.profileId!,
      amount: raw.amount!, vat: raw.vat ?? 0, status: raw.status as any,
      billingPeriod: raw.billingPeriod || undefined,
      invoiceDate: toIsoDate(raw.invoiceDate), dueDate: toIsoDate(raw.dueDate)!,
      notes: raw.notes || undefined,
    };
    this.saving.set(true);
    const req = this.isNew ? this.service.create(payload) : this.service.update(this.id, payload);
    req.subscribe({
      next: (item) => { this.saving.set(false); this.helper.toastSuccess('บันทึกใบแจ้งหนี้แล้ว'); void this.router.navigate(['/backoffice/invoices', item._id]); },
      error: (err) => { this.saving.set(false); this.helper.toastError(apiErrorMessage(err)); },
    });
  }
  cancelInvoice() {
    this.helper.confirm({
      message: 'ต้องการยกเลิกใบแจ้งหนี้นี้หรือไม่?',
      accept: () => this.service.cancel(this.id).subscribe({
        next: () => { this.helper.toastSuccess('ยกเลิกใบแจ้งหนี้แล้ว'); this.ngOnInit(); },
        error: (err) => this.helper.toastError(apiErrorMessage(err)),
      }),
    });
  }
  back() { void this.router.navigate(['/backoffice/invoices']); }
}
