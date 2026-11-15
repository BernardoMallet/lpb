import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { CaravanasApi, baixarArquivo } from '../../core/caravanas/caravanas.api';
import { Compra } from '../../core/caravanas/caravanas.models';
import { ROTULO_STATUS_PEDIDO, dataHora, moeda } from '../../core/formatos';
import { ROTAS } from '../../core/site.config';
import { Alert } from '../../shared/alert';
import { Button } from '../../shared/button';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { Skeleton } from '../../shared/skeleton';
import { Coluna, Table } from '../../shared/table';
import { ToastService } from '../../shared/toast';

const COLUNAS: readonly Coluna<Compra>[] = [
  { chave: 'descricao', rotulo: 'Compra' },
  { chave: 'valor', rotulo: 'Valor' },
  { chave: 'data', rotulo: 'Data' },
  { chave: 'status', rotulo: 'Situação' },
  { chave: 'acoes', rotulo: 'Comprovante' },
];

const REEMBOLSADAS = new Set<Compra['status']>(['REFUNDED']);

/** Compras do usuário logado, com o comprovante em PDF. Comprovantes de compras estornadas ficam sinalizados e sem download. */
@Component({
  selector: 'app-minhas-compras',
  imports: [Alert, Button, EmptyState, Icon, RouterLink, Skeleton, Table],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container">
        <p class="eyebrow">Minha conta</p>
        <h1>Minhas compras</h1>
        <p class="lead">Salve o comprovante da sua vaga aqui. Só você tem acesso a ele.</p>

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
            <app-skeleton width="100%" height="48px" />
          </div>
        } @else if (!erro()) {
          <app-table [columns]="colunas" [rows]="compras()" caption="Minhas compras" stack [cell]="celula">
            <app-empty-state icon="ticket" title="Nenhuma compra ainda">
              Quando você pegar uma vaga em uma caravana, ela aparece aqui.
              <a app-button variant="dark" [routerLink]="rotas.caravanas">Ver caravanas</a>
            </app-empty-state>
          </app-table>
        }

        <ng-template #celula let-c let-coluna="coluna">
          @switch (coluna.chave) {
            @case ('descricao') {
              {{ c.description }}
            }
            @case ('valor') {
              {{ moeda(c.amount) }}
            }
            @case ('data') {
              {{ dataHora(c.paidAt ?? c.createdAt) }}
            }
            @case ('status') {
              <span class="selo" [class.estornada]="estornada(c)" [class.paga]="c.status === 'PAID'">
                {{ rotulo(c.status) }}
              </span>
            }
            @default {
              @if (c.status === 'PAID') {
                <button
                  app-button
                  type="button"
                  variant="outline"
                  [loading]="baixando() === c.id"
                  [disabled]="!!baixando() && baixando() !== c.id"
                  (click)="baixar(c)"
                >
                  <app-icon name="download" /> Baixar PDF
                </button>
              } @else if (estornada(c)) {
                <span class="nota">Comprovante cancelado</span>
              } @else if (c.status === 'PENDING_PAYMENT') {
                <a app-button variant="primary" [routerLink]="rotas.caravanas + '/' + c.referenceId">Continuar pagamento</a>
              } @else {
                <span class="nota">Sem comprovante</span>
              }
            }
          }
        </ng-template>
      </div>
    </section>
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
    .selo {
      display: inline-block;
      padding: 4px 10px;
      background: var(--c-paper);
      border: 1px solid var(--c-black);
      border-radius: var(--r-sm);
      font-size: 0.8125rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    .selo.paga {
      background: var(--c-success);
      border-color: var(--c-success);
      color: var(--c-white);
    }
    .selo.estornada {
      background: var(--c-danger);
      border-color: var(--c-danger);
      color: var(--c-white);
    }
    .nota {
      color: var(--c-mute);
      font-size: 0.875rem;
    }
  `,
})
export class MinhasCompras implements OnInit {
  private readonly api = inject(CaravanasApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly rotas = ROTAS;
  protected readonly colunas = COLUNAS;
  protected readonly moeda = moeda;
  protected readonly dataHora = dataHora;
  protected readonly compras = signal<Compra[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly baixando = signal<string | null>(null);

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api
      .minhasCompras()
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (lista) => this.compras.set(lista),
        error: () => this.erro.set('Não foi possível carregar suas compras.'),
      });
  }

  protected rotulo(status: Compra['status']): string {
    return ROTULO_STATUS_PEDIDO[status];
  }

  protected estornada(c: Compra): boolean {
    return REEMBOLSADAS.has(c.status);
  }

  protected baixar(c: Compra): void {
    if (this.baixando()) return;
    this.baixando.set(c.id);
    this.api
      .comprovante(c.id)
      .pipe(
        finalize(() => this.baixando.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pdf) => baixarArquivo(pdf, `comprovante-${c.id}.pdf`),
        error: (e: unknown) => {
          const erro = ApiError.de(e);
          this.toast.error(erro.status === 404 || erro.status === 409 ? 'Comprovante indisponível para esta compra.' : 'Não foi possível baixar o comprovante.');
        },
      });
  }
}
