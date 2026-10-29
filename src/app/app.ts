import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './layout/footer';
import { Header } from './layout/header';

@Component({
  imports: [RouterOutlet, Header, Footer],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  private readonly document = inject(DOCUMENT);

  // Evita que o link de pular conteúdo dependa de fragmento na URL (base href="/")
  protected irParaConteudo(event: Event): void {
    event.preventDefault();
    this.document.getElementById('conteudo')?.focus();
  }
}
