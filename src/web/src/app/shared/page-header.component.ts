import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="page-toolbar">
      <div>
        <h1 class="m-0 text-[25px] font-medium tracking-[-0.02em] text-[var(--color-text)]">
          {{ title }}
        </h1>
        @if (subtitle) {
          <p class="m-0 mt-1 text-[13px] font-normal text-[var(--color-neutral-500)]">
            {{ subtitle }}
          </p>
        }
      </div>
      <div class="flex items-center gap-2">
        <ng-content />
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
}
