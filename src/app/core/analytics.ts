import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

export type AnalyticsEvent =
  | 'cta_seja_socio'
  | 'cta_entrar'
  | 'cta_loja'
  | 'cta_como_chegar'
  | 'cta_hospicios'
  | 'social_click';

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

/**
 * Publica eventos no dataLayer (compatível com Google Tag Manager / GA4).
 * Nenhum script de terceiros é carregado aqui; basta incluir o GTM depois.
 */
@Injectable({ providedIn: 'root' })
export class Analytics {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  track(event: AnalyticsEvent, params: Record<string, string> = {}): void {
    if (!this.isBrowser) return;
    const w = window as DataLayerWindow;
    (w.dataLayer ??= []).push({ event, ...params });
  }
}
