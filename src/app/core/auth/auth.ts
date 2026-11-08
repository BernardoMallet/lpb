import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { SEM_EXPIRACAO } from '../api/api-context';
import { Csrf } from '../api/csrf';
import { API } from '../site.config';
import { BaseRole, LoginResponse, Me } from './auth.models';

/** Estado de sessão e chamadas de autenticação. O back-end é quem decide acesso; aqui é só UX. */
@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly csrf = inject(Csrf);

  readonly usuario = signal<Me | null>(null);
  readonly sessaoExpirada = signal(false);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API.url}/auth/login`, { email, password });
  }

  verificarOtp(challengeId: string, code: string): Observable<Me> {
    return this.http.post<Me>(`${API.url}/auth/verify-otp`, { challengeId, code }).pipe(
      tap((me) => {
        // A sessão mudou: o token CSRF anterior deixa de valer
        this.csrf.invalidar();
        this.sessaoExpirada.set(false);
        this.usuario.set(me);
      }),
    );
  }

  /** Restaura a sessão pelo cookie. Um 401 aqui é o estado normal de visitante, não expiração. */
  carregarSessao(): Observable<boolean> {
    if (this.usuario()) return of(true);
    return this.http
      .get<Me>(`${API.url}/me`, { context: new HttpContext().set(SEM_EXPIRACAO, true) })
      .pipe(
        tap((me) => this.usuario.set(me)),
        map(() => true),
        catchError(() => of(false)),
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${API.url}/auth/logout`, null).pipe(
      // 401 = a sessão já tinha acabado: o resultado desejado é o mesmo
      catchError((erro) => (erro?.status === 401 ? of(undefined) : throwError(() => erro))),
      tap(() => this.reiniciar()),
      map(() => undefined),
    );
  }

  alterarSenha(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${API.url}/me/password`, { currentPassword, newPassword });
  }

  /** Chamado pelo interceptor quando uma rota privada responde 401. */
  expirar(): void {
    if (this.usuario()) this.sessaoExpirada.set(true);
  }

  reiniciar(): void {
    this.usuario.set(null);
    this.sessaoExpirada.set(false);
    this.csrf.invalidar();
  }

  temPapel(papeis: readonly BaseRole[]): boolean {
    const u = this.usuario();
    return !!u && papeis.includes(u.baseRole);
  }

  temPermissao(permissao: string): boolean {
    return !!this.usuario()?.permissions.includes(permissao);
  }
}
