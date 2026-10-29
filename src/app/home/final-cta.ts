import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROTAS } from '../core/site.config';
import { Track } from '../core/track';
import { Button } from '../shared/button';

@Component({
  selector: 'app-final-cta',
  imports: [RouterLink, Button, Track],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="socio" class="section--dark" aria-labelledby="socio-titulo">
      <div class="container conteudo">
        <h2 id="socio-titulo">VIVA ESSA LOUCURA</h2>
        <p class="lead">
          Vantagens na loja, eventos na sede e a carteirinha de sócio no celular. Faça parte do
          Loucos Pelo Botafogo.
        </p>
        <div class="ctas">
          <a
            app-button
            variant="primary"
            size="lg"
            [routerLink]="rotas.sejaSocio"
            [appTrack]="'cta_seja_socio'"
            appTrackLocal="cta-final"
          >
            Seja Sócio
          </a>
          <a
            app-button
            variant="outline-light"
            size="lg"
            [routerLink]="rotas.entrar"
            [appTrack]="'cta_entrar'"
            appTrackLocal="cta-final"
          >
            Já sou sócio: Entrar
          </a>
        </div>
      </div>
      <div class="stripes" aria-hidden="true"></div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .conteudo {
      padding-block: clamp(56px, 9vw, 104px);
      text-align: center;
    }
    .lead {
      margin: 18px auto 0;
    }
    .ctas {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-top: 32px;
    }
  `,
})
export class FinalCta {
  protected readonly rotas = ROTAS;
}
