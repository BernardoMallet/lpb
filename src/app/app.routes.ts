import { Routes } from '@angular/router';
import { PAPEIS_GESTAO } from './core/auth/auth.models';
import { autenticadoGuard, papelGuard, visitanteGuard } from './core/auth/guards';
import { ROTAS, SITE } from './core/site.config';

const rota = (caminho: string) => caminho.slice(1);
const titulo = (nome: string) => `${nome} | ${SITE.nome}`;

export const routes: Routes = [
  {
    path: rota(ROTAS.entrar),
    title: titulo('Entrar'),
    canActivate: [visitanteGuard],
    loadComponent: () => import('./auth/login').then((m) => m.Login),
  },
  {
    path: rota(ROTAS.sejaSocio),
    title: titulo('Seja Sócio'),
    canActivate: [visitanteGuard],
    loadComponent: () => import('./cadastro/cadastro').then((m) => m.Cadastro),
  },
  {
    // Site público: landing e páginas institucionais
    path: '',
    loadComponent: () => import('./layout/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        title: 'Loucos Pelo Botafogo | Seja Sócio',
        loadComponent: () => import('./home/home').then((m) => m.Home),
      },
      {
        path: 'politica-de-privacidade',
        title: titulo('Política de privacidade'),
        loadComponent: () => import('./pages/politica-privacidade').then((m) => m.PoliticaPrivacidade),
      },
    ],
  },
  {
    // Área autenticada. Os guards só melhoram a UX; o back-end decide o acesso de verdade
    path: '',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./area/shell').then((m) => m.Shell),
    children: [
      {
        path: rota(ROTAS.noticias),
        title: titulo('Notícias'),
        data: { titulo: 'Notícias' },
        loadComponent: () => import('./area/em-breve').then((m) => m.EmBreve),
      },
      {
        path: rota(ROTAS.caravanas),
        title: titulo('Caravanas'),
        data: { titulo: 'Caravanas' },
        loadComponent: () => import('./area/em-breve').then((m) => m.EmBreve),
      },
      {
        path: rota(ROTAS.minhaConta),
        title: titulo('Minha conta'),
        loadComponent: () => import('./conta/minha-conta').then((m) => m.MinhaConta),
      },
      {
        path: rota(ROTAS.permissoes),
        title: titulo('Permissões'),
        data: { titulo: 'Permissões' },
        canActivate: [papelGuard(...PAPEIS_GESTAO)],
        loadComponent: () => import('./area/em-breve').then((m) => m.EmBreve),
      },
      {
        path: rota(ROTAS.cpfsBloqueados),
        title: titulo('CPFs bloqueados'),
        data: { titulo: 'CPFs bloqueados' },
        canActivate: [papelGuard(...PAPEIS_GESTAO)],
        loadComponent: () => import('./area/em-breve').then((m) => m.EmBreve),
      },
      {
        path: rota(ROTAS.semAcesso),
        title: titulo('Sem acesso'),
        loadComponent: () => import('./area/sem-acesso').then((m) => m.SemAcesso),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
