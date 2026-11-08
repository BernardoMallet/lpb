import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Card } from '../shared/card';
import { EmptyState } from '../shared/empty-state';

/** Tela provisória das áreas privadas que ainda não existem. O título vem de data da rota. */
@Component({
  selector: 'app-em-breve',
  imports: [Card, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container">
        <p class="eyebrow">Área do sócio</p>
        <h1>{{ titulo() }}</h1>
        <app-card class="cartao">
          <app-empty-state icon="info" title="Em breve">
            Esta área ainda está em construção.
          </app-empty-state>
        </app-card>
      </div>
    </section>
  `,
  styles: `
    .cartao {
      max-width: 560px;
      margin-top: 28px;
    }
  `,
})
export class EmBreve {
  readonly titulo = input.required<string>();
}
