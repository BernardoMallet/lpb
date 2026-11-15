import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../site.config';
import {
  Caravana,
  CaravanaInput,
  Comprador,
  Compra,
  MeioPagamento,
  Municipio,
  Pagamento,
  Pedido,
  PedidoVaga,
  ResultadoReserva,
} from './caravanas.models';

/** Único acesso HTTP a caravanas, pedidos e compras. Cookies e CSRF ficam com o interceptor. */
@Injectable({ providedIn: 'root' })
export class CaravanasApi {
  private readonly http = inject(HttpClient);

  listar(): Observable<Caravana[]> {
    return this.http.get<Caravana[]>(`${API.url}/caravans`);
  }

  obter(id: string): Observable<Caravana> {
    return this.http.get<Caravana>(`${API.url}/caravans/${id}`);
  }

  criar(dados: CaravanaInput, capa: File | null): Observable<Caravana> {
    const corpo = new FormData();
    corpo.append('data', new Blob([JSON.stringify(dados)], { type: 'application/json' }));
    if (capa) corpo.append('cover', capa);
    return this.http.post<Caravana>(`${API.url}/caravans`, corpo);
  }

  estados(): Observable<string[]> {
    return this.http.get<string[]>(`${API.url}/localidades/estados`);
  }

  municipios(uf: string): Observable<Municipio[]> {
    return this.http.get<Municipio[]>(`${API.url}/localidades/estados/${uf}/municipios`);
  }

  reservar(id: string): Observable<ResultadoReserva> {
    return this.http.post<ResultadoReserva>(`${API.url}/caravans/${id}/reservations`, null);
  }

  pegarVagaGratis(id: string): Observable<ResultadoReserva> {
    return this.http.post<ResultadoReserva>(`${API.url}/caravans/${id}/free-seat`, null);
  }

  pedirVagaGratis(id: string): Observable<string> {
    return this.http.post<string>(`${API.url}/caravans/${id}/seat-requests`, null);
  }

  pagar(orderId: string, method: MeioPagamento, installments: number): Observable<Pagamento> {
    return this.http.post<Pagamento>(`${API.url}/orders/${orderId}/pay`, { method, installments });
  }

  pedido(orderId: string): Observable<Pedido> {
    return this.http.get<Pedido>(`${API.url}/orders/${orderId}`);
  }

  confirmarSimulacao(paymentId: string): Observable<void> {
    return this.http.post<void>(`${API.url}/dev/payments/${paymentId}/confirm`, null);
  }

  confirmarCaravana(id: string): Observable<Caravana> {
    return this.http.post<Caravana>(`${API.url}/caravans/${id}/confirm`, null);
  }

  compradores(id: string): Observable<Comprador[]> {
    return this.http.get<Comprador[]>(`${API.url}/caravans/${id}/buyers`);
  }

  marcarPresenca(id: string, bookingId: string, attended: boolean): Observable<void> {
    return this.http.patch<void>(`${API.url}/caravans/${id}/buyers/${bookingId}/attendance`, { attended });
  }

  listaPresenca(id: string, formato: 'csv' | 'pdf'): Observable<Blob> {
    return this.http.get(`${API.url}/caravans/${id}/attendance.${formato}`, { responseType: 'blob' });
  }

  estornar(orderId: string): Observable<void> {
    return this.http.post<void>(`${API.url}/admin/orders/${orderId}/refund`, null);
  }

  minhasCompras(): Observable<Compra[]> {
    return this.http.get<Compra[]>(`${API.url}/me/purchases`);
  }

  comprovante(purchaseId: string): Observable<Blob> {
    return this.http.get(`${API.url}/me/purchases/${purchaseId}/receipt.pdf`, { responseType: 'blob' });
  }

  pedidosDeVaga(): Observable<PedidoVaga[]> {
    return this.http.get<PedidoVaga[]>(`${API.url}/admin/seat-requests`);
  }

  aprovar(id: string): Observable<ResultadoReserva> {
    return this.http.post<ResultadoReserva>(`${API.url}/admin/seat-requests/${id}/approve`, null);
  }

  negar(id: string): Observable<void> {
    return this.http.post<void>(`${API.url}/admin/seat-requests/${id}/deny`, null);
  }
}

/** Entrega um arquivo recebido pela API (a sessão é por cookie, então não dá para usar um link direto). */
export function baixarArquivo(arquivo: Blob, nome: string): void {
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

/** URL absoluta da capa: o back devolve caminho relativo. */
export function urlCapa(c: Pick<Caravana, 'coverUrl'>): string | null {
  return c.coverUrl ? `${API.url}${c.coverUrl}` : null;
}
