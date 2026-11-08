import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

export type ButtonVariant = 'primary' | 'dark' | 'outline' | 'outline-light';
export type ButtonSize = 'md' | 'lg';

/** Único botão do projeto. Uso: <a app-button variant="primary"> ou <button app-button>. */
@Component({
  selector: 'a[app-button], button[app-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()', '[attr.aria-busy]': 'loading() || null' },
  template: `@if (loading()) {
      <span class="spin" aria-hidden="true"></span>
    }
    <ng-content />`,
  styleUrl: './button.scss',
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly block = input(false, { transform: booleanAttribute });
  /** Mostra o spinner e marca aria-busy. O botão segue focável; o formulário deve ignorar novos envios. */
  readonly loading = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(
    () =>
      `v-${this.variant()} s-${this.size()}${this.block() ? ' block' : ''}${this.loading() ? ' loading' : ''}`,
  );
}
