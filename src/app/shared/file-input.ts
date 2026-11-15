import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Field } from './field';

let proximo = 0;

/**
 * Único seletor de arquivo do projeto. Só escolhe e avisa; validar tipo e tamanho é da página,
 * porque o back repete a validação.
 */
@Component({
  selector: 'app-file-input',
  imports: [Field],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-field [label]="label()" [forId]="id" [hint]="hint()" [error]="error()">
      <input
        class="arquivo"
        type="file"
        [id]="id"
        [attr.accept]="accept()"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="descricao()"
        (change)="aoEscolher($event)"
      />
    </app-field>
  `,
  styles: `
    :host {
      display: block;
    }
    .arquivo {
      width: 100%;
      min-height: 48px;
      padding: 8px 10px;
      background: var(--c-white);
      border: 2px dashed var(--c-black);
      border-radius: var(--r-sm);
      font: inherit;
      font-size: 0.9375rem;
    }
    .arquivo:focus-visible {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }
    .arquivo[aria-invalid='true'] {
      border-color: var(--c-danger);
    }
  `,
})
export class FileInput {
  readonly label = input.required<string>();
  readonly accept = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly chosen = output<File | null>();

  protected readonly id = `app-file-${++proximo}`;

  protected descricao(): string | null {
    const ids = [this.hint() ? `${this.id}-dica` : '', this.error() ? `${this.id}-erro` : ''];
    return ids.filter(Boolean).join(' ') || null;
  }

  protected aoEscolher(evento: Event): void {
    this.chosen.emit((evento.target as HTMLInputElement).files?.item(0) ?? null);
  }
}
