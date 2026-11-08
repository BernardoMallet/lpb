import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';
import { Icon } from './icon';

export interface ToastItem {
  id: number;
  tipo: 'ok' | 'erro';
  texto: string;
}

const MAX_VISIVEIS = 3;
const SUCESSO_MS = 8000;

/** Avisos de resultado de ações. Sucesso some sozinho; erro fica até o usuário fechar. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly itens = signal<readonly ToastItem[]>([]);
  private proximoId = 1;

  success(texto: string): void {
    const id = this.adicionar('ok', texto);
    if (id !== null) setTimeout(() => this.fechar(id), SUCESSO_MS);
  }

  error(texto: string): void {
    this.adicionar('erro', texto);
  }

  fechar(id: number): void {
    this.itens.update((lista) => lista.filter((t) => t.id !== id));
  }

  private adicionar(tipo: ToastItem['tipo'], texto: string): number | null {
    if (this.itens().some((t) => t.tipo === tipo && t.texto === texto)) return null;
    const id = this.proximoId++;
    this.itens.update((lista) => [...lista, { id, tipo, texto }].slice(-MAX_VISIVEIS));
    return id;
  }
}

/** Pilha única de avisos, montada uma vez no App. Vazia, não ocupa nem anuncia nada. */
@Component({
  selector: 'app-toast',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts">
      @for (t of toast.itens(); track t.id) {
        <div class="toast" [class.erro]="t.tipo === 'erro'" [attr.role]="t.tipo === 'erro' ? 'alert' : 'status'">
          <app-icon class="ico" [name]="t.tipo === 'erro' ? 'alert' : 'check'" />
          <p>{{ t.texto }}</p>
          <button type="button" class="fechar" aria-label="Fechar aviso" (click)="toast.fechar(t.id)">
            <app-icon name="close" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 16px;
      bottom: 16px;
      left: 16px;
      z-index: 200;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      width: min(100%, 420px);
      padding: 12px 6px 12px 14px;
      background: var(--c-white);
      color: var(--c-black);
      border: 2px solid var(--c-black);
      border-left: 8px solid var(--c-success);
      border-radius: var(--r-sm);
      box-shadow: var(--shadow-hard);
      pointer-events: auto;
    }
    .toast.erro {
      border-left-color: var(--c-danger);
    }
    .ico {
      flex: none;
      width: 22px;
      height: 22px;
      margin-top: 1px;
      color: var(--c-success);
    }
    .erro .ico {
      color: var(--c-danger);
    }
    p {
      flex: 1;
      margin: 0;
      padding-top: 1px;
      font-size: 0.9375rem;
      line-height: 1.4;
    }
    .fechar {
      flex: none;
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      margin: -9px 0;
      padding: 0;
      background: none;
      border: 0;
      border-radius: var(--r-sm);
      color: inherit;
      cursor: pointer;
    }
    .fechar app-icon {
      width: 20px;
      height: 20px;
    }
  `,
})
export class Toast {
  protected readonly toast = inject(ToastService);
}
