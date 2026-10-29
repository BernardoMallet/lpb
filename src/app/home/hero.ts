import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROTAS } from '../core/site.config';
import { Track } from '../core/track';
import { Button } from '../shared/button';
import { HOSPICIOS } from './hospicios.data';

@Component({
  selector: 'app-hero',
  imports: [NgOptimizedImage, RouterLink, Button, Track],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero" aria-labelledby="hero-titulo">
      <div class="container grade">
        <div class="texto">
          <p class="eyebrow">Loucos Pelo Botafogo</p>
          <h1 id="hero-titulo">
            Desde <span class="marca">2006</span> a primeira barra do sudeste
          </h1>
          <p class="lead">
            Seja Bem-vindo ao Hospício!
          </p>
          <div class="ctas">
            <a
              app-button
              variant="dark"
              size="lg"
              [routerLink]="rotas.sejaSocio"
              [appTrack]="'cta_seja_socio'"
              appTrackLocal="hero"
            >
              Seja Sócio
            </a>
            <a
              app-button
              variant="outline"
              size="lg"
              routerLink="/"
              fragment="hospicios"
              [appTrack]="'cta_hospicios'"
              appTrackLocal="hero"
            >
              Encontre seu hospício
            </a>
          </div>
        </div>

        <div class="midia">
          <img
            class="foto"
            ngSrc="images/foto2.webp"
            width="800"
            height="533"
            priority
            sizes="(min-width: 900px) 45vw, 92vw"
            alt="Integrantes do Loucos Pelo Botafogo na arquibancada com uma grande bandeira"
          />
          <img class="selo" ngSrc="images/logo.webp" width="112" height="112" alt="" />
        </div>
      </div>
      <div class="stripes" aria-hidden="true"></div>
    </section>
  `,
  styles: `
    .hero {
      padding-top: clamp(32px, 6vw, 72px);
      background: var(--c-paper);
    }
    .grade {
      display: grid;
      gap: 40px;
      padding-bottom: clamp(40px, 7vw, 80px);
    }
    .marca {
      display: inline-block;
      padding: 0 0.15em;
      background: var(--c-black);
      color: var(--c-white);
      transform: rotate(-2deg);
    }
    .hero .lead {
      margin-top: 20px;
    }
    .ctas {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 28px;
    }
    .midia {
      position: relative;
      margin: 0 12px 28px 0;
    }
    .foto {
      width: 100%;
      border: 4px solid var(--c-black);
      border-radius: var(--r-md);
      box-shadow: var(--shadow-hard);
    }
    .selo {
      position: absolute;
      left: -8px;
      bottom: -28px;
      width: 96px;
      height: 96px;
      border: 4px solid var(--c-white);
      border-radius: 50%;
      box-shadow: 0 0 0 3px var(--c-black);
    }
    @media (min-width: 900px) {
      .grade {
        grid-template-columns: 1.05fr 1fr;
        align-items: center;
        gap: 56px;
      }
      .selo {
        width: 112px;
        height: 112px;
      }
    }
  `,
})
export class Hero {
  protected readonly rotas = ROTAS;
  protected readonly total = HOSPICIOS.length;
}
