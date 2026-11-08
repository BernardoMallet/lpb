import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from './icon';

/**
 * Casca comum de rótulo, dica e erro dos campos de formulário (Input, Select).
 * Convenção de ids: `${forId}-dica` e `${forId}-erro`, ligados ao controle via aria-describedby.
 */
@Component({
  selector: 'app-field',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="rotulo" [attr.for]="forId()">{{ label() }}</label>
    <ng-content />
    @if (hint()) {
      <p class="dica" [id]="forId() + '-dica'">{{ hint() }}</p>
    }
    @if (error()) {
      <p class="erro" role="alert" [id]="forId() + '-erro'">
        <app-icon name="alert" />
        <span>{{ error() }}</span>
      </p>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .rotulo {
      display: block;
      margin-bottom: 6px;
      font-size: 0.875rem;
      font-weight: 700;
    }
    .dica,
    .erro {
      margin: 6px 0 0;
      font-size: 0.875rem;
      line-height: 1.4;
    }
    .dica {
      color: var(--c-mute);
    }
    .erro {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      color: var(--c-danger);
      font-weight: 600;
    }
    .erro app-icon {
      margin-top: 1px;
      width: 1.1em;
      height: 1.1em;
    }
  `,
})
export class Field {
  readonly label = input.required<string>();
  readonly forId = input.required<string>();
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
}
