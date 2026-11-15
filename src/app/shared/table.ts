import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, booleanAttribute, input } from '@angular/core';

export interface Coluna<T> {
  chave: string;
  rotulo: string;
  /** Texto da célula quando não há template `cell`. */
  valor?: (linha: T) => string | number;
}

export interface ContextoCelula<T> {
  $implicit: T;
  coluna: Coluna<T>;
}

/**
 * Única tabela do projeto. Sem linhas, mostra o conteúdo projetado (use app-empty-state).
 * Células customizadas: <ng-template #cel let-linha let-coluna="coluna"> e [cell]="cel".
 */
@Component({
  selector: 'app-table',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (rows().length) {
      <div class="rolagem" [class.empilha]="stack()" role="region" tabindex="0" [attr.aria-label]="caption()">
        <table>
          <caption class="sr-only">
            {{ caption() }}
          </caption>
          <thead>
            <tr>
              @for (c of columns(); track c.chave) {
                <th scope="col">{{ c.rotulo }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (linha of rows(); track $index) {
              <tr>
                @for (c of columns(); track c.chave) {
                  <td [attr.data-rotulo]="c.rotulo">
                    @if (cell(); as modelo) {
                      <ng-container
                        [ngTemplateOutlet]="modelo"
                        [ngTemplateOutletContext]="{ $implicit: linha, coluna: c }"
                      />
                    } @else {
                      {{ c.valor ? c.valor(linha) : '' }}
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <ng-content />
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .rolagem {
      overflow-x: auto;
      background: var(--c-white);
      border: 2px solid var(--c-black);
      border-radius: var(--r-md);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9375rem;
    }
    th,
    td {
      padding: 12px 16px;
      text-align: left;
      vertical-align: middle;
      white-space: nowrap;
    }
    th {
      background: var(--c-black);
      color: var(--c-white);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    td {
      border-top: 1px solid var(--c-paper);
    }
    @media (max-width: 599px) {
      .empilha {
        overflow: visible;
        background: none;
        border: 0;
      }
      .empilha table,
      .empilha tbody,
      .empilha tr,
      .empilha td {
        display: block;
      }
      .empilha thead {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
      }
      .empilha tr {
        margin-bottom: 12px;
        background: var(--c-white);
        border: 2px solid var(--c-black);
        border-radius: var(--r-md);
      }
      .empilha td {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        white-space: normal;
        text-align: right;
      }
      .empilha td::before {
        content: attr(data-rotulo);
        flex: none;
        color: var(--c-mute);
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-align: left;
        text-transform: uppercase;
      }
      .empilha td:first-child {
        border-top: 0;
      }
    }
  `,
})
export class Table<T> {
  readonly columns = input.required<readonly Coluna<T>[]>();
  readonly rows = input.required<readonly T[]>();
  readonly caption = input.required<string>();
  /** Abaixo de 600px cada linha vira um cartão com rótulo e valor. */
  readonly stack = input(false, { transform: booleanAttribute });
  readonly cell = input<TemplateRef<ContextoCelula<T>> | null>(null);
}
