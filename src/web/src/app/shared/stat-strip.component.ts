import { Component, Input } from '@angular/core';

export interface StatTile {
  label: string;
  value: string | number;
  /** Small note under the headline number — a share, a count, a warning. */
  delta?: string;
  icon: string;
  tone?: 'accent' | 'good' | 'warn' | 'bad' | 'mute';
}

/**
 * The KPI strip above a list. Every number comes from the dashboard summary
 * endpoint — the strip renders nothing rather than showing a placeholder.
 */
@Component({
  selector: 'app-stat-strip',
  standalone: true,
  template: `
    @if (tiles.length) {
      <div class="stat-grid">
        @for (tile of tiles; track tile.label) {
          <div class="stat-card">
            <div class="stat-label">
              <i [class]="tile.icon + ' tone-' + (tile.tone || 'accent')"></i>
              <span>{{ tile.label }}</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="stat-value">{{ tile.value }}</span>
              @if (tile.delta) {
                <span class="stat-delta" [class]="'tone-' + (tile.tone || 'accent')">{{ tile.delta }}</span>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class StatStripComponent {
  @Input() tiles: StatTile[] = [];
}
