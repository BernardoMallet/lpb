import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROTAS } from '../core/site.config';
import { Track } from '../core/track';
import { Button } from '../shared/button';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage, RouterLink, Button, Icon, Track],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'fechar(true)' },
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly rotas = ROTAS;
  protected readonly links = [
    { rotulo: 'Hospícios', fragmento: 'hospicios' },
    { rotulo: 'Loja', fragmento: 'loja' },
    { rotulo: 'Sede', fragmento: 'sede' },
  ] as const;

  protected readonly aberto = signal(false);
  private readonly botaoMenu = viewChild<ElementRef<HTMLButtonElement>>('botaoMenu');

  protected alternar(): void {
    this.aberto.update((v) => !v);
  }

  protected fechar(devolverFoco = false): void {
    if (!this.aberto()) return;
    this.aberto.set(false);
    if (devolverFoco) this.botaoMenu()?.nativeElement.focus();
  }
}
