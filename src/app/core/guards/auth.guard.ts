import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Protects feature routes: unauthenticated users are sent to /login and return afterwards. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) {
    return true;
  }

  auth.setReturnUrl(state.url);
  return inject(Router).createUrlTree(['/login']);
};
