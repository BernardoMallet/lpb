import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Field } from './field';
import { Icon } from './icon';

export interface OpcaoSelect {
  valor: string;
  rotulo: string;
}

let proximo = 0;

/** Único select do projeto: <select> nativo (acessível por padrão) com o mesmo visual do Input. */
@Component({
  selector: 'app-select',
  imports: [Field, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
  template: `
    <app-field [label]="label()" [forId]="id" [hint]="hint()" [error]="error()">
      <div class="caixa" [class.invalido]="!!error()">
        <select
          class="campo"
          [id]="id"
          [disabled]="desabilitado()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="descricao()"
          (change)="aoMudar($event)"
          (blur)="onTouched()"
        >
          @if (placeholder()) {
            <option value="" [selected]="!valor()">{{ placeholder() }}</option>
          }
          @for (o of options(); track o.valor) {
            <option [value]="o.valor" [selected]="o.valor === valor()">{{ o.rotulo }}</option>
          }
        </select>
        <app-icon class="seta" name="chevron" />
      </div>
    </app-field>
  `,
  styles: `
    :host {
      display: block;
    }
    .caixa {
      position: relative;
      min-height: 48px;
      background: var(--c-white);
      border: 2px solid var(--c-black);
      border-radius: var(--r-sm);
    }
    .caixa:focus-within {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }
    .caixa.invalido {
      border-color: var(--c-danger);
    }
    .campo {
      width: 100%;
      min-height: 44px;
      padding: 0 40px 0 14px;
      background: none;
      border: 0;
      outline: none;
      appearance: none;
      color: var(--c-black);
      font: inherit;
      font-size: 1rem;
    }
    .seta {
      position: absolute;
      top: 50%;
      right: 12px;
      transform: translateY(-50%);
      pointer-events: none;
    }
  `,
})
export class Select implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly options = input.required<readonly OpcaoSelect[]>();
  readonly placeholder = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);

  protected readonly id = `app-select-${++proximo}`;
  protected readonly valor = signal('');
  protected readonly desabilitado = signal(false);

  protected onTouched: () => void = () => {};
  private onChange: (v: string) => void = () => {};

  protected descricao(): string | null {
    const ids = [this.hint() ? `${this.id}-dica` : '', this.error() ? `${this.id}-erro` : ''];
    return ids.filter(Boolean).join(' ') || null;
  }

  protected aoMudar(evento: Event): void {
    const v = (evento.target as HTMLSelectElement).value;
    this.valor.set(v);
    this.onChange(v);
  }

  writeValue(v: string | null): void {
    this.valor.set(v ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(desabilitado: boolean): void {
    this.desabilitado.set(desabilitado);
  }
}
