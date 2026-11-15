export type StatusCaravana = 'ABERTA' | 'CONFIRMADA' | 'CANCELADA';
export type StatusReserva = 'RESERVED' | 'PAID' | 'EXPIRED' | 'REFUNDED' | 'CANCELED';
export type StatusPedido =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'EXPIRED'
  | 'CANCELED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'REFUND_FAILED';
export type StatusPagamento = 'PENDING' | 'PAID' | 'DECLINED' | 'CANCELED' | 'EXPIRED' | 'REFUNDED';
export type MeioPagamento = 'PIX' | 'CARD';

export interface MinhaReserva {
  bookingId: string;
  orderId: string | null;
  status: StatusReserva;
  expiresAt: string | null;
}

export interface Caravana {
  id: string;
  gameName: string;
  coverUrl: string | null;
  state: string;
  municipalityId: number;
  municipalityName: string;
  departsAt: string;
  basePrice: number;
  price: number;
  nonMemberPrice: number;
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  description: string;
  salesDeadline: string;
  maxInstallments: number;
  status: StatusCaravana;
  salesOpen: boolean;
  myBooking: MinhaReserva | null;
  myRequestPending: boolean;
}

export interface CaravanaInput {
  gameName: string;
  state: string;
  municipalityId: number;
  departsAt: string;
  basePrice: number;
  totalSeats: number;
  description: string;
  salesDeadline: string;
  maxInstallments: number;
}

export interface Municipio {
  id: number;
  name: string;
}

export interface Comprador {
  bookingId: string;
  orderId: string;
  name: string;
  status: StatusReserva;
  attended: boolean;
  amount: number;
}

export interface PedidoVaga {
  id: string;
  caravanId: string;
  gameName: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface ResultadoReserva {
  bookingId: string;
  orderId: string;
  orderStatus: StatusPedido;
  amount: number;
  expiresAt: string | null;
}

export interface Pagamento {
  id: string;
  method: MeioPagamento;
  status: StatusPagamento;
  installments: number;
  amount: number;
  pixCopyPaste: string | null;
  pixQrCodeUrl: string | null;
  checkoutUrl: string | null;
  expiresAt: string | null;
}

export interface Pedido {
  id: string;
  type: string;
  referenceId: string;
  description: string;
  amount: number;
  maxInstallments: number;
  status: StatusPedido;
  expiresAt: string | null;
  paidAt: string | null;
  payments: Pagamento[];
}

export interface Compra {
  id: string;
  type: string;
  referenceId: string;
  description: string;
  amount: number;
  status: StatusPedido;
  createdAt: string;
  paidAt: string | null;
}

export const SIMULADO = 'dev://pagamento-simulado';

/** ESGOTADA é derivada: o back só guarda ABERTA, CONFIRMADA e CANCELADA. */
export function esgotada(c: Caravana): boolean {
  return c.status === 'ABERTA' && c.availableSeats <= 0;
}
