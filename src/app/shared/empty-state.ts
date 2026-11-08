import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, IconName } from './icon';

/** Único estado vazio. Conteúdo projetado = explicação e ação (ex.: um app-button). */
@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-icon class="ico" [name]="icon()" />
    <p class="titulo">{{ title() }}</p>
    <div class="texto"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 32px 16px;
      text-align: center;
    }
    .ico {
      width: 40px;
      height: 40px;
      color: var(--c-mute);
    }
    .titulo {
      margin: 0;
      font: 900 1.125rem/1.2 var(--font-display);
      text-transform: uppercase;
    }
    .texto {
      max-width: 44ch;
      color: var(--c-mute);
    }
    .texto:empty {
      display: none;
    }
  `,
})
export class EmptyState {
  readonly icon = input<IconName>('info');
  readonly title = input.required<string>();
}
