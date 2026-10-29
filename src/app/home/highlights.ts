import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from '../shared/card';
import { Icon, IconName } from '../shared/icon';
import { HOSPICIOS } from './hospicios.data';

interface Destaque {
  icone: IconName;
  titulo: string;
  texto: string;
}

@Component({
  selector: 'app-highlights',
  imports: [Card, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="faixa" aria-label="Destaques">
      <div class="container">
        <ul>
          @for (item of destaques; track item.titulo) {
            <li>
              <app-card variant="outline">
                <span class="icone"><app-icon [name]="item.icone" /></span>
                <h3>{{ item.titulo }}</h3>
                <p>{{ item.texto }}</p>
              </app-card>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    .faixa {
      padding-block: clamp(36px, 6vw, 64px);
    }
    ul {
      display: grid;
      gap: 16px;
      margin: 0;
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
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      margin-bottom: 14px;
      border-radius: 50%;
      background: var(--c-black);
      color: var(--c-star);
      font-size: 1.35rem;
    }
    h3 {
      margin-bottom: 6px;
    }
    p {
      color: var(--c-mute);
    }
    @media (min-width: 800px) {
      ul {
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
      }
    }
  `,
})
export class Highlights {
  protected readonly destaques: readonly Destaque[] = [
    {
      icone: 'users',
      titulo: `Faça parte dessa loucura`,
      texto: 'Encontre o hospício mais perto de você.',
    },
    {
      icone: 'music',
      titulo: '90 minutos sem parar de cantar',
      texto: 'Revolucinamos o canto da arquibancada',
    },
    {
      icone: 'pin',
      titulo: 'Sede com pré-jogos e muito mais',
      texto: 'Ensaios, eventos e encontros o ano todo.',
    },
  ];
}
