import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Único placeholder de carregamento. Decorativo: quem o usa marca a região com aria-busy. */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
  },
  template: '',
  styles: `
    :host {
      display: block;
      max-width: 100%;
      background: linear-gradient(90deg, #e6e6e3 25%, #f1f1ef 50%, #e6e6e3 75%) 0 0 / 200% 100%;
      border-radius: var(--r-sm);
      animation: brilho 1.4s linear infinite;
    }
    @keyframes brilho {
      to {
        background-position: -200% 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host {
        animation: none;
      }
    }
  `,
})
export class Skeleton {
  readonly width = input('100%');
  readonly height = input('1rem');
}
