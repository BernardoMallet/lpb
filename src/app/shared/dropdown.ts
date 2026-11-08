import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';
import { Icon } from './icon';

let proximo = 0;

const ITENS = '[role="menuitem"]';

/** Item de menu. Navegação por setas feita pelo Dropdown; só o item focado entra na ordem de Tab. */
@Component({
  selector: 'a[app-menu-item], button[app-menu-item]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'menuitem', tabindex: '-1' },
  template: `<ng-content />`,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      min-height: 44px;
      padding: 0 16px;
      background: none;
      border: 0;
      color: var(--c-black);
      font: 600 0.9375rem/1.2 var(--font-body);
      text-align: left;
      text-decoration: none;
      cursor: pointer;
    }
    :host(:hover),
    :host(:focus-visible) {
      background: var(--c-paper);
    }
  `,
})
export class MenuItem {}

/**
 * Único dropdown do projeto. O botão-gatilho é do componente.
 * Slots: [trigger] = conteúdo do botão; [header] = bloco informativo no topo do painel;
 * conteúdo padrão = itens (a/button com app-menu-item).
 */
@Component({
  selector: 'app-dropdown',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'aoClicarDocumento($event)',
    '(keydown.escape)': 'fechar(true)',
    '(focusout)': 'aoPerderFoco($event)',
  },
  template: `
    <button
      #gatilho
      type="button"
      class="gatilho"
      aria-haspopup="menu"
      [attr.aria-expanded]="aberto()"
      [attr.aria-controls]="aberto() ? painelId : null"
      [attr.aria-label]="label()"
      (click)="alternar()"
      (keydown.arrowdown)="abrir($event)"
    >
      <ng-content select="[trigger]" />
      <app-icon class="seta" name="chevron" />
    </button>
    @if (aberto()) {
      <div class="painel" [id]="painelId">
        <div class="topo"><ng-content select="[header]" /></div>
        <div role="menu" [attr.aria-label]="label()" (keydown)="aoTeclar($event)" (click)="fechar(false)">
          <ng-content />
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-block;
    }
    .gatilho {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 44px;
      min-height: 44px;
      padding: 0;
      background: none;
      border: 0;
      border-radius: 999px;
      color: inherit;
      cursor: pointer;
    }
    .seta {
      width: 1em;
      height: 1em;
    }
    .painel {
      --focus: var(--c-black);
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      z-index: 60;
      width: 290px;
      max-width: calc(100vw - 32px);
      background: var(--c-white);
      color: var(--c-black);
      border: 2px solid var(--c-black);
      border-radius: var(--r-md);
      box-shadow: var(--shadow-hard);
      overflow: hidden;
    }
    .topo:not(:empty) {
      padding: 14px 16px;
      border-bottom: 2px solid var(--c-paper);
    }
    [role='menu'] {
      padding: 6px 0;
    }
  `,
})
export class Dropdown {
  /** Nome acessível do botão e do menu (o conteúdo do gatilho é visual). */
  readonly label = input.required<string>();

  protected readonly aberto = signal(false);
  protected readonly painelId = `app-dropdown-${++proximo}`;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected alternar(): void {
    if (this.aberto()) this.fechar(false);
    else this.abrir();
  }

  protected abrir(evento?: Event): void {
    evento?.preventDefault();
    if (this.aberto()) return;
    this.aberto.set(true);
    afterNextRender(() => this.itens()[0]?.focus(), { injector: this.injector });
  }

  protected fechar(devolverFoco: boolean): void {
    if (!this.aberto()) return;
    this.aberto.set(false);
    if (devolverFoco) this.host.nativeElement.querySelector<HTMLElement>('.gatilho')?.focus();
  }

  protected aoClicarDocumento(evento: Event): void {
    if (!this.host.nativeElement.contains(evento.target as Node)) this.fechar(false);
  }

  protected aoPerderFoco(evento: FocusEvent): void {
    const destino = evento.relatedTarget as Node | null;
    if (destino && !this.host.nativeElement.contains(destino)) this.fechar(false);
  }

  protected aoTeclar(evento: KeyboardEvent): void {
    const itens = this.itens();
    if (!itens.length) return;
    const i = itens.indexOf(document.activeElement as HTMLElement);
    const alvo: Record<string, number> = {
      ArrowDown: (i + 1) % itens.length,
      ArrowUp: (i - 1 + itens.length) % itens.length,
      Home: 0,
      End: itens.length - 1,
    };
    if (evento.key in alvo) {
      evento.preventDefault();
      itens[alvo[evento.key]].focus();
    }
  }

  private itens(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(ITENS));
  }
}
