import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<boolean>(false);

/**
 * Intercepta respostas 401 e tenta renovar o access token usando o refresh token
 * do cookie HTTP-Only. Se o refresh também falhar, redireciona para /login.
 *
 * Garante que múltiplas requisições simultâneas com 401 aguardem o refresh
 * único (sem disparar N refreshes paralelos).
 */
export const authRefreshInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // Não intercepta as próprias chamadas de auth para evitar loop infinito.
  // Também evita injetar AuthService aqui: a própria AuthService dispara sua
  // primeira chamada (/auth/refresh) de dentro do construtor, e injetá-la de
  // volta nesse meio-tempo causa NG0200 (dependência circular).
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) return throwError(() => error);

      if (isRefreshing) {
        // Outra requisição já está fazendo o refresh — aguarda concluir
        return refreshSubject.pipe(
          filter(success => success),
          take(1),
          switchMap(() => next(req))
        );
      }

      isRefreshing = true;
      refreshSubject.next(false);

      return authService.refreshToken().pipe(
        switchMap(() => {
          isRefreshing = false;
          refreshSubject.next(true);
          return next(req);
        }),
        catchError(refreshError => {
          isRefreshing = false;
          refreshSubject.next(false);
          const returnUrl = router.url;
          router.navigate(['/login'], { queryParams: { expired: true, returnUrl } });
          return throwError(() => refreshError);
        })
      );
    })
  );
};
