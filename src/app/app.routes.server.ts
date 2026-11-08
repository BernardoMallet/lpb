import { RenderMode, ServerRoute } from '@angular/ssr';
import { ROTAS } from './core/site.config';

// Login e área autenticada dependem de sessão: não há o que pré-renderizar
const apenasCliente: ServerRoute[] = [
  ROTAS.entrar,
  ROTAS.sejaSocio,
  ROTAS.minhaConta,
  ROTAS.noticias,
  ROTAS.caravanas,
  ROTAS.permissoes,
  ROTAS.cpfsBloqueados,
  ROTAS.semAcesso,
].map((caminho): ServerRoute => ({ path: caminho.slice(1), renderMode: RenderMode.Client }));

export const serverRoutes: ServerRoute[] = [
  ...apenasCliente,
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
