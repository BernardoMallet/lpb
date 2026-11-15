import { ChangeDetectionStrategy, Component, ElementRef, input, model, viewChildren } from '@angular/core';

export interface Aba {
  id: string;
  rotulo: string;
}

/**
 * Única lista de abas do projeto (padrão WAI-ARIA: setas, Home e End).
 * O painel fica com a página: <div role="tabpanel" [id]="prefixo + '-painel-' + id" [attr.aria-labelledby]="prefixo + '-aba-' + id">.
 */
@Component({
  selector: 'app-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lista" role="tablist" [attr.aria-label]="label()">
      @for (aba of tabs(); track aba.id; let i = $index) {
        <button
          #btn
          type="button"
          role="tab"
          [id]="prefix() + '-aba-' + aba.id"
          [attr.aria-selected]="aba.id === active()"
          [attr.aria-controls]="prefix() + '-painel-' + aba.id"
          [attr.tabindex]="aba.id === active() ? 0 : -1"
          (click)="active.set(aba.id)"
          (keydown)="aoTeclar($event, i)"
        >
          {{ aba.rotulo }}
        </button>
      }
    </div>
  `,
  styles: `
    .lista {
      display: flex;
      gap: 4px;
      border-bottom: 2px solid var(--c-black);
    }
    button {
      min-height: 44px;
      padding: 0 18px;
      background: none;
      border: 2px solid transparent;
      border-bottom: 0;
      border-radius: var(--r-sm) var(--r-sm) 0 0;
      color: var(--c-mute);
      font: 800 0.875rem/1 var(--font-body);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
    }
    button[aria-selected='true'] {
      margin-bottom: -2px;
      background: var(--c-black);
      color: var(--c-white);
    }
    button:focus-visible {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }
  `,
})
export class Tabs {
  readonly tabs = input.required<readonly Aba[]>();
  readonly label = input.required<string>();
  readonly prefix = input('aba');
  readonly active = model.required<string>();

  private readonly botoes = viewChildren<ElementRef<HTMLButtonElement>>('btn');

  protected aoTeclar(evento: KeyboardEvent, indice: number): void {
    const total = this.tabs().length;
    let alvo = -1;
    if (evento.key === 'ArrowRight') alvo = (indice + 1) % total;
    else if (evento.key === 'ArrowLeft') alvo = (indice - 1 + total) % total;
    else if (evento.key === 'Home') alvo = 0;
    else if (evento.key === 'End') alvo = total - 1;
    if (alvo < 0) return;
    evento.preventDefault();
    this.active.set(this.tabs()[alvo].id);
    this.botoes()[alvo]?.nativeElement.focus();
  }
}
