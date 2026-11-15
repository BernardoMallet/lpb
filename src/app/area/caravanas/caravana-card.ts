import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { dataHora, moeda } from '../../core/formatos';
import { Icon } from '../../shared/icon';

/** Dados mínimos do card: a listagem e a prévia do modal de criação alimentam o mesmo componente. */
export interface CartaoCaravana {
  jogo: string;
  capaUrl: string | null;
  local: string;
  partida: string | null;
  vagasLivres: number;
  vagasTotais: number;
  preco: number | null;
  esgotada: boolean;
  cancelada: boolean;
  confirmada: boolean;
}

/** Único card de caravana. Com `link`, o título vira o link e o card inteiro fica clicável. */
@Component({
  selector: 'app-caravana-card',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card" [class.apagado]="dados().esgotada || dados().cancelada">
      <div class="capa">
        @if (dados().capaUrl; as url) {
          <img [src]="url" alt="" loading="lazy" width="640" height="360" />
        } @else {
          <app-icon class="sem-capa" name="bus" />
        }
        @if (selo(); as texto) {
          <span class="selo">{{ texto }}</span>
        }
      </div>
      <div class="corpo">
        <h3 class="jogo">
          @if (link(); as destino) {
            <a [routerLink]="destino">{{ dados().jogo || 'Nome do jogo' }}</a>
          } @else {
            {{ dados().jogo || 'Nome do jogo' }}
          }
        </h3>
        <ul class="info">
          <li><app-icon name="pin" /> {{ dados().local || 'Local de saída' }}</li>
          <li>
            <app-icon name="calendar" />
            {{ dados().partida ? partida() : 'Data e horário' }}
          </li>
          <li>
            <app-icon name="users" />
            @if (dados().esgotada) {
              Sem vagas livres
            } @else {
              <strong>{{ dados().vagasLivres }}</strong>
              {{ dados().vagasLivres === 1 ? 'vaga livre' : 'vagas livres' }} de {{ dados().vagasTotais }}
            }
          </li>
        </ul>
        @if (dados().preco !== null) {
          <p class="preco">{{ preco() }}</p>
        }
      </div>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }
    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      background: var(--c-white);
      border: 2px solid var(--c-black);
      border-radius: var(--r-md);
      transition: box-shadow 0.15s;
    }
    .card:has(a:hover) {
      box-shadow: var(--shadow-hard);
    }
    .card:has(a:focus-visible) {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }
    .apagado .capa img {
      filter: grayscale(1);
    }
    .capa {
      position: relative;
      aspect-ratio: 16 / 9;
      background: var(--c-paper);
      border-bottom: 2px solid var(--c-black);
    }
    .capa img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .sem-capa {
      position: absolute;
      inset: 0;
      margin: auto;
      width: 48px;
      height: 48px;
      color: var(--c-mute);
    }
    .selo {
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 6px 10px;
      background: var(--c-black);
      border-radius: 999px;
      color: var(--c-white);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .corpo {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
    }
    .jogo {
      margin: 0;
      font-size: 1.25rem;
    }
    .jogo a {
      color: inherit;
      text-decoration: none;
    }
    .jogo a::after {
      content: '';
      position: absolute;
      inset: 0;
    }
    .jogo a:focus-visible {
      outline: none;
    }
    .info {
      display: grid;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: 0.9375rem;
    }
    .info li {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .preco {
      margin: auto 0 0;
      padding-top: 6px;
      font: 900 1.375rem/1 var(--font-display);
    }
  `,
})
export class CaravanaCard {
  readonly dados = input.required<CartaoCaravana>();
  readonly link = input<string | null>(null);

  protected readonly partida = computed(() => dataHora(this.dados().partida ?? ''));
  protected readonly preco = computed(() => moeda(this.dados().preco ?? 0));
  protected readonly selo = computed(() => {
    const d = this.dados();
    if (d.cancelada) return 'Cancelada';
    if (d.confirmada) return 'Confirmada';
    return d.esgotada ? 'Esgotada' : null;
  });
}
