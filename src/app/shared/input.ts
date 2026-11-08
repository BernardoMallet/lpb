import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Field } from './field';

export type InputType = 'text' | 'email' | 'password' | 'tel';

let proximo = 0;

/**
 * Único campo de texto do projeto. Funciona com formControl/ngModel.
 * `otp`: só dígitos (cola "123 456" e vira "123456"), no máximo 6, teclado numérico e autofill do SMS/e-mail.
 */
@Component({
  selector: 'app-input',
  imports: [Field],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Input), multi: true }],
  template: `
    <app-field [label]="label()" [forId]="id" [hint]="hint()" [error]="error()">
      <div class="caixa" [class.invalido]="!!error()" [class.desabilitado]="desabilitado()">
        <input
          #el
          class="campo"
          [class.otp]="otp()"
          [id]="id"
          [type]="tipoEfetivo()"
          [value]="valor()"
          [disabled]="desabilitado()"
          [readOnly]="readonly()"
          [attr.autocomplete]="autocompletar()"
          [attr.inputmode]="modo()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="descricao()"
          spellcheck="false"
          autocapitalize="none"
          (input)="aoDigitar($event)"
          (blur)="aoSair()"
        />
        @if (type() === 'password') {
          <button
            type="button"
            class="mostrar"
            aria-label="Mostrar senha"
            [attr.aria-pressed]="visivel()"
            [disabled]="desabilitado()"
            (click)="visivel.set(!visivel())"
          >
            Mostrar
          </button>
        }
      </div>
    </app-field>
  `,
  styles: `
    :host {
      display: block;
    }
    .caixa {
      display: flex;
      align-items: stretch;
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
    .caixa.desabilitado {
      background: var(--c-paper);
      border-color: var(--c-mute);
    }
    .campo {
      flex: 1;
      min-width: 0;
      padding: 0 14px;
      background: none;
      border: 0;
      outline: none;
      color: var(--c-black);
      font: inherit;
      font-size: 1rem;
    }
    .campo.otp {
      font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: 0.4em;
      text-align: center;
    }
    .mostrar {
      flex: none;
      min-width: 44px;
      padding: 0 12px;
      background: none;
      border: 0;
      border-left: 2px solid var(--c-paper);
      color: var(--c-black);
      font: 700 0.8125rem/1 var(--font-body);
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }
  `,
})
export class Input implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly type = input<InputType>('text');
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly otp = input(false, { transform: booleanAttribute });
  readonly autocomplete = input<string | null>(null);
  readonly inputmode = input<string | null>(null);
  readonly mascara = input<'cpf' | 'cep' | null>(null);
  readonly readonly = input(false, { transform: booleanAttribute });

  protected readonly id = `app-input-${++proximo}`;
  protected readonly valor = signal('');
  protected readonly desabilitado = signal(false);
  protected readonly visivel = signal(false);

  private readonly el = viewChild<ElementRef<HTMLInputElement>>('el');
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly tipoEfetivo = computed(() =>
    this.type() === 'password' && this.visivel() ? 'text' : this.type(),
  );
  protected readonly autocompletar = computed(
    () => this.autocomplete() ?? (this.otp() ? 'one-time-code' : null),
  );
  protected readonly modo = computed(() => this.inputmode() ?? (this.otp() ? 'numeric' : null));
  protected readonly descricao = computed(() => {
    const ids = [this.hint() ? `${this.id}-dica` : '', this.error() ? `${this.id}-erro` : ''];
    return ids.filter(Boolean).join(' ') || null;
  });

  focar(): void {
    this.el()?.nativeElement.focus();
  }

  protected aoDigitar(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    let v = this.otp() ? campo.value.replace(/\D/g, '').slice(0, 6) : campo.value;
    if (this.mascara() === 'cpf') {
      v = v.replace(/\D/g, '').slice(0, 11)
        .replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    } else if (this.mascara() === 'cep') {
      v = v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
    }
    // Sem isto, um caractere recusado ficaria na tela com o mesmo valor no estado
    if (campo.value !== v) campo.value = v;
    this.valor.set(v);
    this.onChange(v);
  }

  protected aoSair(): void {
    this.onTouched();
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
