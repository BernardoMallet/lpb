import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { PublicLayout } from './layout/public-layout';

describe('PublicLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicLayout],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renderiza header, conteúdo principal e footer', async () => {
    const fixture = TestBed.createComponent(PublicLayout);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-header')).toBeTruthy();
    expect(el.querySelector('main#conteudo')).toBeTruthy();
    expect(el.querySelector('app-footer')).toBeTruthy();
  });
});
