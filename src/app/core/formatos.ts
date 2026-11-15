import { StatusPedido } from './caravanas/caravanas.models';

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const DATA_COMPLETA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const DATA_COM_ANO_E_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const moeda = (valor: number): string => MOEDA.format(valor);
export const dataHora = (iso: string): string => DATA_HORA.format(new Date(iso));
export const dataCompleta = (iso: string): string => DATA_COMPLETA.format(new Date(iso));
export const dataEHoraCompletas = (iso: string): string => DATA_COM_ANO_E_HORA.format(new Date(iso));

/** Valor de <input type="datetime-local"> (hora local, sem fuso) para o Instant que a API espera. */
export const localParaInstant = (local: string): string => new Date(local).toISOString();

export const ROTULO_STATUS_PEDIDO: Readonly<Record<StatusPedido, string>> = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Paga',
  EXPIRED: 'Expirada',
  CANCELED: 'Cancelada',
  REFUND_PENDING: 'Estorno em andamento',
  REFUNDED: 'Estornada',
  REFUND_FAILED: 'Falha no estorno',
};
