import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { ToastService } from '../../shared/toast';
import { Auth } from '../auth/auth';
import { API } from '../site.config';
import { SEM_EXPIRACAO } from './api-context';
import { ApiError } from './api-error';
import { Csrf } from './csrf';

const MUTANTES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Só atua em chamadas à API: cookies, CSRF nas mutações e erros normalizados em ApiError.
 * 400/422 e 429 ficam para o componente mostrar junto ao campo.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(`${API.url}/`)) return next(req);

  const csrf = inject(Csrf);
  const auth = inject(Auth);
  const toast = inject(ToastService);

  const mutante = MUTANTES.has(req.method);
  const base = req.clone({ withCredentials: true });

  const enviar = (): Observable<HttpEvent<unknown>> =>
    mutante
      ? csrf
          .obter()
          .pipe(switchMap((t) => next(base.clone({ setHeaders: { [t.headerName]: t.token } }))))
      : next(base);

  return enviar().pipe(
    // Um 403 numa mutação pode ser token CSRF vencido: renova e tenta uma única vez
    catchError((erro) => {
      if (mutante && erro instanceof HttpErrorResponse && erro.status === 403) {
        csrf.invalidar();
        return csrf
          .obter()
          .pipe(switchMap((t) => next(base.clone({ setHeaders: { [t.headerName]: t.token } }))));
      }
      return throwError(() => erro);
    }),
    catchError((erro) => {
      if (erro instanceof ApiError) return throwError(() => erro);
      const e = ApiError.de(erro);
      avisar(e, base, auth, toast);
      return throwError(() => e);
    }),
  );
};

function avisar(e: ApiError, req: HttpRequest<unknown>, auth: Auth, toast: ToastService): void {
  if (e.status === 401) {
    if (!req.url.includes('/auth/') && !req.context.get(SEM_EXPIRACAO)) auth.expirar();
  } else if (e.status === 403) {
    toast.error(e.detail ?? 'Você não tem permissão para fazer isso.');
  } else if (e.semConexao) {
    toast.error('Sem conexão com o servidor. Verifique sua internet e tente de novo.');
  } else if (e.servidor) {
    toast.error(
      `Algo deu errado do nosso lado. Tente de novo em instantes.${e.requestId ? ` (código ${e.requestId})` : ''}`,
    );
  }
}
