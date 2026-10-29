import { Directive, inject, input } from '@angular/core';
import { Analytics, AnalyticsEvent } from './analytics';

/** Uso: <a [appTrack]="'cta_seja_socio'" appTrackLocal="header"> */
@Directive({
  selector: '[appTrack]',
  host: { '(click)': 'registrar()' },
})
export class Track {
  private readonly analytics = inject(Analytics);

  readonly evento = input.required<AnalyticsEvent>({ alias: 'appTrack' });
  readonly local = input('', { alias: 'appTrackLocal' });

  protected registrar(): void {
    const local = this.local();
    this.analytics.track(this.evento(), local ? { local } : {});
  }
}
