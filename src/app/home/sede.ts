import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LINKS, SEDE } from '../core/site.config';
import { Track } from '../core/track';
import { Button } from '../shared/button';
import { Card } from '../shared/card';
import { Icon, IconName } from '../shared/icon';

interface Atividade {
  icone: IconName;
  titulo: string;
  texto: string;
}

@Component({
  selector: 'app-sede',
  imports: [NgOptimizedImage, Button, Card, Icon, Track],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="sede" aria-labelledby="sede-titulo">
      <div class="faixa">
        <img ngSrc="images/foto1.webp" fill sizes="100vw" alt="" />
        <div class="container">
          <app-card variant="poster">
            <p class="eyebrow">Nossa sede</p>
            <h2 id="sede-titulo">onde estamos</h2>
            <p class="texto">
              Pré-jogos, ensaios da Banda de General e eventos para quem vive o Botafogo muito além
              dos 90 minutos.
            </p>
            <address>
              <app-icon name="pin" />
              <span>
                {{ 'R. Dr. Padilha, 184 - Engenho de Dentro, Rio de Janeiro - RJ - Setor Leste' }}
                @if (sede.horarios; as horarios) {
                  <small>{{ horarios }}</small>
                }
              </span>
            </address>
            <a
              app-button
              variant="dark"
              size="lg"
              [href]="links.comoChegar"
              target="_blank"
              rel="noopener noreferrer"
              [appTrack]="'cta_como_chegar'"
              appTrackLocal="sede"
            >
              Como chegar
              <app-icon name="ext" />
              <span class="sr-only">(abre em nova aba)</span>
            </a>
          </app-card>
        </div>
      </div>

      <div class="container">
        <ul class="atividades">
          @for (a of atividades; track a.titulo) {
            <li>
              <app-card variant="outline">
                <span class="icone"><app-icon [name]="a.icone" /></span>
                <h3>{{ a.titulo }}</h3>
                <p>{{ a.texto }}</p>
              </app-card>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    .faixa {
      position: relative;
      isolation: isolate;
      padding-block: clamp(48px, 8vw, 96px);
      background: var(--c-black);

      img {
        z-index: -1;
        object-fit: cover;
        opacity: 0.55;
      }
    }
    app-card {
      max-width: 560px;
    }
    h2 {
      margin-bottom: 14px;
    }
    .texto {
      color: var(--c-mute);
    }
    address {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 20px 0 24px;
      font-style: normal;
      font-weight: 700;

      app-icon {
        margin-top: 2px;
      }
    }
    small {
      display: block;
      color: var(--c-mute);
      font-weight: 400;
    }
    .atividades {
      display: grid;
      gap: 16px;
      margin: 0;
      padding: clamp(40px, 7vw, 72px) 0;
      list-style: none;
    }
    .atividades li {
      display: flex;
    }
    .atividades app-card {
      width: 100%;
      max-width: none;
    }
    .icone {
      display: inline-grid;
      place-items: center;
      width: 44px;
      height: 44px;
      margin-bottom: 14px;
      border-radius: 50%;
      background: var(--c-black);
      color: var(--c-star);
      font-size: 1.3rem;
    }
    h3 {
      margin-bottom: 6px;
    }
    .atividades p {
      color: var(--c-mute);
    }
    @media (min-width: 800px) {
      .atividades {
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
      }
    }
  `,
})
export class Sede {
  protected readonly links = LINKS;
  protected readonly sede = SEDE;
  protected readonly atividades: readonly Atividade[] = [
    {
      icone: 'users',
      titulo: 'Pré-jogos',
      texto: 'Encontro antes de cada partida, com a galera toda reunida.',
    },
    {
      icone: 'music',
      titulo: 'Ensaios da Banda',
      texto: 'Acompanhe a Banda de General preparando a arquibancada.',
    },
    { icone: 'calendar', titulo: 'Eventos', texto: 'Confraternizações e ações ao longo do ano.' },
  ];
}
