import { Component, Input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { enumLabel, statusSeverity } from '../models/common.model';

@Component({
  selector: 'app-status-tag',
  standalone: true,
  imports: [TagModule],
  template: `<p-tag [value]="label" [severity]="severity" />`,
})
export class StatusTagComponent {
  @Input({ required: true }) value = '';

  get label() {
    return enumLabel(this.value);
  }

  get severity() {
    return statusSeverity(this.value);
  }
}
