import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface Chip {
  id: string;
  rotulo: string;
}

/** Único grupo de filtros do projeto: uma opção ativa por vez, com aria-pressed. */
@Component({
  selector: 'app-chips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grupo" role="group" [attr.aria-label]="label()">
      @for (chip of chips(); track chip.id) {
        <button type="button" [attr.aria-pressed]="chip.id === selected()" (click)="selected.set(chip.id)">
          {{ chip.rotulo }}
        </button>
      }
    </div>
  `,
  styles: `
    .grupo {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    button {
      min-height: 44px;
      padding: 0 18px;
      background: var(--c-white);
      border: 2px solid var(--c-black);
      border-radius: 999px;
      color: var(--c-black);
      font: 800 0.8125rem/1 var(--font-body);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
    }
    button[aria-pressed='true'] {
      background: var(--c-black);
      color: var(--c-white);
    }
    button:focus-visible {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }
  `,
})
export class Chips {
  readonly chips = input.required<readonly Chip[]>();
  readonly label = input.required<string>();
  readonly selected = model.required<string>();
}
