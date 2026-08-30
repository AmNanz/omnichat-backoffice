import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { CompaniesService } from '../../../services/companies.service';
import { ProfilesService } from '../../../services/profiles.service';
import { UsersService } from '../../../services/users.service';
import { SummaryStore, initials } from '../../../shared/ui';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: 'invoices';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SearchHit {
  title: string;
  meta: string;
  kind: string;
  icon: string;
  route: string;
}

interface SearchGroup {
  label: string;
  items: SearchHit[];
}

/** Breadcrumb labels, keyed by the first segment under /backoffice. */
const SECTION_LABELS: Record<string, string> = {
  dashboard: 'แดชบอร์ด',
  usage: 'การใช้งาน',
  profiles: 'โปรไฟล์',
  companies: 'บริษัท',
  packages: 'แพ็กเกจ',
  subscriptions: 'การสมัคร',
  invoices: 'ใบแจ้งหนี้',
  users: 'ผู้ใช้',
  roles: 'บทบาท',
  notifications: 'การแจ้งเตือน',
  'audit-logs': 'บันทึกการใช้งาน',
};

const NAV_COLLAPSED_KEY = 'backoffice.nav.collapsed';

@Component({
  selector: 'app-backoffice-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        overflow: hidden;
      }

      .layout {
        display: grid;
        grid-template-columns: var(--nav-width) minmax(0, 1fr);
        grid-template-rows: 56px minmax(0, 1fr);
        grid-template-areas:
          'sidebar topbar'
          'sidebar content';
        height: 100%;
        overflow: hidden;
        background: var(--color-bg);
        color: var(--color-text);
        font-size: 15px;
      }

      /* ── sidebar ─────────────────────────────────────────────────────── */

      .sidebar {
        grid-area: sidebar;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
        background: linear-gradient(180deg, var(--color-bg-lift) 0%, var(--color-bg) 60%);
        box-shadow: inset -1px 0 0 var(--color-divider);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        height: 56px;
        padding: 0 14px;
        flex-shrink: 0;
      }

      .brand-mark {
        width: 30px;
        height: 30px;
        flex: none;
        object-fit: contain;
      }

      .brand-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .brand-text img {
        height: 15px;
        width: auto;
        object-fit: contain;
      }

      .brand-text span {
        font-size: 10px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--color-neutral-600);
      }

      .nav {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 6px 8px 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .nav-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .nav-group-label {
        font-size: 10px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--color-neutral-600);
        padding: 6px 10px 4px;
      }

      .nav a {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 8px;
        color: var(--color-neutral-400);
        text-decoration: none;
        font-size: 14px;
        font-weight: 400;
      }

      .nav a i {
        font-size: 17px;
        width: 18px;
        flex: none;
        text-align: center;
      }

      .nav a span.label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .nav a:hover {
        background: color-mix(in srgb, var(--color-text) 7%, transparent);
        color: var(--color-text);
      }

      .nav a.active {
        background: color-mix(in srgb, var(--color-accent) 16%, transparent);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 40%, transparent);
        color: var(--color-accent-200);
        font-weight: 500;
      }

      .nav-badge {
        margin-left: auto;
        font-size: 10px;
        padding: 2px 7px;
        border-radius: 6px;
        background: var(--color-accent-800);
        color: var(--color-accent-100);
      }

      .nav-foot {
        flex-shrink: 0;
        padding: 10px 8px 14px;
        box-shadow: inset 0 1px 0 var(--color-divider);
      }

      /* Chrome buttons are plain elements here — PrimeNG's button carries
         padding and ripple this dense shell does not want. */
      .chrome-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font: inherit;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.2;
        color: var(--color-text);
        background: transparent;
        border: 1px solid var(--color-divider);
        border-radius: var(--radius-md);
        padding: var(--space-2) 10px;
        cursor: pointer;
      }

      .chrome-btn:hover {
        background: color-mix(in srgb, var(--color-text) 7%, transparent);
      }

      .chrome-btn:active {
        background: color-mix(in srgb, var(--color-text) 14%, transparent);
      }

      .chrome-btn.block {
        width: 100%;
      }

      .chrome-btn.icon {
        width: 36px;
        height: 36px;
        padding: 0;
        border-color: transparent;
        color: var(--color-neutral-300);
      }

      /* ── topbar ──────────────────────────────────────────────────────── */

      .topbar {
        grid-area: topbar;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 0 16px;
        box-shadow: inset 0 -1px 0 var(--color-divider);
        background: color-mix(in srgb, var(--color-surface) 55%, var(--color-bg));
      }

      .crumbs {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 13px;
        color: var(--color-neutral-500);
        min-width: 0;
      }

      .crumbs i.ph-house {
        font-size: 15px;
      }

      .crumbs i.sep {
        font-size: 11px;
        color: var(--color-neutral-700);
      }

      .crumbs .section {
        color: var(--color-neutral-300);
      }

      .crumbs .leaf {
        color: var(--color-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .search-trigger {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 8px;
        width: 320px;
        min-height: 34px;
        padding: 0 10px;
        border: 1px solid var(--color-divider);
        border-radius: 8px;
        background: var(--color-surface);
        color: var(--color-neutral-500);
        font: inherit;
        font-size: 13px;
        text-align: left;
        cursor: pointer;
      }

      .search-trigger:hover {
        border-color: color-mix(in srgb, var(--color-text) 32%, transparent);
      }

      .search-trigger span.hint {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .kbd {
        font-size: 11px;
        padding: 1px 5px;
        border-radius: 4px;
        border: 1px solid var(--color-divider);
        color: var(--color-neutral-400);
      }

      .topbar-right {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .bell {
        position: relative;
      }

      .bell .dot {
        position: absolute;
        top: 7px;
        right: 8px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--color-accent);
      }

      .vrule {
        width: 1px;
        height: 22px;
        background: var(--color-divider);
        margin: 0 2px;
      }

      .user-chip {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 3px 6px 3px 3px;
        border-radius: 8px;
      }

      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--color-accent-800);
        color: var(--color-accent-100);
        font-size: 12px;
        font-weight: 600;
      }

      .user-meta {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
      }

      .user-meta strong {
        font-size: 13px;
        font-weight: 500;
      }

      .user-meta span {
        font-size: 11px;
        color: var(--color-neutral-500);
        max-width: 12rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* ── content ─────────────────────────────────────────────────────── */

      .content {
        grid-area: content;
        overflow: auto;
        min-width: 0;
        min-height: 0;
        padding: 20px 22px 28px;
        background: radial-gradient(
          ellipse 70% 60% at 100% 0%,
          color-mix(in srgb, var(--color-accent) 9%, transparent),
          transparent 60%
        );
      }

      /* ── command palette ─────────────────────────────────────────────── */

      .palette-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1200;
        display: grid;
        align-items: flex-start;
        justify-items: center;
        padding: 96px var(--space-4) var(--space-4);
        background: color-mix(in srgb, #0d0e18 62%, transparent);
        backdrop-filter: blur(2px);
      }

      .palette {
        width: min(620px, 100%);
        display: flex;
        flex-direction: column;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        overflow: hidden;
      }

      .palette-head {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        box-shadow: inset 0 -1px 0 var(--color-divider);
      }

      .palette-head i {
        font-size: 18px;
        color: var(--color-neutral-500);
      }

      .palette-head input {
        flex: 1;
        min-width: 0;
        border: 0;
        background: transparent;
        font: inherit;
        font-size: 16px;
        color: var(--color-text);
        caret-color: var(--color-accent);
        padding: 0;
      }

      .palette-head input::placeholder {
        color: var(--color-neutral-600);
      }

      /* The palette's field is borderless by design and is focused the moment
         the dialog opens, so the accent ring would frame it permanently; the
         caret carries focus here instead. */
      .palette-head input:focus-visible {
        outline: none;
      }

      .palette-body {
        padding: 8px 8px 12px;
        max-height: 420px;
        overflow: auto;
      }

      .palette-group-label {
        font-size: 10px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--color-neutral-600);
        padding: 8px 14px 4px;
      }

      .palette-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 8px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        font: inherit;
        color: var(--color-text);
        text-align: left;
        cursor: pointer;
      }

      .palette-item:hover,
      .palette-item.selected {
        background: color-mix(in srgb, var(--color-accent) 14%, transparent);
      }

      .palette-item > i {
        font-size: 16px;
        color: var(--color-neutral-400);
        width: 18px;
        flex: none;
        text-align: center;
      }

      .palette-item-text {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
        min-width: 0;
      }

      .palette-item-text strong {
        font-size: 14px;
        font-weight: 400;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .palette-item-text span {
        font-size: 11px;
        color: var(--color-neutral-600);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .palette-item .kind {
        margin-left: auto;
        font-size: 11px;
        color: var(--color-neutral-600);
        flex: none;
      }

      .palette-empty {
        padding: 22px 14px;
        text-align: center;
        font-size: 13px;
        color: var(--color-neutral-600);
      }

      .palette-foot {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 9px 14px;
        box-shadow: inset 0 1px 0 var(--color-divider);
        font-size: 11px;
        color: var(--color-neutral-600);
      }

      @media (max-width: 960px) {
        .layout {
          grid-template-columns: 64px minmax(0, 1fr);
        }
        .content {
          padding: 14px;
        }
        .search-trigger {
          width: auto;
        }
        .search-trigger span.hint,
        .user-meta {
          display: none;
        }
      }
    `,
  ],
  template: `
    <div class="layout" [style.--nav-width]="navOpen() ? '236px' : '64px'">
      <aside class="sidebar">
        <div class="brand">
          <img class="brand-mark" src="brand/mindchat-mark.png" alt="mindchat" />
          @if (navOpen()) {
            <div class="brand-text">
              <img src="brand/mindchat-wordmark.png" alt="mindchat" />
              <span>Back-office</span>
            </div>
          }
        </div>

        <nav class="nav">
          @for (group of navGroups; track group.label) {
            <div class="nav-group">
              @if (navOpen()) {
                <div class="nav-group-label">{{ group.label }}</div>
              }
              @for (item of group.items; track item.route) {
                <a
                  [routerLink]="item.route"
                  routerLinkActive="active"
                  [title]="item.label"
                  [attr.data-testid]="navTestId(item.route)"
                >
                  <i [class]="item.icon"></i>
                  @if (navOpen()) {
                    <span class="label">{{ item.label }}</span>
                  }
                  @if (navOpen() && item.badge === 'invoices' && summary.pendingInvoices() > 0) {
                    <span class="nav-badge">{{ summary.pendingInvoices() }}</span>
                  }
                </a>
              }
            </div>
          }
        </nav>

        <div class="nav-foot">
          <button
            type="button"
            class="chrome-btn block"
            [style.justify-content]="navOpen() ? 'flex-start' : 'center'"
            (click)="toggleNav()"
            [attr.aria-label]="navOpen() ? 'ย่อเมนู' : 'ขยายเมนู'"
          >
            <i [class]="navOpen() ? 'ph ph-sidebar-simple' : 'ph ph-sidebar'" style="font-size: 16px"></i>
            @if (navOpen()) {
              <span>ย่อเมนู</span>
            }
          </button>
        </div>
      </aside>

      <header class="topbar">
        <div class="crumbs">
          <i class="ph ph-house"></i>
          <span>ระบบจัดการ</span>
          <i class="ph ph-caret-right sep"></i>
          <span class="section">{{ crumbSection() }}</span>
          @if (crumbLeaf()) {
            <i class="ph ph-caret-right sep"></i>
            <span class="leaf">{{ crumbLeaf() }}</span>
          }
        </div>

        <button type="button" class="search-trigger" (click)="openSearch()" data-testid="global-search">
          <i class="ph ph-magnifying-glass" style="font-size: 15px"></i>
          <span class="hint">ค้นหาทั้งระบบ — บริษัท ผู้ใช้ โปรไฟล์</span>
          <span class="kbd">⌘K</span>
        </button>

        <div class="topbar-right">
          <button
            type="button"
            class="chrome-btn icon bell"
            title="การแจ้งเตือน"
            aria-label="การแจ้งเตือน"
            (click)="openNotifications()"
          >
            <i class="ph ph-bell" style="font-size: 17px"></i>
            <span class="dot"></span>
          </button>
          <div class="vrule"></div>
          <div class="user-chip">
            <div class="avatar">{{ avatarLabel }}</div>
            <div class="user-meta">
              <strong>{{ displayName }}</strong>
              <span>{{ auth.currentUser()?.email || 'เข้าสู่ระบบแล้ว' }}</span>
            </div>
          </div>
          <button
            type="button"
            class="chrome-btn icon"
            title="ออกจากระบบ"
            aria-label="ออกจากระบบ"
            (click)="auth.logout()"
            data-testid="logout"
          >
            <i class="ph ph-sign-out" style="font-size: 17px"></i>
          </button>
        </div>
      </header>

      <main class="content">
        <router-outlet />
      </main>
    </div>

    @if (searchOpen()) {
      <div class="palette-backdrop" (click)="closeSearch()">
        <div class="palette" (click)="$event.stopPropagation()">
          <div class="palette-head">
            <i class="ph ph-magnifying-glass"></i>
            <input
              #searchInput
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchInput()"
              placeholder="ค้นหาบริษัท ผู้ใช้ โปรไฟล์"
              aria-label="ค้นหาทั้งระบบ"
            />
            <span class="kbd">ESC</span>
          </div>

          <div class="palette-body">
            @if (searching()) {
              <div class="palette-empty">กำลังค้นหา…</div>
            } @else if (!searchTerm.trim()) {
              <div class="palette-empty">พิมพ์เพื่อค้นหาบริษัท ผู้ใช้ หรือโปรไฟล์</div>
            } @else if (!searchGroups().length) {
              <div class="palette-empty">ไม่พบผลลัพธ์สำหรับ “{{ searchTerm }}”</div>
            } @else {
              @for (group of searchGroups(); track group.label) {
                <div class="palette-group-label">{{ group.label }}</div>
                @for (hit of group.items; track hit.route) {
                  <button type="button" class="palette-item" (click)="goTo(hit)">
                    <i [class]="hit.icon"></i>
                    <span class="palette-item-text">
                      <strong>{{ hit.title }}</strong>
                      <span>{{ hit.meta }}</span>
                    </span>
                    <span class="kind">{{ hit.kind }}</span>
                  </button>
                }
              }
            }
          </div>

          <div class="palette-foot">
            <span>↵ เปิด</span>
            <span>ESC ปิด</span>
            <span style="margin-left: auto">ค้นหาได้ทุกโมดูล</span>
          </div>
        </div>
      </div>
    }
  `,
})
export class BackofficeLayoutComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly summary = inject(SummaryStore);
  private readonly router = inject(Router);
  private readonly companies = inject(CompaniesService);
  private readonly profiles = inject(ProfilesService);
  private readonly users = inject(UsersService);

  readonly navOpen = signal(this.readNavPreference());
  readonly searchOpen = signal(false);
  readonly searching = signal(false);
  readonly searchGroups = signal<SearchGroup[]>([]);
  readonly crumbSection = signal('');
  readonly crumbLeaf = signal('');

  searchTerm = '';
  private searchTimer?: ReturnType<typeof setTimeout>;
  private searchSeq = 0;

  readonly navGroups: NavGroup[] = [
    {
      label: 'ภาพรวม',
      items: [
        { label: 'แดชบอร์ด', route: '/backoffice/dashboard', icon: 'ph ph-squares-four' },
        { label: 'การใช้งาน', route: '/backoffice/usage', icon: 'ph ph-chart-line-up' },
      ],
    },
    {
      label: 'ผู้เช่า',
      items: [
        { label: 'โปรไฟล์', route: '/backoffice/profiles', icon: 'ph ph-identification-card' },
        { label: 'บริษัท', route: '/backoffice/companies', icon: 'ph ph-buildings' },
      ],
    },
    {
      label: 'การเรียกเก็บเงิน',
      items: [
        { label: 'แพ็กเกจ', route: '/backoffice/packages', icon: 'ph ph-package' },
        { label: 'การสมัคร', route: '/backoffice/subscriptions', icon: 'ph ph-arrows-clockwise' },
        { label: 'ใบแจ้งหนี้', route: '/backoffice/invoices', icon: 'ph ph-receipt', badge: 'invoices' },
      ],
    },
    {
      label: 'สิทธิ์เข้าใช้',
      items: [
        { label: 'ผู้ใช้', route: '/backoffice/users', icon: 'ph ph-users-three' },
        { label: 'บทบาท', route: '/backoffice/roles', icon: 'ph ph-shield-check' },
      ],
    },
    {
      label: 'การดำเนินงาน',
      items: [
        { label: 'การแจ้งเตือน', route: '/backoffice/notifications', icon: 'ph ph-bell' },
        {
          label: 'บันทึกการใช้งาน',
          route: '/backoffice/audit-logs',
          icon: 'ph ph-clock-counter-clockwise',
        },
      ],
    },
  ];

  ngOnInit(): void {
    this.summary.load().subscribe();
    this.updateCrumbs(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateCrumbs(event.urlAfterRedirects));
  }

  get displayName(): string {
    return this.auth.currentUser()?.displayName || this.auth.currentUser()?.email || 'ผู้ใช้';
  }

  get avatarLabel(): string {
    return initials(this.displayName).slice(0, 1) || 'U';
  }

  navTestId(route: string): string | null {
    const ids: Record<string, string> = {
      '/backoffice/roles': 'nav-roles',
      '/backoffice/users': 'nav-users',
      '/backoffice/packages': 'nav-packages',
      '/backoffice/profiles': 'nav-profiles',
      '/backoffice/companies': 'nav-companies',
      '/backoffice/subscriptions': 'nav-subscriptions',
    };
    return ids[route] ?? null;
  }

  toggleNav(): void {
    const next = !this.navOpen();
    this.navOpen.set(next);
    try {
      localStorage.setItem(NAV_COLLAPSED_KEY, next ? '0' : '1');
    } catch {
      // A browser with site data blocked still gets a working toggle.
    }
  }

  openNotifications(): void {
    void this.router.navigate(['/backoffice/notifications']);
  }

  /** ⌘K / Ctrl-K opens the palette; ESC closes it. */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchOpen() ? this.closeSearch() : this.openSearch();
      return;
    }
    if (event.key === 'Escape' && this.searchOpen()) {
      this.closeSearch();
    }
  }

  openSearch(): void {
    this.searchOpen.set(true);
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('.palette-head input');
      input?.focus();
      input?.select();
    });
  }

  closeSearch(): void {
    this.searchOpen.set(false);
    this.searching.set(false);
    clearTimeout(this.searchTimer);
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    const term = this.searchTerm.trim();
    if (!term) {
      this.searchGroups.set([]);
      this.searching.set(false);
      return;
    }
    this.searching.set(true);
    this.searchTimer = setTimeout(() => this.runSearch(term), 250);
  }

  goTo(hit: SearchHit): void {
    this.closeSearch();
    void this.router.navigateByUrl(hit.route);
  }

  /**
   * There is no cross-entity search endpoint, so the palette fans out to the
   * three list endpoints that accept `search` and merges the top hits.
   */
  private runSearch(term: string): void {
    const seq = ++this.searchSeq;
    const query = { page: 1, limit: 5, search: term };
    forkJoin({
      companies: this.companies.list(query).pipe(catchError(() => of(null))),
      profiles: this.profiles.list(query).pipe(catchError(() => of(null))),
      users: this.users.list(query).pipe(catchError(() => of(null))),
    }).subscribe((res) => {
      if (seq !== this.searchSeq) {
        return;
      }
      const groups: SearchGroup[] = [];

      const companies = res.companies?.items ?? [];
      if (companies.length) {
        groups.push({
          label: 'บริษัท',
          items: companies.map((company) => ({
            title: company.name,
            meta: [company.slug, this.statusText(company.status)].filter(Boolean).join(' · '),
            kind: 'บริษัท',
            icon: 'ph ph-buildings',
            route: `/backoffice/companies/${company._id}`,
          })),
        });
      }

      const profiles = res.profiles?.items ?? [];
      if (profiles.length) {
        groups.push({
          label: 'โปรไฟล์',
          items: profiles.map((profile) => ({
            title: profile.name,
            meta: [profile.code, this.statusText(profile.status)].filter(Boolean).join(' · '),
            kind: 'โปรไฟล์',
            icon: 'ph ph-identification-card',
            route: `/backoffice/profiles/${profile._id}`,
          })),
        });
      }

      const users = res.users?.items ?? [];
      if (users.length) {
        groups.push({
          label: 'ผู้ใช้',
          items: users.map((user) => ({
            title: user.displayName || user.email,
            meta: [user.email, this.statusText(user.status)].filter(Boolean).join(' · '),
            kind: 'ผู้ใช้',
            icon: 'ph ph-users-three',
            route: `/backoffice/users/${user._id}`,
          })),
        });
      }

      this.searchGroups.set(groups);
      this.searching.set(false);
    });
  }

  private statusText(status: string | null | undefined): string {
    const labels: Record<string, string> = {
      ACTIVE: 'ใช้งาน',
      INACTIVE: 'ระงับ',
      EXPIRED: 'หมดอายุ',
      DELETED: 'ลบแล้ว',
    };
    return status ? (labels[status] ?? status) : '';
  }

  private updateCrumbs(url: string): void {
    const segments = url.split('?')[0].split('/').filter(Boolean);
    const index = segments.indexOf('backoffice');
    const section = index >= 0 ? segments[index + 1] : undefined;
    this.crumbSection.set(section ? (SECTION_LABELS[section] ?? section) : 'ภาพรวม');
    // A trailing id means a detail screen; its own title fills the leaf in.
    const leaf = index >= 0 ? segments[index + 2] : undefined;
    this.crumbLeaf.set(leaf ? (leaf === 'new' ? 'สร้างใหม่' : 'รายละเอียด') : '');
  }

  private readNavPreference(): boolean {
    try {
      return localStorage.getItem(NAV_COLLAPSED_KEY) !== '1';
    } catch {
      return true;
    }
  }
}
