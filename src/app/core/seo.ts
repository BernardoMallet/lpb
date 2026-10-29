import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { LINKS, SITE } from './site.config';

export interface SeoConfig {
  titulo: string;
  descricao: string;
  caminho?: string;
  noindex?: boolean;
  jsonLd?: object;
}

@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  atualizar({ titulo, descricao, caminho = '/', noindex = false, jsonLd }: SeoConfig): void {
    const url = new URL(caminho, `${SITE.url}/`).toString();
    const imagem = new URL(SITE.imagemCompartilhamento, `${SITE.url}/`).toString();

    this.title.setTitle(titulo);
    this.nome('description', descricao);
    this.nome('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    this.propriedade('og:type', 'website');
    this.propriedade('og:locale', 'pt_BR');
    this.propriedade('og:site_name', SITE.nome);
    this.propriedade('og:title', titulo);
    this.propriedade('og:description', descricao);
    this.propriedade('og:url', url);
    this.propriedade('og:image', imagem);
    this.propriedade('og:image:width', '1200');
    this.propriedade('og:image:height', '630');
    this.propriedade('og:image:alt', `${SITE.nome}: Botafogo, hospícios, Banda de General e sede`);

    this.nome('twitter:card', 'summary_large_image');
    this.nome('twitter:title', titulo);
    this.nome('twitter:description', descricao);
    this.nome('twitter:image', imagem);

    this.canonical(url);
    this.dadosEstruturados(jsonLd);
  }

  organizacao(): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.nome,
      url: `${SITE.url}/`,
      logo: new URL(SITE.logo, `${SITE.url}/`).toString(),
      description: SITE.descricao,
      sameAs: [LINKS.instagram, LINKS.spotify],
    };
  }

  private nome(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private propriedade(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }

  private canonical(href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private dadosEstruturados(dados?: object): void {
    const id = 'ld-json';
    const existente = this.document.getElementById(id);
    if (!dados) {
      existente?.remove();
      return;
    }
    const script = existente ?? this.document.createElement('script');
    script.id = id;
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(dados);
    if (!existente) this.document.head.appendChild(script);
  }
}
