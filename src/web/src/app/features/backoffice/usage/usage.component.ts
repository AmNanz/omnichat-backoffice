import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { UsageByProfile, UsageOverview } from '../../../models/misc.model';
import { Profile } from '../../../models/profile.model';
import { UsageService } from '../../../services/misc.service';
import { ProfilesService } from '../../../services/profiles.service';
import { apiErrorMessage } from '../../../services/http-utils';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';

@Component({
  selector: 'app-usage',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    SelectModule,
    ProgressSpinnerModule,
    TagModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page">
      <app-page-header title="การใช้งาน" subtitle="โควตาและการใช้จริง" />
      <p-card>
      @if (loadingOverview()) { <div class="flex justify-center py-8"><p-progressSpinner /></div> }
      @else if (overviewError()) { <app-empty-state [message]="overviewError()!" variant="error" /> }
      @else {
        @if (overview(); as data) {
          <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
            <p-card><div class="text-sm text-[#7a93a8]">โปรไฟล์</div><div class="text-2xl font-semibold text-[#1c3550]">{{ data.profiles }}</div></p-card>
            <p-card><div class="text-sm text-[#7a93a8]">บริษัท</div><div class="text-2xl font-semibold text-[#1c3550]">{{ data.companies }}</div></p-card>
            <p-card><div class="text-sm text-[#7a93a8]">ผู้ใช้</div><div class="text-2xl font-semibold text-[#1c3550]">{{ data.users }}</div></p-card>
          </div>
        }
      }

      <div class="page-filters mt-4">
        <p-select
          [(ngModel)]="profileId"
          [options]="profileOptions()"
          optionLabel="label"
          optionValue="value"
          placeholder="ค้นหาหรือเลือกโปรไฟล์"
          [filter]="true"
          filterBy="label"
          filterPlaceholder="ค้นหาโปรไฟล์"
          [showClear]="true"
          [loading]="loadingProfiles()"
          styleClass="w-80"
          (onChange)="onProfileChange()"
        />
        <p-button label="โหลดการใช้งานโปรไฟล์" icon="pi pi-search" (onClick)="loadProfile()" />
      </div>

      @if (loadingProfile()) { <div class="flex justify-center py-6"><p-progressSpinner /></div> }
      @else if (profileError()) { <app-empty-state [message]="profileError()!" variant="error" /> }
      @else {
        @if (profileUsage(); as usage) {
          <p-card [header]="usage.profileName">
            <div class="form-grid">
              <div>
                <div class="font-semibold mb-2">บริษัท</div>
                <div>{{ usage.companies.used }} / {{ usage.companies.limit }} (เหลือ {{ usage.companies.remaining }})</div>
                @if (usage.companies.nearLimit) { <p-tag value="ใกล้เต็มโควตา" severity="warn" class="mt-2" /> }
              </div>
              <div>
                <div class="font-semibold mb-2">ผู้ใช้</div>
                <div>{{ usage.users.used }} / {{ usage.users.limit }} (เหลือ {{ usage.users.remaining }})</div>
                @if (usage.users.nearLimit) { <p-tag value="ใกล้เต็มโควตา" severity="warn" class="mt-2" /> }
              </div>
            </div>
          </p-card>
        }
      }
      </p-card>
    </div>
  `,
})
export class UsageComponent implements OnInit {
  private readonly service = inject(UsageService);
  private readonly profilesService = inject(ProfilesService);
  readonly overview = signal<UsageOverview | null>(null);
  readonly profileUsage = signal<UsageByProfile | null>(null);
  readonly profiles = signal<Profile[]>([]);
  readonly loadingOverview = signal(true);
  readonly loadingProfiles = signal(false);
  readonly loadingProfile = signal(false);
  readonly overviewError = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);
  profileId = '';

  profileOptions(): { label: string; value: string }[] {
    return this.profiles().map((item) => ({
      label: item.code ? `${item.name} (${item.code})` : item.name,
      value: String(item._id),
    }));
  }

  ngOnInit() {
    this.loadingProfiles.set(true);
    this.profilesService.list({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.profiles.set(res.items);
        this.loadingProfiles.set(false);
      },
      error: (err) => {
        this.profileError.set(apiErrorMessage(err, 'โหลดโปรไฟล์ไม่สำเร็จ'));
        this.loadingProfiles.set(false);
      },
    });
    this.service.overview().subscribe({
      next: (data) => { this.overview.set(data); this.loadingOverview.set(false); },
      error: (err) => { this.overviewError.set(apiErrorMessage(err)); this.loadingOverview.set(false); },
    });
  }

  onProfileChange(): void {
    if (!this.profileId) {
      this.profileUsage.set(null);
      this.profileError.set(null);
      return;
    }
    this.loadProfile();
  }

  loadProfile() {
    if (!this.profileId) {
      this.profileError.set('ต้องเลือกโปรไฟล์');
      return;
    }
    this.loadingProfile.set(true);
    this.profileError.set(null);
    this.service.byProfile(this.profileId).subscribe({
      next: (data) => { this.profileUsage.set(data); this.loadingProfile.set(false); },
      error: (err) => { this.profileError.set(apiErrorMessage(err)); this.loadingProfile.set(false); },
    });
  }
}
