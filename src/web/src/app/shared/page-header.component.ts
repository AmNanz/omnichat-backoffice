import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="page-toolbar">
      <div>
        <div class="text-sm font-medium text-[#7a93a8] mb-1">ระบบจัดการ</div>
        <h1 class="m-0 text-[1.85rem] font-semibold tracking-tight text-[#1c3550]">{{ title }}</h1>
        @if (subtitle) {
          <p class="m-0 mt-1 text-base font-normal text-[#5b738a]">{{ subtitle }}</p>
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
