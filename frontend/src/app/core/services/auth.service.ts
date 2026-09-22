import { Injectable, Injector, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, map, of, shareReplay, EMPTY } from 'rxjs';
import { environment } from '@env/environment';
import { AuthRequest, AuthResponse, AuthState, UserRole } from '@core/models/auth.model';

/**
 * Gerencia o estado de autenticação via Signals (Angular 17).
 *
 * O token JWT fica em cookie HTTP-Only — este serviço nunca o lê nem armazena.
 * Mantém apenas metadados: role e expiração para decisões de UI/routing.
 * Em caso de reload, o estado é restaurado via endpoint /auth/refresh.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly _state = signal<AuthState>({
    role: null,
    email: null,
    expiresAt: null,
    isAuthenticated: false,
  });

  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly role = computed(() => this._state().role);
  readonly email = computed(() => this._state().email);
  readonly isAdmin = computed(() =>
    this._state().role === 'ROLE_ADMIN'
  );
  readonly isPrivileged = computed(() =>
    this._state().role === 'ROLE_ADMIN' || this._state().role === 'ROLE_GERENTE'
  );

  /**
   * Resolve quando a tentativa inicial de restaurar a sessão (via cookie
   * HTTP-Only) termina — com sucesso ou falha. Guards que rodam em navegações
   * "frias" (reload completo, ex.: redirect do checkout) devem aguardar este
   * Observable antes de checar isAuthenticated(), já que o construtor dispara
   * o restore de forma assíncrona e o valor inicial do signal é sempre false.
   */
  readonly sessionReady$: Observable<void>;

  // Router é resolvido sob demanda (via Injector) em vez de injetado no
  // construtor: authGuard cria o AuthService durante a navegação inicial do
  // próprio Router, e injetar Router aqui direto causa NG0200 (dependência
  // circular) nesse boot frio — o restore falhava silenciosamente antes de
  // qualquer chamada de rede chegar a sair.
  constructor(private http: HttpClient, private injector: Injector) {
    this.sessionReady$ = this.tryRestoreSession();
  }

  private get router(): Router {
    return this.injector.get(Router);
  }

  login(request: AuthRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => this.applyAuthState(response))
    );
  }

  logout() {
    this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      catchError(() => EMPTY)
    ).subscribe(() => {
      this._state.set({ role: null, email: null, expiresAt: null, isAuthenticated: false });
      this.router.navigate(['/login']);
    });
  }

  refreshToken() {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}).pipe(
      tap(response => this.applyAuthState(response))
    );
  }

  private applyAuthState(response: AuthResponse) {
    this._state.set({
      role: response.role as UserRole,
      email: response.email ?? null,
      expiresAt: Date.now() + response.expiresIn * 1000,
      isAuthenticated: true,
    });
  }

  private tryRestoreSession(): Observable<void> {
    // Tenta renovar o access token usando o refresh token do cookie HTTP-Only.
    // Se o cookie não existir ou estiver expirado, apenas marca como não
    // autenticado — sessionReady$ sempre completa, com sucesso ou não.
    const ready$ = this.refreshToken().pipe(
      map(() => void 0),
      catchError(() => {
        this._state.set({ role: null, email: null, expiresAt: null, isAuthenticated: false });
        return of(void 0);
      }),
      shareReplay(1)
    );
    ready$.subscribe();
    return ready$;
  }
}
