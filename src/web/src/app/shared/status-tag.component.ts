import { Component, Input } from '@angular/core';
import { enumLabel } from '../models/common.model';
import { chipClass } from './ui';

@Component({
  selector: 'app-status-tag',
  standalone: true,
  template: `
    <span [class]="cssClass">
      <span class="dot"></span>
      {{ label }}
    </span>
  `,
})
export class StatusTagComponent {
  @Input({ required: true }) value = '';

  get label(): string {
    return enumLabel(this.value);
  }

  get cssClass(): string {
    return chipClass(this.value);
  }
}
