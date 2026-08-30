import { Injectable, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ConfirmHelper {
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  confirm(options: {
    message: string;
    header?: string;
    accept: () => void;
  }): void {
    this.confirmation.confirm({
      message: options.message,
      header: options.header ?? 'ยืนยัน',
      icon: 'ph ph-warning',
      accept: options.accept,
    });
  }

  toastSuccess(detail: string, summary = 'สำเร็จ'): void {
    this.messages.add({ severity: 'success', summary, detail });
  }

  toastError(detail: string, summary = 'ข้อผิดพลาด'): void {
    this.messages.add({ severity: 'error', summary, detail });
  }
}
