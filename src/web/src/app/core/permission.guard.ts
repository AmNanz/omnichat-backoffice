import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const required = route.data?.['permission'] as string | undefined;

  if (!required || authService.hasPermission(required)) {
    return true;
  }

  return router.createUrlTree(['/backoffice/profiles']);
};
