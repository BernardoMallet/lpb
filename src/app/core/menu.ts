import { IconName } from '../shared/icon';
import { BaseRole, PAPEIS_GESTAO } from './auth/auth.models';
import { ROTAS } from './site.config';

export interface ItemMenu {
  rotulo: string;
  rota: string;
  icone: IconName;
  /** Sem `papeis`, todos os perfis veem o item. */
  papeis?: readonly BaseRole[];
}

/**
 * Menu do shell por perfil. Caravanas aparece para todos (sócio e não-sócio só compram vaga;
 * criar/editar depende de papel e permissão, tratados dentro da tela).
 */
export const MENU: readonly ItemMenu[] = [
  { rotulo: 'Notícias', rota: ROTAS.noticias, icone: 'news' },
  { rotulo: 'Caravanas', rota: ROTAS.caravanas, icone: 'bus' },
  { rotulo: 'Permissões', rota: ROTAS.permissoes, icone: 'key', papeis: PAPEIS_GESTAO },
  { rotulo: 'CPFs bloqueados', rota: ROTAS.cpfsBloqueados, icone: 'ban', papeis: PAPEIS_GESTAO },
];
