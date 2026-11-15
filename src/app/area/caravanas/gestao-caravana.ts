import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { Auth } from '../../core/auth/auth';
import { PAPEIS_GESTAO } from '../../core/auth/auth.models';
import { CaravanasApi, baixarArquivo } from '../../core/caravanas/caravanas.api';
import { Caravana, Comprador, StatusReserva, esgotada } from '../../core/caravanas/caravanas.models';
import { dataEHoraCompletas, moeda } from '../../core/formatos';
import { Alert } from '../../shared/alert';
import { Button } from '../../shared/button';
import { Coluna, Table } from '../../shared/table';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';
import { Skeleton } from '../../shared/skeleton';
import { ToastService } from '../../shared/toast';

const ROTULO_RESERVA: Readonly<Record<StatusReserva, string>> = {
  RESERVED: 'Reservada',
  PAID: 'Paga',
  EXPIRED: 'Expirada',
  REFUNDED: 'Estornada',
  CANCELED: 'Cancelada',
};

const COLUNAS: readonly Coluna<Comprador>[] = [
  { chave: 'nome', rotulo: 'Comprador' },
  { chave: 'status', rotulo: 'Situação' },
  { chave: 'valor', rotulo: 'Valor' },
  { chave: 'presenca', rotulo: 'Presença' },
  { chave: 'acoes', rotulo: 'Ações' },
];

/** Visão de gestão da caravana: confirmar, lista de compradores com presença e estorno. O back decide cada permissão. */
@Component({
  selector: 'app-gestao-caravana',
  imports: [Alert, Button, EmptyState, Icon, Modal, Skeleton, Table],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gestao">
      <section class="bloco" aria-labelledby="gestao-confirmar">
        <h2 id="gestao-confirmar">Confirmar caravana</h2>
        @if (caravana().status === 'CONFIRMADA') {
          <app-alert kind="ok">Caravana confirmada. As vendas estão encerradas.</app-alert>
        } @else if (caravana().status === 'CANCELADA') {
          <app-alert kind="info">Caravana cancelada.</app-alert>
        } @else if (podeConfirmar()) {
          <p>As vendas serão travadas e a lista de presença será liberada. Não dá para desfazer.</p>
          <button app-button type="button" variant="dark" (click)="abrirConfirmar()">Confirmar caravana</button>
        } @else {
          <p>
            Só é possível confirmar quando a caravana estiver esgotada ou depois da data limite de vendas
            ({{ limite() }}).
          </p>
          <button app-button type="button" variant="dark" disabled>Confirmar caravana</button>
        }
      </section>

      <section class="bloco" aria-labelledby="gestao-compradores">
        <div class="cab">
          <h2 id="gestao-compradores">Compradores</h2>
          <div class="baixar">
            <button
              app-button
              type="button"
              variant="outline"
              [disabled]="!confirmada()"
              [loading]="baixando() === 'csv'"
              (click)="baixar('csv')"
            >
              <app-icon name="download" /> CSV
            </button>
            <button
              app-button
              type="button"
              variant="outline"
              [disabled]="!confirmada()"
              [loading]="baixando() === 'pdf'"
              (click)="baixar('pdf')"
            >
              <app-icon name="download" /> PDF
            </button>
          </div>
        </div>
        @if (!confirmada()) {
          <p class="nota">A presença e a lista para download ficam disponíveis depois de confirmar a caravana.</p>
        }
        @if (erro(); as mensagem) {
          <app-alert kind="erro">
            {{ mensagem }}
            <button app-button type="button" variant="outline" (click)="carregar()">Tentar de novo</button>
          </app-alert>
        }

        @if (carregando()) {
          <div class="esqueleto" aria-busy="true">
            <app-skeleton width="100%" height="44px" />
            <app-skeleton width="100%" height="44px" />
            <app-skeleton width="100%" height="44px" />
          </div>
        } @else {
          <app-table [columns]="colunas" [rows]="compradores()" caption="Compradores da caravana" stack [cell]="celula">
            <app-empty-state icon="users" title="Nenhum comprador ainda">As vagas pagas aparecem aqui.</app-empty-state>
          </app-table>
        }
        <ng-template #celula let-c let-coluna="coluna">
          @switch (coluna.chave) {
            @case ('nome') {
              {{ c.name }}
            }
            @case ('status') {
              {{ rotulo(c.status) }}
            }
            @case ('valor') {
              {{ moeda(c.amount) }}
            }
            @case ('presenca') {
              @if (c.status === 'PAID') {
                <label class="presenca">
                  <input
                    type="checkbox"
                    [checked]="c.attended"
                    [disabled]="!confirmada() || salvandoPresenca() === c.bookingId"
                    (change)="presenca(c, $any($event.target).checked)"
                  />
                  <span class="sr-only">Presença de {{ c.name }}</span>
                  <span aria-hidden="true">{{ c.attended ? 'Presente' : 'Ausente' }}</span>
                </label>
              } @else {
                —
              }
            }
            @default {
              @if (podeEstornar(c)) {
                <button app-button type="button" variant="danger" (click)="abrirEstorno(c)">Estornar</button>
              } @else if (c.status === 'PAID') {
                <span class="nota">Só o Adm Geral estorna após a confirmação.</span>
              } @else {
                —
              }
            }
          }
        </ng-template>
      </section>
    </div>

    <app-modal heading="Confirmar caravana?" [open]="confirmando()" [dismissible]="!enviando()" (closed)="confirmando.set(false)">
      <p>Ao confirmar:</p>
      <ul>
        <li>as vendas e novas reservas são travadas;</li>
        <li>a lista de compradores e a lista de presença são liberadas;</li>
        <li>depois disso, só o Adm Geral pode estornar compras.</li>
      </ul>
      @if (erroAcao(); as mensagem) {
        <app-alert kind="erro">{{ mensagem }}</app-alert>
      }
      <button footer app-button type="button" variant="outline" [disabled]="enviando()" (click)="confirmando.set(false)">Voltar</button>
      <button footer app-button type="button" variant="dark" [loading]="enviando()" (click)="confirmar()">Confirmar caravana</button>
    </app-modal>

    <app-modal heading="Estornar compra?" [open]="!!estornando()" [dismissible]="!enviando()" (closed)="estornando.set(null)">
      @if (estornando(); as c) {
        <p>
          Estornar a vaga de <strong>{{ c.name }}</strong> ({{ moeda(c.amount) }}).
        </p>
        <ul>
          <li>o valor é devolvido por inteiro;</li>
          <li>a vaga volta para a venda;</li>
          <li>a compra fica como estornada e o comprovante é cancelado;</li>
          <li>não dá para desfazer.</li>
        </ul>
      }
      @if (erroAcao(); as mensagem) {
        <app-alert kind="erro">{{ mensagem }}</app-alert>
      }
      <button footer app-button type="button" variant="outline" [disabled]="enviando()" (click)="estornando.set(null)">Voltar</button>
      <button footer app-button type="button" variant="danger" [loading]="enviando()" (click)="estornar()">Estornar compra</button>
    </app-modal>
  `,
  styles: `
    .gestao {
      display: grid;
      gap: 28px;
      margin-top: 20px;
    }
    .bloco {
      display: grid;
      gap: 14px;
    }
    .bloco h2 {
      margin: 0;
      font-size: 1.25rem;
    }
    .bloco p {
      margin: 0;
    }
    .cab {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .baixar {
      display: flex;
      gap: 8px;
    }
    .nota {
      color: var(--c-mute);
      font-size: 0.875rem;
    }
    .esqueleto {
      display: grid;
      gap: 8px;
    }
    .presenca {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-height: 44px;
      cursor: pointer;
    }
    .presenca input {
      width: 24px;
      height: 24px;
      accent-color: var(--c-black);
    }
  `,
})
export class GestaoCaravana {
  private readonly api = inject(CaravanasApi);
  private readonly auth = inject(Auth);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly caravana = input.required<Caravana>();
  readonly atualizada = output<Caravana>();

  protected readonly colunas = COLUNAS;
  protected readonly moeda = moeda;
  protected readonly compradores = signal<Comprador[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly confirmando = signal(false);
  protected readonly estornando = signal<Comprador | null>(null);
  protected readonly enviando = signal(false);
  protected readonly erroAcao = signal<string | null>(null);
  protected readonly baixando = signal<'csv' | 'pdf' | null>(null);
  protected readonly salvandoPresenca = signal<string | null>(null);

  protected readonly confirmada = computed(() => this.caravana().status === 'CONFIRMADA');
  protected readonly limite = computed(() => dataEHoraCompletas(this.caravana().salesDeadline));
  protected readonly podeConfirmar = computed(() => {
    const c = this.caravana();
    return (
      this.auth.temPermissao('CARAVAN_CONFIRM') &&
      c.status === 'ABERTA' &&
      (esgotada(c) || new Date(c.salesDeadline).getTime() <= Date.now())
    );
  });

  constructor() {
    effect(() => {
      this.caravana().id;
      untracked(() => this.carregar());
    });
  }

  protected rotulo(status: StatusReserva): string {
    return ROTULO_RESERVA[status];
  }

  protected abrirConfirmar(): void {
    this.erroAcao.set(null);
    this.confirmando.set(true);
  }

  protected abrirEstorno(c: Comprador): void {
    this.erroAcao.set(null);
    this.estornando.set(c);
  }

  protected podeEstornar(c: Comprador): boolean {
    if (c.status !== 'PAID' || !this.auth.temPapel(PAPEIS_GESTAO)) return false;
    return !this.confirmada() || this.auth.temPapel(['ADM_GERAL']);
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api
      .compradores(this.caravana().id)
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (lista) => this.compradores.set(lista),
        error: (e: unknown) => this.erro.set(this.mensagem(e, 'Não foi possível carregar os compradores.')),
      });
  }

  protected confirmar(): void {
    if (this.enviando()) return;
    this.erroAcao.set(null);
    this.enviando.set(true);
    this.api
      .confirmarCaravana(this.caravana().id)
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (c) => {
          this.confirmando.set(false);
          this.toast.success('Caravana confirmada.');
          this.atualizada.emit(c);
        },
        error: (e: unknown) => this.erroAcao.set(this.mensagem(e, 'Não foi possível confirmar a caravana.')),
      });
  }

  protected presenca(c: Comprador, presente: boolean): void {
    if (this.salvandoPresenca()) return;
    this.salvandoPresenca.set(c.bookingId);
    this.marcar(c.bookingId, presente);
    this.api
      .marcarPresenca(this.caravana().id, c.bookingId, presente)
      .pipe(
        finalize(() => this.salvandoPresenca.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (e: unknown) => {
          this.marcar(c.bookingId, !presente);
          this.toast.error(this.mensagem(e, 'Não foi possível salvar a presença.'));
        },
      });
  }

  protected estornar(): void {
    const c = this.estornando();
    if (!c || this.enviando()) return;
    this.erroAcao.set(null);
    this.enviando.set(true);
    this.api
      .estornar(c.orderId)
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.estornando.set(null);
          this.toast.success('Compra estornada. A vaga voltou para a venda.');
          this.api.obter(this.caravana().id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((atual) => this.atualizada.emit(atual));
        },
        error: (e: unknown) => {
          const erro = ApiError.de(e);
          this.erroAcao.set(
            erro.code === 'REFUND_FAILED'
              ? 'O estorno não foi concluído. A compra continua marcada para nova tentativa: tente de novo.'
              : this.mensagem(e, 'Não foi possível estornar a compra.'),
          );
        },
      });
  }

  protected baixar(formato: 'csv' | 'pdf'): void {
    if (this.baixando()) return;
    this.baixando.set(formato);
    this.api
      .listaPresenca(this.caravana().id, formato)
      .pipe(
        finalize(() => this.baixando.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (arquivo) => baixarArquivo(arquivo, `lista-de-presenca.${formato}`),
        error: (e: unknown) => this.toast.error(this.mensagem(e, 'Não foi possível baixar a lista.')),
      });
  }

  private marcar(bookingId: string, presente: boolean): void {
    this.compradores.update((lista) => lista.map((c) => (c.bookingId === bookingId ? { ...c, attended: presente } : c)));
  }

  private mensagem(erro: unknown, padrao: string): string {
    const e = ApiError.de(erro);
    if (e.detail && e.status >= 400 && e.status < 500) return e.detail;
    return padrao;
  }
}
