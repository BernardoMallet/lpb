import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon, IconName } from './icon';

export type AlertKind = 'erro' | 'info' | 'ok';

const ICONE: Record<AlertKind, IconName> = { erro: 'alert', info: 'info', ok: 'check' };

/** Aviso fixo na página (erro de formulário, instrução). Para resultado de ação, use o Toast. */
@Component({
  selector: 'app-alert',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'kind()',
    '[attr.role]': "kind() === 'erro' ? 'alert' : 'status'",
  },
  template: `
    <app-icon [name]="icone()" />
    <div class="texto"><ng-content /></div>
  `,
  styles: `
    :host {
      --cor: var(--c-black);
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      background: var(--c-white);
      border: 2px solid var(--cor);
      border-left-width: 8px;
      border-radius: var(--r-sm);
      font-size: 0.9375rem;
      line-height: 1.45;
    }
    :host(.erro) {
      --cor: var(--c-danger);
    }
    :host(.ok) {
      --cor: var(--c-success);
    }
    app-icon {
      margin-top: 1px;
      color: var(--cor);
    }
    .texto {
      flex: 1;
      min-width: 0;
    }
  `,
})
export class Alert {
  readonly kind = input<AlertKind>('info');

  protected readonly icone = computed(() => ICONE[this.kind()]);
}
