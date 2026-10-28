import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const clienteGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try {
    if (await auth.verify()) return true;
  } catch { /* Fail closed; allow retrying from login without rendering private content. */ }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
