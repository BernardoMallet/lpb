import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LINKS, LOJA_FISICA } from '../core/site.config';
import { Track } from '../core/track';
import { Button } from '../shared/button';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-shop',
  imports: [Button, Icon, Track],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="loja" class="section section--dark" aria-labelledby="loja-titulo">
      <div class="container grade">
        <div>
          <p class="eyebrow">Loja oficial</p>
          <h2 id="loja-titulo">Vista LOUCOS</h2>
          <p class="lead">
            Loja física e loja online com a nossa identidade. Escolha o seu jeito de comprar e leve
            a arquibancada para o dia a dia.
          </p>
          <ul class="canais">
            <li>
              <app-icon name="pin" />
              <span>
                Loja física
                @if (fisica.endereco; as endereco) {
                  <small>{{ endereco }}</small>
                }
              </span>
            </li>
            <li>
              <app-icon name="bag" />
              <span>Loja online <small>Entrega para todo o Brasil</small></span>
            </li>
          </ul>
        </div>
        <div class="acao">
          <a
            app-button
            variant="primary"
            size="lg"
            [href]="links.loja"
            target="_blank"
            rel="noopener noreferrer"
            [appTrack]="'cta_loja'"
            appTrackLocal="loja"
          >
            Visitar a loja
            <app-icon name="ext" />
            <span class="sr-only">(abre em nova aba)</span>
          </a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .grade {
      display: grid;
      gap: 32px;
      align-items: center;
    }
    .lead {
      margin-top: 14px;
    }
    .canais {
      display: grid;
      gap: 16px;
      margin: 28px 0 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      font-size: 1.0625rem;
      font-weight: 700;

      app-icon {
        margin-top: 2px;
        font-size: 1.5rem;
        color: var(--c-star);
      }
    }
    small {
      display: block;
      color: var(--c-mute-dark);
      font-weight: 400;
    }
    @media (min-width: 900px) {
      .grade {
        grid-template-columns: 1.4fr 1fr;
        gap: 64px;
      }
      .acao {
        justify-self: end;
      }
    }
  `,
})
export class Shop {
  protected readonly links = LINKS;
  protected readonly fisica = LOJA_FISICA;
}
