import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { ROTAS } from '../site.config';
import { BaseRole } from './auth.models';
import { Auth } from './auth';

// Guards são só UX: o back-end valida cada requisição.

/** Exige sessão. Sem ela, vai para /entrar guardando o destino. */
export const autenticadoGuard: CanActivateFn = (_rota, estado) => {
  const router = inject(Router);
  return inject(Auth)
    .carregarSessao()
    .pipe(
      map((ok) =>
        ok
          ? true
          : router.createUrlTree([ROTAS.entrar], {
              queryParams: estado.url === ROTAS.aposLogin ? {} : { retorno: estado.url },
            }),
      ),
    );
};

/** Para telas só de visitante (/entrar): quem já tem sessão vai direto para a área logada. */
export const visitanteGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(Auth)
    .carregarSessao()
    .pipe(map((ok) => (ok ? router.createUrlTree([ROTAS.aposLogin]) : true)));
};

export const papelGuard =
  (...papeis: BaseRole[]): CanActivateFn =>
  () => {
    const router = inject(Router);
    return inject(Auth).temPapel(papeis) ? true : router.createUrlTree([ROTAS.semAcesso]);
  };

export const permissaoGuard =
  (...permissoes: string[]): CanActivateFn =>
  () => {
    const auth = inject(Auth);
    const router = inject(Router);
    return permissoes.some((p) => auth.temPermissao(p)) ? true : router.createUrlTree([ROTAS.semAcesso]);
  };
