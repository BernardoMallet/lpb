import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EMPTY, Subscription, catchError, exhaustMap, finalize, interval, timer } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { CaravanasApi } from '../../core/caravanas/caravanas.api';
import { MeioPagamento, Pagamento, Pedido, SIMULADO } from '../../core/caravanas/caravanas.models';
import { mmss } from '../../core/contador';
import { moeda } from '../../core/formatos';
import { Alert } from '../../shared/alert';
import { Button } from '../../shared/button';
import { Chip, Chips } from '../../shared/chips';
import { OpcaoSelect, Select } from '../../shared/select';
import { Skeleton } from '../../shared/skeleton';

const METODOS: readonly Chip[] = [
  { id: 'PIX', rotulo: 'PIX' },
  { id: 'CARD', rotulo: 'Cartão' },
];

/**
 * Checkout da vaga dentro do painel: tempo restante da reserva, PIX (QR e copia e cola) ou cartão no
 * ambiente hospedado do PagBank (nenhum dado de cartão passa por aqui) e acompanhamento por polling.
 * Quem confirma o pagamento é o back: o polling só consulta o pedido.
 */
@Component({
  selector: 'app-checkout-vaga',
  imports: [ReactiveFormsModule, Alert, Button, Chips, Select, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (carregando()) {
      <div class="esqueleto" aria-busy="true">
        <app-skeleton width="60%" height="24px" />
        <app-skeleton width="100%" height="48px" />
      </div>
    } @else if (pedido(); as p) {
      <div class="checkout">
        <div class="topo">
          <p class="valor">{{ valor(p) }}</p>
          @if (expirou()) {
            <p class="tempo expirado">Reserva expirada</p>
          } @else if (expiraEm()) {
            <p class="tempo" role="timer">Reserva por <strong>{{ mmss(restante()) }}</strong></p>
          }
        </div>

        @if (erro(); as mensagem) {
          <app-alert kind="erro">{{ mensagem }}</app-alert>
        }
        @if (aviso(); as mensagem) {
          <app-alert kind="info">{{ mensagem }}</app-alert>
        }

        @if (expirou()) {
          <p>O tempo da reserva acabou e a vaga voltou para a venda. Você pode tentar reservar de novo.</p>
          <button app-button type="button" variant="dark" block (click)="encerrado.emit()">Voltar</button>
        } @else if (!pagamento()) {
          <app-chips label="Forma de pagamento" [chips]="metodos" [(selected)]="metodo" />
          @if (metodo() === 'CARD' && opcoesParcelas().length > 1) {
            <app-select label="Parcelas" [formControl]="parcelas" [options]="opcoesParcelas()" />
          }
          <button app-button type="button" variant="dark" block [loading]="enviando()" (click)="pagar()">
            {{ metodo() === 'PIX' ? 'Gerar PIX' : 'Ir para o pagamento do cartão' }}
          </button>
        } @else {
          @let pg = pagamento()!;
          @if (simulado(pg)) {
            <app-alert kind="info">Simulação local: nenhum pagamento real será efetuado.</app-alert>
            <button app-button type="button" variant="dark" block [loading]="enviando()" (click)="simular(pg)">
              Simular pagamento confirmado
            </button>
          } @else if (pg.method === 'PIX') {
            <p>Pague pelo PIX e aguarde a confirmação nesta página.</p>
            @if (pg.pixQrCodeUrl; as qr) {
              <img class="qr" [src]="qr" alt="QR Code para pagamento PIX" width="200" height="200" />
            }
            @if (pg.pixCopyPaste; as codigo) {
              <p class="codigo">{{ codigo }}</p>
              <button app-button type="button" variant="outline" block (click)="copiar(codigo)">Copiar código PIX</button>
            }
          } @else if (pg.checkoutUrl; as link) {
            <p>Conclua o pagamento no ambiente seguro do PagBank. Os dados do cartão não passam pelo nosso site.</p>
            <a app-button variant="dark" block [href]="link" target="_blank" rel="noopener noreferrer">
              Abrir pagamento no PagBank
            </a>
          }
          <p class="espera" role="status">Aguardando confirmação do pagamento.</p>
          <button app-button type="button" variant="outline" block [loading]="verificando()" (click)="verificar()">
            Verificar pagamento
          </button>
          <button type="button" class="link" (click)="trocarForma()">Trocar forma de pagamento</button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .esqueleto,
    .checkout {
      display: grid;
      gap: 14px;
    }
    .topo {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }
    .valor {
      margin: 0;
      font: 900 1.75rem/1 var(--font-display);
    }
    .tempo {
      margin: 0;
      font-size: 0.9375rem;
    }
    .tempo.expirado {
      color: var(--c-danger);
      font-weight: 800;
    }
    .qr {
      justify-self: center;
      width: 200px;
      height: 200px;
      border: 2px solid var(--c-black);
      border-radius: var(--r-sm);
    }
    .codigo {
      margin: 0;
      padding: 10px 12px;
      background: var(--c-paper);
      border-radius: var(--r-sm);
      font: 0.8125rem/1.4 ui-monospace, Menlo, Consolas, monospace;
      overflow-wrap: anywhere;
    }
    .espera {
      margin: 0;
      color: var(--c-mute);
      font-size: 0.9375rem;
    }
    .link {
      justify-self: center;
      min-height: 44px;
      padding: 0 12px;
      background: none;
      border: 0;
      color: var(--c-black);
      font: inherit;
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }
  `,
})
export class CheckoutVaga {
  private readonly api = inject(CaravanasApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly orderId = input.required<string>();
  readonly pago = output<void>();
  readonly encerrado = output<void>();

  protected readonly metodos = METODOS;
  protected readonly mmss = mmss;
  protected readonly metodo = signal<string>('PIX');
  protected readonly parcelas = new FormControl('1', { nonNullable: true });
  protected readonly pedido = signal<Pedido | null>(null);
  protected readonly pagamento = signal<Pagamento | null>(null);
  protected readonly carregando = signal(true);
  protected readonly enviando = signal(false);
  protected readonly verificando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly expiraEm = signal<number | null>(null);
  protected readonly expirou = signal(false);

  private readonly agora = signal(Date.now());
  private polling?: Subscription;

  protected readonly restante = computed(() => {
    const fim = this.expiraEm();
    return fim === null ? 0 : Math.max(0, Math.floor((fim - this.agora()) / 1000));
  });

  protected readonly opcoesParcelas = computed<OpcaoSelect[]>(() => {
    const p = this.pedido();
    if (!p) return [];
    return Array.from({ length: Math.max(1, p.maxInstallments) }, (_, i) => ({
      valor: String(i + 1),
      rotulo: i === 0 ? `1x de ${moeda(p.amount)} (à vista)` : `${i + 1}x de ${moeda(p.amount / (i + 1))}`,
    }));
  });

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.expiraEm() === null || this.expirou()) return;
        this.agora.set(Date.now());
        if (this.restante() === 0) this.aoExpirar();
      });

    effect(() => {
      const id = this.orderId();
      untracked(() => this.carregar(id));
    });

    this.destroyRef.onDestroy(() => this.polling?.unsubscribe());
  }

  protected valor(p: Pedido): string {
    return moeda(p.amount);
  }

  protected simulado(p: Pagamento): boolean {
    return p.checkoutUrl === SIMULADO || p.pixQrCodeUrl === SIMULADO;
  }

  protected pagar(): void {
    const p = this.pedido();
    if (!p || this.enviando()) return;
    this.erro.set(null);
    this.aviso.set(null);
    const meio = this.metodo() as MeioPagamento;
    const parcelas = meio === 'CARD' ? Number(this.parcelas.value) : 1;
    this.enviando.set(true);
    this.api
      .pagar(p.id, meio, parcelas)
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagamento) => {
          this.pagamento.set(pagamento);
          this.acompanhar();
        },
        error: (e: unknown) => this.erro.set(this.mensagem(e, 'Não foi possível iniciar o pagamento.')),
      });
  }

  protected simular(pagamento: Pagamento): void {
    if (this.enviando()) return;
    this.erro.set(null);
    this.enviando.set(true);
    this.api
      .confirmarSimulacao(pagamento.id)
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.verificar(),
        error: (e: unknown) => this.erro.set(this.mensagem(e, 'Não foi possível simular o pagamento.')),
      });
  }

  protected verificar(): void {
    if (this.verificando()) return;
    this.verificando.set(true);
    this.api
      .pedido(this.orderId())
      .pipe(
        finalize(() => this.verificando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (p) => this.atualizar(p),
        error: () => this.erro.set('Não foi possível consultar o pagamento. Tente novamente.'),
      });
  }

  protected trocarForma(): void {
    this.polling?.unsubscribe();
    this.pagamento.set(null);
    this.aviso.set('O código anterior continua válido até a reserva expirar. Se pagar por ele, a compra será confirmada.');
  }

  protected async copiar(codigo: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(codigo);
      this.aviso.set('Código copiado.');
    } catch {
      this.aviso.set('Não foi possível copiar. Selecione e copie o código acima.');
    }
  }

  private carregar(id: string): void {
    this.carregando.set(true);
    this.api
      .pedido(id)
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (p) => {
          this.atualizar(p);
          const pendente = this.pendente(p);
          if (pendente && !this.expirou()) {
            this.pagamento.set(pendente);
            this.acompanhar();
          }
        },
        error: (e: unknown) => {
          this.pedido.set(null);
          this.erro.set(this.mensagem(e, 'Não foi possível carregar o pedido.'));
          this.encerrado.emit();
        },
      });
  }

  private atualizar(p: Pedido): void {
    this.pedido.set(p);
    const fim = p.expiresAt ? new Date(p.expiresAt).getTime() : null;
    this.expiraEm.set(fim);
    this.agora.set(Date.now());

    if (p.status === 'PAID') {
      this.polling?.unsubscribe();
      this.pago.emit();
    } else if (p.status === 'EXPIRED' || p.status === 'CANCELED') {
      this.polling?.unsubscribe();
      this.expirou.set(true);
    } else if (this.pagamento() && !this.pendente(p)) {
      // O pagamento em andamento foi recusado ou expirou: volta a escolher a forma
      const ultimo = p.payments.at(-1);
      this.polling?.unsubscribe();
      this.pagamento.set(null);
      this.aviso.set(
        ultimo?.status === 'DECLINED'
          ? 'O pagamento foi recusado. Escolha outra forma ou tente de novo.'
          : 'O pagamento expirou. Gere um novo.',
      );
    }
  }

  private pendente(p: Pedido): Pagamento | null {
    return [...p.payments].reverse().find((x) => x.status === 'PENDING') ?? null;
  }

  private acompanhar(): void {
    this.polling?.unsubscribe();
    this.polling = timer(5000, 5000)
      .pipe(
        exhaustMap(() => this.api.pedido(this.orderId()).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((p) => this.atualizar(p));
  }

  private aoExpirar(): void {
    this.polling?.unsubscribe();
    this.expirou.set(true);
    this.verificar();
  }

  private mensagem(erro: unknown, padrao: string): string {
    const e = ApiError.de(erro);
    if (e.status === 429) return 'Muitas tentativas. Aguarde e tente novamente.';
    if (e.status === 503) return 'Pagamento indisponível. Tente novamente mais tarde.';
    if (e.detail && e.status >= 400 && e.status < 500) return e.detail;
    return padrao;
  }
}
