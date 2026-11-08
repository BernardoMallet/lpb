import { DestroyRef, signal } from '@angular/core';
import { Subscription, interval } from 'rxjs';

export interface Contador {
  readonly restante: () => number;
  iniciar(segundos: number): void;
  parar(): void;
}

/** Contagem regressiva em segundos (reenvio de código, espera após 429). Para sozinha ao destruir o componente. */
export function criarContador(destroyRef: DestroyRef): Contador {
  const restante = signal(0);
  let sub: Subscription | null = null;

  const parar = () => {
    sub?.unsubscribe();
    sub = null;
    restante.set(0);
  };

  destroyRef.onDestroy(() => sub?.unsubscribe());

  return {
    restante: restante.asReadonly(),
    iniciar(segundos: number) {
      sub?.unsubscribe();
      restante.set(Math.max(0, Math.ceil(segundos)));
      if (restante() === 0) return;
      sub = interval(1000).subscribe(() => {
        restante.update((n) => n - 1);
        if (restante() <= 0) parar();
      });
    },
    parar,
  };
}

/** 125 -> "2:05" */
export function mmss(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
