import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="state-message" [class.error]="variant === 'error'">
      <i [class]="variant === 'error' ? 'pi pi-exclamation-circle' : 'pi pi-inbox'"></i>
      <span>{{ message }}</span>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() message = 'ไม่พบข้อมูล';
  @Input() variant: 'empty' | 'error' = 'empty';
}
