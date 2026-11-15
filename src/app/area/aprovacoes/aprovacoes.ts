import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { CaravanasApi } from '../../core/caravanas/caravanas.api';
import { PedidoVaga } from '../../core/caravanas/caravanas.models';
import { dataHora } from '../../core/formatos';
import { ROTAS } from '../../core/site.config';
import { Alert } from '../../shared/alert';
import { Button } from '../../shared/button';
import { EmptyState } from '../../shared/empty-state';
import { Modal } from '../../shared/modal';
import { Skeleton } from '../../shared/skeleton';
import { Coluna, Table } from '../../shared/table';
import { ToastService } from '../../shared/toast';

interface Linha extends PedidoVaga {
  vagasLivres: number | null;
}

const COLUNAS: readonly Coluna<Linha>[] = [
  { chave: 'diretor', rotulo: 'Diretor' },
  { chave: 'caravana', rotulo: 'Caravana' },
  { chave: 'vagas', rotulo: 'Vagas livres' },
  { chave: 'quando', rotulo: 'Pedido em' },
  { chave: 'decisao', rotulo: 'Decisão' },
];

/** Pedidos de vaga grátis dos Diretores. Cada decisão passa por um Modal de confirmação. */
@Component({
  selector: 'app-aprovacoes',
  imports: [Alert, Button, EmptyState, Modal, RouterLink, Skeleton, Table],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container">
        <p class="eyebrow">Gestão</p>
        <h1>Aprovações</h1>
        <p class="lead">Pedidos de vaga grátis feitos por Diretores.</p>

        @if (erro(); as mensagem) {
          <app-alert kind="erro">
            {{ mensagem }}
            <button app-button type="button" variant="outline" (click)="carregar()">Tentar de novo</button>
          </app-alert>
        }

        @if (carregando()) {
          <div class="esqueleto" aria-busy="true">
            <app-skeleton width="100%" height="48px" />
            <app-skeleton width="100%" height="48px" />
          </div>
        } @else if (!erro()) {
          <p class="contagem" role="status">
            {{ linhas().length }} {{ linhas().length === 1 ? 'pedido pendente' : 'pedidos pendentes' }}
          </p>
          <app-table [columns]="colunas" [rows]="linhas()" caption="Pedidos de vaga pendentes" stack [cell]="celula">
            <app-empty-state icon="inbox" title="Nenhum pedido pendente">
              Quando um Diretor pedir vaga grátis, o pedido aparece aqui.
            </app-empty-state>
          </app-table>
        }

        <ng-template #celula let-l let-coluna="coluna">
          @switch (coluna.chave) {
            @case ('diretor') {
              {{ l.userName }}
            }
            @case ('caravana') {
              <a [routerLink]="rotas.caravanas + '/' + l.caravanId">{{ l.gameName }}</a>
            }
            @case ('vagas') {
              {{ l.vagasLivres === null ? '—' : l.vagasLivres }}
            }
            @case ('quando') {
              {{ dataHora(l.createdAt) }}
            }
            @default {
              <div class="decisao">
                <button app-button type="button" variant="dark" (click)="abrir(l, 'conceder')">
                  Sim<span class="sr-only">, conceder vaga a {{ l.userName }}</span>
                </button>
                <button app-button type="button" variant="outline" (click)="abrir(l, 'negar')">
                  Não<span class="sr-only">, negar vaga a {{ l.userName }}</span>
                </button>
              </div>
            }
          }
        </ng-template>
      </div>
    </section>

    <app-modal
      [heading]="acao() === 'negar' ? 'Negar pedido?' : 'Conceder vaga?'"
      [open]="!!atual()"
      [dismissible]="!enviando()"
      (closed)="fechar()"
    >
      @if (atual(); as l) {
        @if (acao() === 'negar') {
          <p>
            Negar o pedido do Diretor <strong>{{ l.userName }}</strong> na caravana <strong>{{ l.gameName }}</strong>?
          </p>
        } @else {
          <p>
            Diretor <strong>{{ l.userName }}</strong> pede vaga na caravana <strong>{{ l.gameName }}</strong>.
            Conceder?
          </p>
          <p class="vagas">
            @if (l.vagasLivres === null) {
              A vaga é reservada neste momento, se ainda houver.
            } @else {
              Vagas livres agora: <strong>{{ l.vagasLivres }}</strong>. A vaga é reservada neste momento.
            }
          </p>
        }
      }
      @if (erroAcao(); as mensagem) {
        <app-alert kind="erro">{{ mensagem }}</app-alert>
      }
      <button footer app-button type="button" variant="outline" [disabled]="enviando()" (click)="fechar()">Voltar</button>
      @if (acao() === 'negar') {
        <button footer app-button type="button" variant="danger" [loading]="enviando()" (click)="decidir()">Negar pedido</button>
      }
      @if (semVaga()) {
        <button footer app-button type="button" variant="danger" [disabled]="enviando()" (click)="trocarParaNegar()">
          Negar o pedido
        </button>
      }
      @if (acao() === 'conceder') {
        <button footer app-button type="button" variant="dark" [disabled]="semVaga()" [loading]="enviando()" (click)="decidir()">
          Sim, conceder
        </button>
      }
    </app-modal>
  `,
  styles: `
    h1 {
      margin-bottom: 14px;
    }
    .esqueleto {
      display: grid;
      gap: 8px;
      margin-top: 24px;
    }
    .contagem {
      margin: 24px 0 12px;
      color: var(--c-mute);
    }
    .decisao {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .vagas {
      color: var(--c-mute);
    }
  `,
})
export class Aprovacoes implements OnInit {
  private readonly api = inject(CaravanasApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly rotas = ROTAS;
  protected readonly colunas = COLUNAS;
  protected readonly dataHora = dataHora;
  protected readonly linhas = signal<Linha[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly atual = signal<Linha | null>(null);
  protected readonly acao = signal<'conceder' | 'negar'>('conceder');
  protected readonly enviando = signal(false);
  protected readonly erroAcao = signal<string | null>(null);
  protected readonly semVaga = computed(() => this.acao() === 'conceder' && this.erroAcaoCodigo() === 'SOLD_OUT');
  private readonly erroAcaoCodigo = signal<string | null>(null);

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    forkJoin({ pedidos: this.api.pedidosDeVaga(), caravanas: this.api.listar() })
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ pedidos, caravanas }) => {
          const livres = new Map(caravanas.map((c) => [c.id, c.availableSeats]));
          this.linhas.set(pedidos.map((p) => ({ ...p, vagasLivres: livres.get(p.caravanId) ?? null })));
        },
        error: () => this.erro.set('Não foi possível carregar os pedidos.'),
      });
  }

  protected abrir(l: Linha, acao: 'conceder' | 'negar'): void {
    this.erroAcao.set(null);
    this.erroAcaoCodigo.set(null);
    this.acao.set(acao);
    this.atual.set(l);
  }

  protected trocarParaNegar(): void {
    this.erroAcao.set(null);
    this.erroAcaoCodigo.set(null);
    this.acao.set('negar');
  }

  protected fechar(): void {
    if (this.enviando()) return;
    this.atual.set(null);
  }

  protected decidir(): void {
    const l = this.atual();
    if (!l || this.enviando()) return;
    const conceder = this.acao() === 'conceder';
    this.erroAcao.set(null);
    this.enviando.set(true);
    (conceder ? this.api.aprovar(l.id) : this.api.negar(l.id))
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.atual.set(null);
          this.linhas.update((lista) => lista.filter((x) => x.id !== l.id));
          this.toast.success(conceder ? `Vaga concedida a ${l.userName}.` : `Pedido de ${l.userName} negado.`);
        },
        error: (e: unknown) => this.aoFalhar(e, l),
      });
  }

  private aoFalhar(e: unknown, l: Linha): void {
    const erro = ApiError.de(e);
    this.erroAcaoCodigo.set(erro.code ?? null);
    if (erro.code === 'SOLD_OUT') {
      this.linhas.update((lista) => lista.map((x) => (x.caravanId === l.caravanId ? { ...x, vagasLivres: 0 } : x)));
      this.erroAcao.set('A caravana esgotou. Não há vaga para conceder. Você pode negar o pedido.');
    } else if (erro.code === 'REQUEST_NOT_PENDING') {
      this.atual.set(null);
      this.toast.error('Este pedido já foi decidido. A lista foi atualizada.');
      this.carregar();
    } else if (erro.status >= 400 && erro.status < 500 && erro.detail && erro.status !== 401 && erro.status !== 403) {
      this.erroAcao.set(erro.detail);
    } else {
      this.erroAcao.set('Não foi possível concluir. Tente de novo.');
    }
  }
}
