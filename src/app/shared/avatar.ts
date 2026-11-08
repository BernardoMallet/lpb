import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Único avatar: foto circular (src) ou iniciais do nome. Decorativo: o nome fica em quem o contém. */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'size() * 0.38',
  },
  template: `
    @if (src(); as foto) {
      <img [src]="foto" alt="" [attr.width]="size()" [attr.height]="size()" />
    } @else {
      <span>{{ iniciais() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-grid;
      flex: none;
      place-items: center;
      overflow: hidden;
      background: var(--c-star);
      border: 2px solid var(--c-white);
      border-radius: 50%;
      color: var(--c-black);
      font-family: var(--font-display);
      font-weight: 900;
      line-height: 1;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
})
export class Avatar {
  readonly name = input('');
  readonly src = input<string | null>(null);
  readonly size = input(40);

  protected readonly iniciais = computed(() => {
    const partes = this.name().trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '';
    const primeira = partes[0][0];
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (primeira + ultima).toUpperCase();
  });
}
