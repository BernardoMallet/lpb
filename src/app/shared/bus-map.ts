import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output } from '@angular/core';

interface Banco {
  numero: number;
  estado: 'livre' | 'ocupado' | 'meu';
}

/**
 * Único mapa de ônibus do projeto: planta 2+2 ilustrativa. A API só informa quantas vagas estão
 * ocupadas, então os bancos ocupados são os primeiros, na ordem de entrada no ônibus.
 * Os bancos são atalho para o mouse; o equivalente por teclado e leitor de tela é o botão de reserva da página.
 */
@Component({
  selector: 'app-bus-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="mapa">
      <p class="sr-only">{{ resumo() }}. Para reservar, use o botão de reserva ao lado do mapa.</p>
      <div class="onibus" aria-hidden="true">
        <div class="frente"><span class="motorista">Motorista</span></div>
        <ol class="bancos">
          @for (banco of bancos(); track banco.numero) {
            <li [class.corredor]="banco.numero % 4 === 2">
              <button
                type="button"
                class="banco"
                tabindex="-1"
                [class.ocupado]="banco.estado === 'ocupado'"
                [class.meu]="banco.estado === 'meu'"
                [disabled]="banco.estado !== 'livre' || !canPick()"
                (click)="pick.emit()"
              >
                {{ banco.numero }}
              </button>
            </li>
          }
        </ol>
      </div>
      <ul class="legenda" aria-hidden="true">
        <li><span class="amostra"></span> Livre ({{ livres() }})</li>
        <li><span class="amostra ocupado"></span> Ocupado</li>
        @if (mine()) {
          <li><span class="amostra meu"></span> Sua vaga</li>
        }
      </ul>
      <figcaption>Posições ilustrativas: a ordem é a de entrada no ônibus.</figcaption>
    </figure>
  `,
  styles: `
    :host {
      display: block;
    }
    .mapa {
      margin: 0;
    }
    .onibus {
      width: fit-content;
      max-width: 100%;
      margin: 0 auto;
      padding: 12px 16px 16px;
      background: var(--c-white);
      border: 2px solid var(--c-black);
      border-radius: var(--r-lg) var(--r-lg) var(--r-md) var(--r-md);
    }
    .frente {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 2px dashed var(--c-mute);
    }
    .motorista {
      padding: 6px 10px;
      background: var(--c-paper);
      border: 2px solid var(--c-black);
      border-radius: var(--r-sm);
      font-size: 0.6875rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .bancos {
      display: grid;
      grid-template-columns: repeat(4, auto);
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .corredor {
      margin-right: 24px;
    }
    .banco {
      width: 44px;
      height: 44px;
      padding: 0;
      background: var(--c-white);
      border: 2px solid var(--c-black);
      border-radius: var(--r-sm);
      color: var(--c-black);
      font: 800 0.8125rem/1 var(--font-body);
      cursor: pointer;
    }
    .banco:not(:disabled):hover {
      background: var(--c-star);
    }
    .banco:disabled {
      cursor: default;
    }
    .banco.ocupado {
      background: var(--c-graphite);
      border-color: var(--c-graphite);
      color: var(--c-white);
      opacity: 0.85;
    }
    .banco.meu {
      background: var(--c-star);
      outline: 3px solid var(--c-black);
      outline-offset: 1px;
      opacity: 1;
    }
    .legenda {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px 18px;
      margin: 14px 0 0;
      padding: 0;
      list-style: none;
      font-size: 0.875rem;
    }
    .legenda li {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .amostra {
      width: 18px;
      height: 18px;
      background: var(--c-white);
      border: 2px solid var(--c-black);
      border-radius: 4px;
    }
    .amostra.ocupado {
      background: var(--c-graphite);
    }
    .amostra.meu {
      background: var(--c-star);
    }
    figcaption {
      margin-top: 10px;
      color: var(--c-mute);
      font-size: 0.875rem;
      text-align: center;
    }
  `,
})
export class BusMap {
  readonly total = input.required<number>();
  readonly occupied = input.required<number>();
  /** Há reserva ativa do usuário: o último banco ocupado é destacado como "sua vaga". */
  readonly mine = input(false, { transform: booleanAttribute });
  readonly canPick = input(false, { transform: booleanAttribute });
  readonly pick = output<void>();

  protected readonly livres = computed(() => Math.max(0, this.total() - this.occupied()));
  protected readonly bancos = computed<Banco[]>(() => {
    const ocupados = Math.min(this.occupied(), this.total());
    return Array.from({ length: this.total() }, (_, i): Banco => {
      const numero = i + 1;
      if (numero > ocupados) return { numero, estado: 'livre' };
      return { numero, estado: this.mine() && numero === ocupados ? 'meu' : 'ocupado' };
    });
  });
  protected readonly resumo = computed(
    () =>
      `${this.total()} bancos, ${Math.min(this.occupied(), this.total())} ocupados, ${this.livres()} livres`,
  );
}
