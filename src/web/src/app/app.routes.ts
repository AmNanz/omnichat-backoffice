import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { BackofficeLayoutComponent } from './features/backoffice/layout/backoffice-layout.component';
import { DashboardComponent } from './features/backoffice/dashboard/dashboard.component';
import { ProfilesListComponent } from './features/backoffice/profiles/profiles-list.component';
import { ProfileDetailComponent } from './features/backoffice/profiles/profile-detail.component';
import { UsersListComponent } from './features/backoffice/users/users-list.component';
import { UserDetailComponent } from './features/backoffice/users/user-detail.component';
import { RolesListComponent } from './features/backoffice/roles/roles-list.component';
import { RoleDetailComponent } from './features/backoffice/roles/role-detail.component';
import { PackagesListComponent } from './features/backoffice/packages/packages-list.component';
import { PackageDetailComponent } from './features/backoffice/packages/package-detail.component';
import { SubscriptionsListComponent } from './features/backoffice/subscriptions/subscriptions-list.component';
import { SubscriptionDetailComponent } from './features/backoffice/subscriptions/subscription-detail.component';
import { NotificationsComponent } from './features/backoffice/notifications/notifications.component';
import { AuditLogsComponent } from './features/backoffice/audit-logs/audit-logs.component';
import { UsageComponent } from './features/backoffice/usage/usage.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'backoffice',
    component: BackofficeLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profiles' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profiles', component: ProfilesListComponent },
      { path: 'profiles/:id', component: ProfileDetailComponent },
      { path: 'users', component: UsersListComponent },
      { path: 'users/:id', component: UserDetailComponent },
      { path: 'roles', component: RolesListComponent },
      { path: 'roles/:id', component: RoleDetailComponent },
      { path: 'packages', component: PackagesListComponent },
      { path: 'packages/:id', component: PackageDetailComponent },
      { path: 'subscriptions', component: SubscriptionsListComponent },
      { path: 'subscriptions/:id', component: SubscriptionDetailComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'audit-logs', component: AuditLogsComponent },
      { path: 'usage', component: UsageComponent },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'backoffice/profiles' },
  { path: '**', redirectTo: 'backoffice/profiles' },
];
