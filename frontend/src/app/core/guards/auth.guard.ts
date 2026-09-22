import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '@core/services/auth.service';

/**
 * Em navegações frias (reload completo — ex.: redirect de volta de um
 * checkout externo), o AuthService ainda está restaurando a sessão via
 * cookie HTTP-Only quando o guard roda. Por isso aguardamos sessionReady$
 * em vez de checar isAuthenticated() direto, senão todo reload derruba
 * um usuário com sessão válida de volta pro /login.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.sessionReady$.pipe(
    map(() => auth.isAuthenticated() ? true : router.createUrlTree(['/login']))
  );
};
