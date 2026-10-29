import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Seo } from '../core/seo';
import { SITE } from '../core/site.config';
import { Button } from '../shared/button';

/** Página provisória para /entrar e /seja-socio até o sistema de sócios existir. */
@Component({
  selector: 'app-placeholder',
  imports: [RouterLink, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section section--paper">
      <div class="container conteudo">
        <p class="eyebrow">Em breve</p>
        <h1>{{ titulo() }}</h1>
        <p class="lead">
          Esta área estará disponível em breve. Enquanto isso, volte para o início.
        </p>
        <a app-button variant="dark" size="lg" routerLink="/">Voltar ao início</a>
      </div>
    </section>
  `,
  styles: `
    .conteudo {
      display: grid;
      justify-items: start;
      gap: 20px;
      min-height: 50vh;
      align-content: center;
    }
  `,
})
export class Placeholder implements OnInit {
  readonly titulo = input.required<string>();
  private readonly seo = inject(Seo);

  ngOnInit(): void {
    this.seo.atualizar({
      titulo: `${this.titulo()} | ${SITE.nome}`,
      descricao: SITE.descricao,
      noindex: true,
    });
  }
}
