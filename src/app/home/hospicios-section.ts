import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Track } from '../core/track';
import { Button } from '../shared/button';
import { Card } from '../shared/card';
import { Carousel } from '../shared/carousel/carousel';
import { Icon } from '../shared/icon';
import { HOSPICIOS, Hospicio } from './hospicios.data';

@Component({
  selector: 'app-hospicios-section',
  imports: [NgOptimizedImage, Button, Card, Carousel, Icon, Track],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hospicios-section.html',
  styleUrl: './hospicios-section.scss',
})
export class HospiciosSection {
  protected readonly hospicios = HOSPICIOS;
  protected readonly nomeDe = (h: Hospicio): string => h.nome;

  protected miniatura(h: Hospicio): string {
    return h.imagem.replace('hospicios/', 'hospicios/thumbs/');
  }

  protected rotuloRede(h: Hospicio): string {
    return h.redeSocial.tipo === 'facebook' ? 'Facebook' : 'Instagram';
  }
}
