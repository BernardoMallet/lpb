import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LINKS, SITE } from '../core/site.config';
import { Track } from '../core/track';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-footer',
  imports: [NgOptimizedImage, RouterLink, Icon, Track],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="site-footer">
      <div class="container topo">
        <div class="marca">
          <img ngSrc="images/logo.webp" width="56" height="56" alt="" />
          <div>
            <p class="nome">{{ site.nome }}</p>
            <p class="desc">Paixão & Loucura</p>
          </div>
        </div>

        <nav aria-label="Links rápidos">
          <ul>
            <li><a routerLink="/" fragment="hospicios">Hospícios</a></li>
            <li><a routerLink="/" fragment="loja">Loja</a></li>
            <li><a routerLink="/" fragment="sede">Sede</a></li>
          </ul>
        </nav>

        <div class="redes">
          <a
            [href]="links.instagram"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram do Loucos Pelo Botafogo (abre em nova aba)"
            [appTrack]="'social_click'"
            appTrackLocal="footer-instagram"
          >
            <app-icon name="instagram" />
          </a>
          <a
            [href]="links.spotify"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Spotify do Loucos Pelo Botafogo (abre em nova aba)"
            [appTrack]="'social_click'"
            appTrackLocal="footer-spotify"
          >
            <app-icon name="spotify" />
          </a>
        </div>
      </div>
      <div class="container base">
        <p>© {{ ano }} {{ site.nome }}. Todos os direitos reservados.</p>
      </div>
    </footer>
  `,
  styles: `
    .site-footer {
      padding-top: clamp(40px, 7vw, 64px);
      background: var(--c-ink);
    }
    .topo {
      display: grid;
      gap: 32px;
      padding-bottom: 32px;
    }
    .marca {
      display: flex;
      align-items: center;
      gap: 16px;

      img {
        border: 3px solid var(--c-white);
        border-radius: 50%;
      }
    }
    .nome {
      font-family: var(--font-display);
      text-transform: uppercase;
    }
    .desc {
      color: var(--c-mute-dark);
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 24px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    nav a {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      font-weight: 700;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.875rem;

      &:hover {
        color: var(--c-star);
      }
    }
    .redes {
      display: flex;
      gap: 12px;

      a {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        border: 2px solid var(--c-white);
        border-radius: 50%;
        font-size: 1.1rem;
        transition:
          background-color 0.15s,
          color 0.15s;

        &:hover {
          background: var(--c-star);
          border-color: var(--c-star);
          color: var(--c-black);
        }
      }
    }
    .base {
      padding-block: 20px;
      border-top: 1px solid var(--c-graphite);
      color: var(--c-mute-dark);
      font-size: 0.875rem;
    }
    @media (min-width: 800px) {
      .topo {
        grid-template-columns: 1fr auto auto;
        align-items: center;
        gap: 48px;
      }
    }
  `,
})
export class Footer {
  protected readonly site = SITE;
  protected readonly links = LINKS;
  protected readonly ano = new Date().getFullYear();
}
