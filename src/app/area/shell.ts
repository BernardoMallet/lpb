import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../core/auth/auth';
import { ROTULO_PAPEL } from '../core/auth/auth.models';
import { MENU } from '../core/menu';
import { Seo } from '../core/seo';
import { ROTAS, SITE } from '../core/site.config';
import { Avatar } from '../shared/avatar';
import { Button } from '../shared/button';
import { Dropdown, MenuItem } from '../shared/dropdown';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/modal';

/** Casca da área autenticada: menu por perfil, avatar com Minha conta e Sair, aviso de sessão expirada. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Avatar, Button, Dropdown, MenuItem, Icon, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit {
  protected readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly seo = inject(Seo);
  private readonly document = inject(DOCUMENT);

  protected readonly nome = SITE.nome;
  protected readonly rotas = ROTAS;
  protected readonly menuAberto = signal(false);

  protected readonly itens = computed(() =>
    MENU.filter((item) => !item.papeis || this.auth.temPapel(item.papeis)),
  );
  protected readonly papel = computed(() => {
    const u = this.auth.usuario();
    return u ? ROTULO_PAPEL[u.baseRole] : '';
  });

  ngOnInit(): void {
    this.seo.atualizar({
      titulo: SITE.nome,
      descricao: SITE.descricao,
      caminho: ROTAS.aposLogin,
      noindex: true,
    });
  }

  protected alternarMenu(): void {
    this.menuAberto.update((aberto) => !aberto);
  }

  protected fecharMenu(): void {
    this.menuAberto.set(false);
  }

  protected sair(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl(ROTAS.entrar),
    });
  }

  protected entrarDeNovo(): void {
    const retorno = this.router.url;
    this.auth.reiniciar();
    void this.router.navigate([ROTAS.entrar], { queryParams: { expirou: 1, retorno } });
  }

  // Evita que o link de pular conteúdo dependa de fragmento na URL (base href="/")
  protected irParaConteudo(event: Event): void {
    event.preventDefault();
    this.document.getElementById('conteudo')?.focus();
  }
}
