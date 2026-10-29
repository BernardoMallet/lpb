import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CardVariant = 'outline' | 'surface' | 'poster';

/** Único card do projeto. O conteúdo é projetado; a variante define o visual. */
@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `<ng-content />`,
  styles: `
    :host {
      display: block;
      position: relative;
      border-radius: var(--r-md);
      overflow: hidden;
      background: var(--c-white);
      color: var(--c-black);
    }
    :host(.p-md) {
      padding: clamp(20px, 4vw, 28px);
    }
    :host(.v-outline) {
      border: 2px solid var(--c-black);
    }
    :host(.v-surface) {
      border-radius: var(--r-lg);
    }
    :host(.v-poster) {
      border: 4px solid var(--c-black);
      box-shadow: var(--shadow-hard);
    }
  `,
})
export class Card {
  readonly variant = input<CardVariant>('outline');
  readonly padding = input<'md' | 'none'>('md');

  protected readonly classes = computed(() => `v-${this.variant()} p-${this.padding()}`);
}
