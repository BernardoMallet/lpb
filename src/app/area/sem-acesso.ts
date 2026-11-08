import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROTAS } from '../core/site.config';
import { Button } from '../shared/button';
import { Card } from '../shared/card';
import { EmptyState } from '../shared/empty-state';

/** Destino dos guards quando o perfil não pode abrir a área. O back-end continua sendo quem decide. */
@Component({
  selector: 'app-sem-acesso',
  imports: [RouterLink, Button, Card, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container">
        <app-card class="cartao">
          <app-empty-state icon="lock" title="Sem acesso a esta área">
            <p>Seu perfil não tem permissão para abrir esta página.</p>
            <a app-button variant="dark" [routerLink]="inicio">Ir para Notícias</a>
          </app-empty-state>
        </app-card>
      </div>
    </section>
  `,
  styles: `
    .cartao {
      max-width: 560px;
      margin-inline: auto;
    }
    p {
      margin: 0 0 16px;
    }
  `,
})
export class SemAcesso {
  protected readonly inicio = ROTAS.aposLogin;
}
