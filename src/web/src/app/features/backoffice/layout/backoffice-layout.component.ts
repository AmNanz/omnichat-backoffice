import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-backoffice-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, AvatarModule],
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        overflow: hidden;
      }
      .layout {
        display: grid;
        grid-template-columns: 16.5rem minmax(0, 1fr);
        grid-template-rows: 4rem minmax(0, 1fr);
        grid-template-areas:
          'sidebar topbar'
          'sidebar content';
        height: 100%;
        overflow: hidden;
      }
      .sidebar {
        grid-area: sidebar;
        background: #fff;
        color: #1c3550;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
        border-right: 1px solid #d5e0ea;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        height: 4rem;
        padding: 0 1.1rem;
        border-bottom: 1px solid #e8eef4;
      }
      .brand-mark {
        width: 2.1rem;
        height: 2.1rem;
        border-radius: 0.6rem;
        background: #d7e8f4;
        display: grid;
        place-items: center;
        color: #2f5f86;
        font-weight: 700;
        font-size: 0.78rem;
      }
      .brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
      }
      .brand-text strong {
        color: #1c3550;
        font-size: 1.1rem;
      }
      .brand-text span {
        font-size: 0.8rem;
        color: #7a93a8;
        font-weight: 400;
      }
      .nav {
        flex: 1;
        overflow: auto;
        padding: 1rem 0.75rem 1.25rem;
      }
      .nav-group {
        margin-bottom: 1.1rem;
      }
      .nav-group-label {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        text-transform: none;
        color: #7a93a8;
        padding: 0 0.7rem 0.45rem;
      }
      .nav a {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.58rem 0.7rem;
        border-radius: 0.65rem;
        color: #3d556b;
        text-decoration: none;
        font-size: 0.95rem;
        font-weight: 400;
        margin-bottom: 0.15rem;
      }
      .nav a i {
        font-size: 1.05rem;
        width: 1.1rem;
        text-align: center;
      }
      .nav a:hover {
        background: #f3f8fb;
        color: #1c3550;
      }
      .nav a.active {
        background: #d7e8f4;
        color: #2f5f86;
        font-weight: 600;
      }
      .topbar {
        grid-area: topbar;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0 1.25rem;
        background: #fff;
        border-bottom: 1px solid #d5e0ea;
      }
      .topbar-left {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        color: #1c3550;
        font-weight: 700;
      }
      .topbar-left i {
        color: #6699bb;
        font-size: 1.15rem;
      }
      .topbar-right {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .user-meta {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
      }
      .user-meta strong {
        font-size: 1rem;
        color: #1c3550;
      }
      .user-meta span {
        font-size: 0.85rem;
        color: #7a93a8;
      }
      .content {
        grid-area: content;
        padding: 1.5rem 1.75rem 1.75rem;
        overflow: auto;
        background:
          radial-gradient(ellipse 80% 50% at 100% 0%, rgba(215, 232, 244, 0.7), transparent 55%),
          linear-gradient(180deg, #eef4f8 0%, #f7fafc 100%);
        min-width: 0;
        min-height: 0;
      }
      :host ::ng-deep .layout-avatar.p-avatar {
        background: #6699bb;
        color: #fff;
      }
      @media (max-width: 960px) {
        .layout {
          grid-template-columns: 14.5rem minmax(0, 1fr);
        }
        .content {
          padding: 1rem;
        }
      }
    `,
  ],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">OC</div>
          <div class="brand-text">
            <strong>OmniChat</strong>
            <span>แผงควบคุมผู้ดูแล</span>
          </div>
        </div>
        <nav class="nav">
          @for (group of navGroups; track group.label) {
            <div class="nav-group">
              @if (group.label) {
                <div class="nav-group-label">{{ group.label }}</div>
              }
              @for (item of group.items; track item.route) {
                <a
                  [routerLink]="item.route"
                  routerLinkActive="active"
                  [attr.data-testid]="navTestId(item.route)"
                >
                  <i [class]="item.icon"></i>
                  <span>{{ item.label }}</span>
                </a>
              }
            </div>
          }
        </nav>
      </aside>

      <header class="topbar">
        <div class="topbar-left">
          <i class="pi pi-chart-bar"></i>
          <span>ระบบจัดการ</span>
        </div>
        <div class="topbar-right">
          <p-button
            icon="pi pi-bell"
            [rounded]="true"
            [text]="true"
            severity="secondary"
            ariaLabel="การแจ้งเตือน"
            (onClick)="openNotifications()"
          />
          <p-avatar
            [label]="avatarLabel"
            shape="circle"
            styleClass="layout-avatar"
          />
          <div class="user-meta">
            <strong>{{ displayName }}</strong>
            <span>{{ auth.currentUser()?.email || 'เข้าสู่ระบบแล้ว' }}</span>
          </div>
          <p-button
            icon="pi pi-sign-out"
            [rounded]="true"
            [text]="true"
            severity="secondary"
            (onClick)="auth.logout()"
            ariaLabel="ออกจากระบบ"
            data-testid="logout"
          />
        </div>
      </header>

      <main class="content">
        <router-outlet />
      </main>
    </div>

  `,
})
export class BackofficeLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navGroups: NavGroup[] = [
    {
      label: 'ผู้เช่า',
      items: [{ label: 'โปรไฟล์', route: '/backoffice/profiles', icon: 'pi pi-id-card' }],
    },
    {
      label: 'การเรียกเก็บเงิน',
      items: [
        { label: 'แพ็กเกจ', route: '/backoffice/packages', icon: 'pi pi-box' },
        { label: 'การสมัคร', route: '/backoffice/subscriptions', icon: 'pi pi-sync' },
      ],
    },
    {
      label: 'สิทธิ์เข้าใช้',
      items: [
        { label: 'ผู้ใช้', route: '/backoffice/users', icon: 'pi pi-users' },
        { label: 'บทบาท', route: '/backoffice/roles', icon: 'pi pi-shield' },
      ],
    },
    {
      label: 'การดำเนินงาน',
      items: [
        { label: 'การแจ้งเตือน', route: '/backoffice/notifications', icon: 'pi pi-bell' },
        { label: 'บันทึกการใช้งาน', route: '/backoffice/audit-logs', icon: 'pi pi-history' },
        { label: 'การใช้งาน', route: '/backoffice/usage', icon: 'pi pi-chart-bar' },
      ],
    },
  ];

  get displayName(): string {
    return this.auth.currentUser()?.displayName || this.auth.currentUser()?.email || 'ผู้ใช้';
  }

  get avatarLabel(): string {
    const name = this.displayName.trim();
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  navTestId(route: string): string | null {
    const ids: Record<string, string> = {
      '/backoffice/roles': 'nav-roles',
      '/backoffice/users': 'nav-users',
      '/backoffice/packages': 'nav-packages',
      '/backoffice/profiles': 'nav-profiles',
      '/backoffice/subscriptions': 'nav-subscriptions',
    };
    return ids[route] ?? null;
  }

  openNotifications(): void {
    void this.router.navigate(['/backoffice/notifications']);
  }
}
