import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Icon } from './icon';

let proximo = 0;

/**
 * Único modal do projeto, sobre <dialog> nativo (foco preso, Esc e inert no resto da página).
 * Rodapé por projeção: <button footer ...>. Abaixo de 600px vira folha de baixo.
 * Não dismissible = não fecha por Esc, fundo nem botão; só pela ação do rodapé.
 */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dlg
      [attr.aria-labelledby]="tituloId"
      (cancel)="aoCancelar($event)"
      (click)="aoClicar($event)"
    >
      <div class="corpo">
        <header class="cab">
          <h2 [id]="tituloId">{{ heading() }}</h2>
          @if (dismissible()) {
            <button type="button" class="fechar" aria-label="Fechar" (click)="closed.emit()">
              <app-icon name="close" />
            </button>
          }
        </header>
        <div class="conteudo"><ng-content /></div>
        <footer class="rodape"><ng-content select="[footer]" /></footer>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(92vw, 480px);
      padding: 0;
      background: var(--c-white);
      color: var(--c-black);
      border: 2px solid var(--c-black);
      border-radius: var(--r-md);
      box-shadow: var(--shadow-hard);
    }
    dialog::backdrop {
      background: rgb(10 10 10 / 0.65);
    }
    .corpo {
      padding: 20px;
    }
    .cab {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }
    h2 {
      font-size: 1.375rem;
    }
    .fechar {
      flex: none;
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      margin: -8px -8px 0 0;
      padding: 0;
      background: none;
      border: 0;
      border-radius: var(--r-sm);
      color: inherit;
      cursor: pointer;
    }
    .conteudo {
      line-height: 1.55;
    }
    .rodape {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    @media (max-width: 599px) {
      dialog {
        width: 100%;
        max-width: 100%;
        margin: auto 0 0;
        border-bottom: 0;
        border-radius: var(--r-md) var(--r-md) 0 0;
      }
      .rodape > * {
        flex: 1 1 100%;
      }
    }
  `,
})
export class Modal {
  readonly open = input(false, { transform: booleanAttribute });
  readonly heading = input.required<string>();
  readonly dismissible = input(true, { transform: booleanAttribute });
  readonly closed = output<void>();

  protected readonly tituloId = `app-modal-${++proximo}`;
  private readonly dlg = viewChild<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    // Só no navegador: o DOM do servidor não tem showModal
    afterRenderEffect(() => {
      const dialogo = this.dlg()?.nativeElement;
      if (!dialogo) return;
      const aberto = this.open();
      if (aberto && !dialogo.open) dialogo.showModal();
      else if (!aberto && dialogo.open) dialogo.close();
    });
  }

  protected aoCancelar(evento: Event): void {
    // O estado `open` é do pai: o <dialog> nunca fecha sozinho
    evento.preventDefault();
    if (this.dismissible()) this.closed.emit();
  }

  protected aoClicar(evento: MouseEvent): void {
    if (this.dismissible() && evento.target === this.dlg()?.nativeElement) this.closed.emit();
  }
}
