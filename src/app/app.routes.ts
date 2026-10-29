import { Routes } from '@angular/router';
import { ROTAS } from './core/site.config';

export const routes: Routes = [
  {
    path: '',
    title: 'Loucos Pelo Botafogo | Seja Sócio',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: ROTAS.entrar.slice(1),
    title: 'Entrar | Loucos Pelo Botafogo',
    data: { titulo: 'Entrar' },
    loadComponent: () => import('./pages/placeholder').then((m) => m.Placeholder),
  },
  {
    path: ROTAS.sejaSocio.slice(1),
    title: 'Seja Sócio | Loucos Pelo Botafogo',
    data: { titulo: 'Seja Sócio' },
    loadComponent: () => import('./pages/placeholder').then((m) => m.Placeholder),
  },
  { path: '**', redirectTo: '' },
];
