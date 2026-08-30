import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="state-message" [class.error]="variant === 'error'">
      <i [class]="variant === 'error' ? 'ph ph-warning-circle' : 'ph ph-tray'" style="font-size: 18px"></i>
      <span>{{ message }}</span>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() message = 'ไม่พบข้อมูล';
  @Input() variant: 'empty' | 'error' = 'empty';
}
