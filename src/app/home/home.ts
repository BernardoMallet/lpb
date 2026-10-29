import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Seo } from '../core/seo';
import { SITE } from '../core/site.config';
import { Benefits } from './benefits';
import { FinalCta } from './final-cta';
import { Hero } from './hero';
import { Highlights } from './highlights';
import { HospiciosSection } from './hospicios-section';
import { Sede } from './sede';
import { Shop } from './shop';

@Component({
  selector: 'app-home',
  imports: [Hero, Highlights, HospiciosSection, Benefits, Shop, Sede, FinalCta],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero />
    <app-highlights />
    <app-hospicios-section />
    <app-benefits />
    <app-shop />
    <app-sede />
    <app-final-cta />
  `,
})
export class Home {
  constructor() {
    const seo = inject(Seo);
    seo.atualizar({
      titulo: `${SITE.nome} | Seja Sócio`,
      descricao: SITE.descricao,
      caminho: '/',
      jsonLd: seo.organizacao(),
    });
  }
}
