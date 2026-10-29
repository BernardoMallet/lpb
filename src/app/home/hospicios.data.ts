export interface Hospicio {
  id: string;
  nome: string;
  imagem: string;
  descricao: string;
  redeSocial: { tipo: 'instagram' | 'facebook'; url: string };
}

// [CONFIRMAR] Substitua cada chamada provisoria(...) pelo texto real da história do hospício.
const provisorio = (nome: string): string =>
  `[Texto provisório] Aqui entra a história do ${nome}: como começou, quem esteve à frente e o que o grupo representa para o Botafogo.`;

/**
 * Fonte única de dados do carousel. As imagens ficam em public/hospicios/
 * (em .webp) e as miniaturas em public/hospicios/thumbs/ com o mesmo nome.
 */
export const HOSPICIOS: readonly Hospicio[] = [
  {
    id: 'manaus',
    nome: 'Hospício Manaus',
    imagem: 'hospicios/manaus.webp',
    descricao: provisorio('Hospício Manaus'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/loucos.manaus22/' },
  },
  {
    id: 'baixada',
    nome: 'Hospício Baixada',
    imagem: 'hospicios/baixada.webp',
    descricao: provisorio('Hospício Baixada'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/loucosbaixada/' },
  },
  {
    id: 'banda',
    nome: 'Banda de General',
    imagem: 'hospicios/banda.webp',
    descricao: provisorio('Banda de General'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/bandadegeneral/' },
  },
  {
    id: 'brasilia',
    nome: 'Hospício Brasília',
    imagem: 'hospicios/brasilia.webp',
    descricao: provisorio('Hospício Brasília'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/loucosbrasilia/' },
  },
  {
    id: 'duqueDeCaxias',
    nome: 'Hospício Caxias',
    imagem: 'hospicios/duqueDeCaxias.webp',
    descricao: provisorio('Hospício Caxias'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/lpbcaxias/' },
  },
  {
    id: 'espiritoSanto',
    nome: 'Hospício Espírito Santo',
    imagem: 'hospicios/espiritoSanto.webp',
    descricao: provisorio('Hospício Espírito Santo'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/loucoses/?hl=pt' },
  },
  {
    id: 'feminino',
    nome: 'Hospício Feminino',
    imagem: 'hospicios/feminino.webp',
    descricao: provisorio('Hospício Feminino'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/instaloucas22/' },
  },
  {
    id: 'jacarepagua',
    nome: 'Hospício Jacarepaguá',
    imagem: 'hospicios/jacarepagua.webp',
    descricao: provisorio('Hospício Jacarepaguá'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/loucosjpa/' },
  },
  {
    id: 'leopoldina',
    nome: 'Hospício Leopoldina',
    imagem: 'hospicios/leopoldina.webp',
    descricao: provisorio('Hospício Leopoldina'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/loucosleopoldina/' },
  },
  {
    id: 'nitSg',
    nome: 'Hospício Niterói / SG',
    imagem: 'hospicios/nitSg.webp',
    descricao: provisorio('Hospício Niterói / SG'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/loucosnitsg/' },
  },
  {
    id: 'rioDasOstras',
    nome: 'Hospício Rio das Ostras',
    imagem: 'hospicios/rioDasOstras.webp',
    descricao: provisorio('Hospício Rio das Ostras'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/ostrafogo/' },
  },
  {
    id: 'sulDoEstado',
    nome: 'Hospício Sul do Estado',
    imagem: 'hospicios/sulDoEstado.webp',
    descricao: provisorio('Hospício Sul do Estado'),
    redeSocial: { tipo: 'facebook', url: 'https://www.facebook.com/loucosvrbm/' },
  },
  {
    id: 'zonaNorte',
    nome: 'Hospício Zona Norte',
    imagem: 'hospicios/zonaNorte.webp',
    descricao: provisorio('Hospício Zona Norte'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/loucoszonanorte/' },
  },
  {
    id: 'zonaOeste',
    nome: 'Hospício Zona Oeste',
    imagem: 'hospicios/zonaOeste.webp',
    descricao: provisorio('Hospício Zona Oeste'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/loucoszonaoeste/' },
  },
  {
    id: 'recife',
    nome: 'Hospício Recife',
    imagem: 'hospicios/recife.webp',
    descricao: provisorio('Hospício Recife'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/loucosrecife/' },
  },
  {
    id: 'zonaSul',
    nome: 'Hospício Zona Sul',
    imagem: 'hospicios/zonaSul.webp',
    descricao: provisorio('Hospício Zona Sul'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/loucoszonasul/' },
  },
  {
    id: 'amapa',
    nome: 'Hospício Amapá',
    imagem: 'hospicios/amapa.webp',
    descricao: provisorio('Hospício Amapá'),
    redeSocial: { tipo: 'instagram', url: 'https://www.instagram.com/loucosap/' },
  },
];
