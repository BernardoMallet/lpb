export const SITE = {
  nome: 'Loucos Pelo Botafogo',
  // [CONFIRMAR] domínio final da landing page (usado em canonical, Open Graph e JSON-LD)
  url: 'https://www.loucospelobotafogo.com.br',
  descricao:
    'Hospícios em todo o Brasil, Banda de General na arquibancada, sede com pré-jogos e eventos. Seja sócio do Loucos Pelo Botafogo.',
  imagemCompartilhamento: 'images/og-image.jpg',
  logo: 'images/logo-192.png',
} as const;

export const ROTAS = {
  entrar: '/entrar', // [CONFIRMAR] rota real do sistema
  sejaSocio: '/seja-socio', // [CONFIRMAR] rota real do sistema
} as const;

export const LINKS = {
  loja: 'https://www.loucospelobotafogo.com.br/',
  comoChegar: 'https://share.google/EL8nxT86rpEHVJSF8',
  instagram: 'https://www.instagram.com/loucosbotafogo/',
  spotify: 'https://open.spotify.com/intl-pt/artist/7JHbVmHXGLrcnyMhyFxT0C',
} as const;

export interface Beneficio {
  icone: 'tag' | 'calendar' | 'card' | 'bus';
  titulo: string;
  texto: string;
}

// [CONFIRMAR] benefícios reais da sociedade
export const BENEFICIOS: readonly Beneficio[] = [
  { icone: 'tag', titulo: 'Descontos', texto: 'Vantagens exclusivas na loja oficial.' },
  {
    icone: 'calendar',
    titulo: 'Eventos',
    texto: 'Condições especiais nos eventos e pré-jogos da sede.',
  },
  {
    icone: 'card',
    titulo: 'Carteirinha',
    texto: 'Fazemos sua carteirinha de sócio.',
  },
  {
    icone: 'bus',
    titulo: 'Caravanas',
    texto: 'Condições especiais nas caravanas para os jogos.',
  },
];

export const SEDE = {
  endereco: null as string | null, // [CONFIRMAR]
  horarios: null as string | null, // [CONFIRMAR]
};

export const LOJA_FISICA = {
  endereco: null as string | null, // [CONFIRMAR]
};
