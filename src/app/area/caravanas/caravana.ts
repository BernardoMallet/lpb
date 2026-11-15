import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { Auth } from '../../core/auth/auth';
import { CaravanasApi } from '../../core/caravanas/caravanas.api';
import { Caravana, ResultadoReserva, esgotada } from '../../core/caravanas/caravanas.models';
import { dataEHoraCompletas, moeda } from '../../core/formatos';
import { ROTAS } from '../../core/site.config';
import { Alert } from '../../shared/alert';
import { BusMap } from '../../shared/bus-map';
import { Button } from '../../shared/button';
import { Icon } from '../../shared/icon';
import { Skeleton } from '../../shared/skeleton';
import { Aba, Tabs } from '../../shared/tabs';
import { ToastService } from '../../shared/toast';
import { CheckoutVaga } from './checkout-vaga';
import { GestaoCaravana } from './gestao-caravana';

type Situacao =
  | 'cancelada'
  | 'confirmada'
  | 'paga'
  | 'checkout'
  | 'pedido-pendente'
  | 'esgotada'
  | 'encerrada'
  | 'disponivel';

/** Interior da caravana: mapa do ônibus, painel de reserva e checkout, e a aba de gestão para quem tem permissão. */
@Component({
  selector: 'app-caravana-detalhe',
  imports: [Alert, BusMap, Button, CheckoutVaga, GestaoCaravana, Icon, RouterLink, Skeleton, Tabs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './caravana.html',
  styleUrl: './caravana.scss',
})
export class CaravanaDetalhe implements OnInit {
  private readonly api = inject(CaravanasApi);
  private readonly auth = inject(Auth);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  protected readonly rotas = ROTAS;
  protected readonly moeda = moeda;
  protected readonly dataEHoraCompletas = dataEHoraCompletas;

  protected readonly caravana = signal<Caravana | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly erroAcao = signal<string | null>(null);
  protected readonly pedidoEmCheckout = signal<string | null>(null);
  protected readonly aba = signal('vaga');

  private readonly titulo = viewChild<ElementRef<HTMLElement>>('titulo');

  protected readonly papel = computed(() => this.auth.usuario()?.baseRole ?? null);
  protected readonly podeGerir = computed(
    () => this.auth.temPermissao('CARAVAN_CONFIRM') || this.auth.temPermissao('CARAVAN_EDIT'),
  );
  protected readonly abas = computed<Aba[]>(() => [
    { id: 'vaga', rotulo: 'Vaga' },
    { id: 'gestao', rotulo: 'Gestão' },
  ]);

  protected readonly pedidoAtivo = computed(() => {
    const c = this.caravana();
    if (this.pedidoEmCheckout()) return this.pedidoEmCheckout();
    return c?.myBooking?.status === 'RESERVED' ? (c.myBooking.orderId ?? null) : null;
  });

  protected readonly situacao = computed<Situacao | null>(() => {
    const c = this.caravana();
    if (!c) return null;
    if (c.myBooking?.status === 'PAID') return 'paga';
    if (this.pedidoAtivo()) return 'checkout';
    if (c.status === 'CANCELADA') return 'cancelada';
    if (c.status === 'CONFIRMADA') return 'confirmada';
    if (c.myRequestPending) return 'pedido-pendente';
    if (esgotada(c)) return 'esgotada';
    if (!c.salesOpen) return 'encerrada';
    return 'disponivel';
  });

  protected readonly minhaVaga = computed(() => {
    const status = this.caravana()?.myBooking?.status;
    return status === 'RESERVED' || status === 'PAID';
  });

  protected readonly rotuloReservar = computed(() => {
    const c = this.caravana();
    if (this.papel() === 'PRESIDENTE') return 'Pegar vaga';
    if (this.papel() === 'DIRETOR') return 'Pedir vaga grátis';
    return `Pegar vaga · ${moeda(c?.price ?? 0)}`;
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.pedidoEmCheckout.set(null);
      this.aba.set('vaga');
      this.carregar(params.get('id') ?? '', false);
    });
  }

  protected recarregar(): void {
    const id = this.caravana()?.id ?? this.route.snapshot.paramMap.get('id') ?? '';
    this.carregar(id, false);
  }

  protected reservar(): void {
    const c = this.caravana();
    if (!c || this.enviando() || this.situacao() !== 'disponivel') return;
    const papel = this.papel();
    if (papel === 'DIRETOR') {
      this.executar(this.api.pedirVagaGratis(c.id), () => {
        this.toast.success('Pedido enviado. A decisão aparece aqui nesta página.');
        this.carregar(c.id, true);
      });
    } else if (papel === 'PRESIDENTE') {
      this.executar(this.api.pegarVagaGratis(c.id), (r) => this.aposReserva(r));
    } else {
      this.comprar();
    }
  }

  /** Compra a vaga pagando; também é a alternativa do Diretor que não quer pedir vaga grátis. */
  protected comprar(): void {
    const c = this.caravana();
    if (!c || this.enviando() || this.situacao() !== 'disponivel') return;
    this.executar(this.api.reservar(c.id), (r) => this.aposReserva(r));
  }

  protected aoPagar(): void {
    this.pedidoEmCheckout.set(null);
    this.toast.success('Pagamento confirmado.');
    this.carregar(this.caravana()?.id ?? '', true, true);
  }

  protected aoEncerrar(): void {
    this.pedidoEmCheckout.set(null);
    this.carregar(this.caravana()?.id ?? '', true);
  }

  protected atualizar(c: Caravana): void {
    this.caravana.set(c);
  }

  private aposReserva(r: ResultadoReserva): void {
    if (r.orderStatus !== 'PAID') this.pedidoEmCheckout.set(r.orderId);
    this.carregar(this.caravana()?.id ?? '', true, true);
  }

  private executar<T>(chamada: Observable<T>, sucesso: (resultado: T) => void): void {
    this.erroAcao.set(null);
    this.enviando.set(true);
    chamada
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: sucesso,
        error: (e: unknown) => {
          const erro = ApiError.de(e);
          this.erroAcao.set(this.mensagemAcao(erro));
          // Vagas e reserva podem ter mudado enquanto a pessoa decidia
          if (erro.status === 409 || erro.status === 422) this.carregar(this.caravana()?.id ?? '', true);
        },
      });
  }

  private carregar(id: string, silencioso: boolean, focar = false): void {
    if (!silencioso) this.carregando.set(true);
    this.erro.set(null);
    this.api
      .obter(id)
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (c) => {
          this.caravana.set(c);
          if (focar) afterNextRender(() => this.titulo()?.nativeElement.focus(), { injector: this.injector });
        },
        error: (e: unknown) => {
          const erro = ApiError.de(e);
          if (!silencioso) {
            this.caravana.set(null);
            this.erro.set(erro.status === 404 ? 'Caravana não encontrada.' : 'Não foi possível carregar a caravana.');
          }
        },
      });
  }

  private mensagemAcao(e: ApiError): string {
    if (e.status === 429) return 'Muitas tentativas. Aguarde e tente de novo.';
    if (e.detail && e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 403) return e.detail;
    if (e.status === 403) return 'Seu perfil não pode fazer esta ação.';
    return 'Não foi possível concluir. Tente de novo.';
  }
}
