import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  PLATFORM_ID,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Icon } from '../icon';

export interface SlideContext<T> {
  $implicit: T;
  index: number;
  active: boolean;
}

let proximoId = 0;

/**
 * Carousel genérico. O conteúdo vem de templates projetados:
 *  <ng-template #slide let-item let-active="active">…</ng-template>
 *  <ng-template #thumb let-item let-active="active">…</ng-template> (opcional)
 */
@Component({
  selector: 'app-carousel',
  imports: [NgTemplateOutlet, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
})
export class Carousel<T> {
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly items = input.required<readonly T[]>();
  readonly label = input.required<string>();
  readonly itemLabel = input<(item: T) => string>(() => '');
  readonly autoplay = input(false, { transform: booleanAttribute });
  readonly interval = input(7000);

  protected readonly slideTpl = contentChild.required('slide', { read: TemplateRef });
  protected readonly thumbTpl = contentChild('thumb', { read: TemplateRef });
  private readonly indicators = viewChildren<ElementRef<HTMLElement>>('indicator');
  private readonly strip = viewChild<ElementRef<HTMLElement>>('strip');

  protected readonly uid = `carousel-${proximoId++}`;
  protected readonly index = signal(0);
  protected readonly count = computed(() => this.items().length);
  protected readonly translate = computed(() => `translate3d(${-100 * this.index()}%, 0, 0)`);

  protected readonly reducedMotion =
    this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  protected readonly playing = linkedSignal(() => this.autoplay() && !this.reducedMotion);
  protected readonly hovering = signal(false);
  protected readonly focused = signal(false);
  protected readonly running = computed(
    () => this.isBrowser && this.playing() && !this.hovering() && !this.focused(),
  );

  private inicioX: number | null = null;
  private inicioY = 0;

  constructor() {
    effect((onCleanup) => {
      if (!this.running()) return;
      const id = setInterval(() => this.next(), this.interval());
      onCleanup(() => clearInterval(id));
    });
  }

  protected next(): void {
    this.goTo(this.index() + 1);
  }

  protected prev(): void {
    this.goTo(this.index() - 1);
  }

  protected goTo(i: number, focarIndicador = false): void {
    const total = this.count();
    if (!total) return;
    this.index.set(((i % total) + total) % total);
    afterNextRender(
      () => {
        this.centralizarIndicador();
        if (focarIndicador) this.indicators()[this.index()]?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  protected onKeydown(event: KeyboardEvent): void {
    const noIndicador = !!this.strip()?.nativeElement.contains(event.target as Node);
    switch (event.key) {
      case 'ArrowRight':
        this.goTo(this.index() + 1, noIndicador);
        break;
      case 'ArrowLeft':
        this.goTo(this.index() - 1, noIndicador);
        break;
      case 'Home':
        this.goTo(0, noIndicador);
        break;
      case 'End':
        this.goTo(this.count() - 1, noIndicador);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.inicioX = event.clientX;
    this.inicioY = event.clientY;
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.inicioX === null) return;
    const dx = event.clientX - this.inicioX;
    const dy = event.clientY - this.inicioY;
    this.inicioX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) this.next();
      else this.prev();
    }
  }

  protected onPointerCancel(): void {
    this.inicioX = null;
  }

  protected onFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;
    if (!host.contains(event.relatedTarget as Node | null)) this.focused.set(false);
  }

  private centralizarIndicador(): void {
    const faixa = this.strip()?.nativeElement;
    const alvo = this.indicators()[this.index()]?.nativeElement;
    if (!faixa || !alvo) return;
    faixa.scrollTo({
      left: alvo.offsetLeft - (faixa.clientWidth - alvo.clientWidth) / 2,
      behavior: this.reducedMotion ? 'auto' : 'smooth',
    });
  }
}
