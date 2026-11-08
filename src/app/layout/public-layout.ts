import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './footer';
import { Header } from './header';

/** Casca do site público (landing e páginas institucionais). */
@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, Header, Footer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block' },
  template: `
    <a class="skip-link" href="#conteudo" (click)="irParaConteudo($event)">Pular para o conteúdo</a>
    <app-header />
    <main id="conteudo" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
  `,
})
export class PublicLayout {
  private readonly document = inject(DOCUMENT);

  // Evita que o link de pular conteúdo dependa de fragmento na URL (base href="/")
  protected irParaConteudo(event: Event): void {
    event.preventDefault();
    this.document.getElementById('conteudo')?.focus();
  }
}
