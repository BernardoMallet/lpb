import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BENEFICIOS, ROTAS } from '../core/site.config';
import { Track } from '../core/track';
import { Button } from '../shared/button';
import { Card } from '../shared/card';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-benefits',
  imports: [RouterLink, Button, Card, Icon, Track],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="beneficios" class="section section--paper" aria-labelledby="beneficios-titulo">
      <div class="container">
        <p class="eyebrow">Benefícios de ser sócio</p>
        <h2 id="beneficios-titulo">Mais que torcer: pertencer</h2>

        <ul>
          @for (b of beneficios; track b.titulo) {
            <li>
              <app-card variant="outline">
                <span class="icone"><app-icon [name]="b.icone" /></span>
                <h3>{{ b.titulo }}</h3>
                <p>{{ b.texto }}</p>
              </app-card>
            </li>
          }
        </ul>

        <a
          app-button
          variant="dark"
          size="lg"
          [routerLink]="rotas.sejaSocio"
          [appTrack]="'cta_seja_socio'"
          appTrackLocal="beneficios"
        >
          Seja Sócio
        </a>
      </div>
    </section>
  `,
  styles: `
    ul {
      display: grid;
      gap: 16px;
      margin: clamp(28px, 5vw, 44px) 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
    }
    app-card {
      width: 100%;
    }
    .icone {
      display: inline-grid;
      place-items: center;
      width: 44px;
      height: 44px;
      margin-bottom: 14px;
      border-radius: var(--r-sm);
      background: var(--c-star);
      font-size: 1.3rem;
    }
    h3 {
      margin-bottom: 6px;
    }
    p {
      color: var(--c-mute);
    }
    @media (min-width: 640px) {
      ul {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (min-width: 1000px) {
      ul {
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
      }
    }
  `,
})
export class Benefits {
  protected readonly beneficios = BENEFICIOS;
  protected readonly rotas = ROTAS;
}
