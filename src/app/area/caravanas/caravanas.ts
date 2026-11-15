import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { Auth } from '../../core/auth/auth';
import { CaravanasApi, urlCapa } from '../../core/caravanas/caravanas.api';
import { Caravana, esgotada } from '../../core/caravanas/caravanas.models';
import { ROTAS } from '../../core/site.config';
import { Alert } from '../../shared/alert';
import { Button } from '../../shared/button';
import { Chip, Chips } from '../../shared/chips';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { Skeleton } from '../../shared/skeleton';
import { CaravanaCard, CartaoCaravana } from './caravana-card';
import { CriarCaravana } from './criar-caravana';

type Filtro = 'todas' | 'abertas' | 'esgotadas' | 'confirmadas';

const FILTROS: readonly Chip[] = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'abertas', rotulo: 'Abertas' },
  { id: 'esgotadas', rotulo: 'Esgotadas' },
  { id: 'confirmadas', rotulo: 'Confirmadas' },
];

const PLACEHOLDERS = [1, 2, 3];

function paraCartao(c: Caravana): CartaoCaravana {
  return {
    jogo: c.gameName,
    capaUrl: urlCapa(c),
    local: `${c.municipalityName}/${c.state}`,
    partida: c.departsAt,
    vagasLivres: c.availableSeats,
    vagasTotais: c.totalSeats,
    preco: c.price,
    esgotada: esgotada(c),
    cancelada: c.status === 'CANCELADA',
    confirmada: c.status === 'CONFIRMADA',
  };
}

/** Aba Caravanas: grade de cards, filtros e, para quem tem permissão, o card que abre o modal de criação. */
@Component({
  selector: 'app-caravanas',
  imports: [Alert, Button, CaravanaCard, Chips, CriarCaravana, EmptyState, Icon, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container">
        <p class="eyebrow">Jogos</p>
        <h1>Caravanas</h1>
        <p class="lead">Escolha a caravana e garanta seu banco no ônibus.</p>

        <div class="filtros">
          <app-chips label="Filtrar caravanas" [chips]="filtros" [(selected)]="filtro" />
          <p class="contagem" role="status">
            @if (!carregando() && !erro()) {
              {{ visiveis().length }} {{ visiveis().length === 1 ? 'caravana' : 'caravanas' }}
            }
          </p>
        </div>

        @if (erro(); as mensagem) {
          <app-alert kind="erro">
            {{ mensagem }}
            <button app-button type="button" variant="outline" (click)="carregar()">Tentar de novo</button>
          </app-alert>
        }

        <div class="grade" [attr.aria-busy]="carregando()">
          @if (podeCriar()) {
            <button type="button" class="criar" (click)="criando.set(true)">
              <app-icon name="plus" />
              <span class="criar-titulo">Criar caravana</span>
              <span class="criar-dica">Defina jogo, local, preço e vagas.</span>
            </button>
          }

          @if (carregando()) {
            @for (n of placeholders; track n) {
              <div class="esqueleto">
                <app-skeleton width="100%" height="160px" />
                <app-skeleton width="70%" height="24px" />
                <app-skeleton width="90%" height="16px" />
                <app-skeleton width="50%" height="16px" />
              </div>
            }
          } @else {
            @for (c of visiveis(); track c.id) {
              <app-caravana-card [dados]="cartao(c)" [link]="detalhe(c)" />
            }
          }
        </div>

        @if (!carregando() && !erro() && !visiveis().length) {
          <app-empty-state icon="bus" title="Nenhuma caravana aqui">
            @if (filtro() === 'todas') {
              Ainda não há caravanas cadastradas.
            } @else {
              Nenhuma caravana neste filtro. Tente outro.
            }
          </app-empty-state>
        }
      </div>
    </section>

    @if (podeCriar()) {
      <app-criar-caravana [open]="criando()" (closed)="criando.set(false)" (created)="aoCriar($event)" />
    }
  `,
  styles: `
    h1 {
      margin-bottom: 14px;
    }
    .filtros {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 24px 0;
    }
    .contagem {
      margin: 0;
      color: var(--c-mute);
      font-size: 0.9375rem;
    }
    .grade {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    }
    .criar {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 220px;
      padding: 20px;
      background: var(--c-paper);
      border: 2px dashed var(--c-black);
      border-radius: var(--r-md);
      color: var(--c-black);
      font: inherit;
      text-align: center;
      cursor: pointer;
    }
    .criar:hover {
      background: var(--c-star);
    }
    .criar:focus-visible {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }
    .criar app-icon {
      width: 36px;
      height: 36px;
    }
    .criar-titulo {
      font: 900 1.125rem/1.2 var(--font-display);
      text-transform: uppercase;
    }
    .criar-dica {
      font-size: 0.875rem;
    }
    .esqueleto {
      display: grid;
      gap: 12px;
      padding: 0 0 16px;
    }
  `,
})
export class Caravanas implements OnInit {
  private readonly api = inject(CaravanasApi);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly filtros = FILTROS;
  protected readonly placeholders = PLACEHOLDERS;
  protected readonly filtro = signal<string>('todas');
  protected readonly caravanas = signal<Caravana[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly criando = signal(false);

  protected readonly podeCriar = computed(() => !!this.auth.usuario() && this.auth.temPermissao('CARAVAN_CREATE'));
  protected readonly visiveis = computed(() => {
    const filtro = this.filtro() as Filtro;
    return this.caravanas().filter((c) => {
      if (filtro === 'abertas') return c.status === 'ABERTA' && !esgotada(c);
      if (filtro === 'esgotadas') return esgotada(c);
      if (filtro === 'confirmadas') return c.status === 'CONFIRMADA';
      return true;
    });
  });

  protected readonly cartao = paraCartao;

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api
      .listar()
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (lista) => this.caravanas.set(lista),
        error: (e: unknown) => {
          const erro = ApiError.de(e);
          // 401, 403, 5xx e falta de conexão já foram avisados pelo interceptor
          this.erro.set(erro.semConexao || erro.servidor ? 'Não foi possível carregar as caravanas.' : (erro.detail ?? 'Não foi possível carregar as caravanas.'));
        },
      });
  }

  protected detalhe(c: Caravana): string {
    return `${ROTAS.caravanas}/${c.id}`;
  }

  protected aoCriar(caravana: Caravana): void {
    this.criando.set(false);
    void this.router.navigateByUrl(this.detalhe(caravana));
  }
}
