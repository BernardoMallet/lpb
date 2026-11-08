import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiError } from '../core/api/api-error';
import { Auth } from '../core/auth/auth';
import { criarContador, mmss } from '../core/contador';
import { Alert } from '../shared/alert';
import { Button } from '../shared/button';
import { Card } from '../shared/card';
import { Input } from '../shared/input';
import { ToastService } from '../shared/toast';

const MIN_CARACTERES = 10;
const MAX_BYTES = 72;
const ESPERA_PADRAO_S = 60;

const MSG = {
  informeAtual: 'Informe sua senha atual.',
  informeNova: 'Informe a nova senha.',
  curta: `A nova senha deve ter ao menos ${MIN_CARACTERES} caracteres.`,
  longa: `A nova senha é longa demais (máximo de ${MAX_BYTES} bytes). Use uma senha mais curta.`,
  igual: 'A nova senha deve ser diferente da atual.',
  naoCoincide: 'As senhas não coincidem.',
  atualErrada: 'Senha atual incorreta.',
  fraca: `A nova senha não atende aos requisitos: ao menos ${MIN_CARACTERES} caracteres e diferente da atual.`,
  limite: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  indisponivel: 'Não foi possível alterar a senha agora. Tente de novo em instantes.',
  sucesso: 'Senha alterada. Outros dispositivos foram desconectados.',
} as const;

type Campo = 'atual' | 'nova' | 'confirmar';
type Erros = Partial<Record<Campo, string>>;

/** /minha-conta: o usuário altera somente a senha. */
@Component({
  selector: 'app-minha-conta',
  imports: [ReactiveFormsModule, Alert, Button, Card, Input],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container">
        <p class="eyebrow">Minha conta</p>
        <h1>Alterar senha</h1>
        <p class="lead">
          Ao salvar, os outros dispositivos conectados são desconectados. Este continua ativo.
        </p>

        <app-card class="cartao">
          <form class="form" novalidate (ngSubmit)="salvar()">
            @if (alertaLimite(); as mensagem) {
              <app-alert kind="erro">{{ mensagem }}</app-alert>
            }

            <app-input
              #campoAtual
              label="Senha atual"
              type="password"
              autocomplete="current-password"
              [formControl]="atual"
              [error]="erros().atual ?? null"
            />
            <app-input
              #campoNova
              label="Nova senha"
              type="password"
              autocomplete="new-password"
              hint="Mínimo de 10 caracteres."
              [formControl]="nova"
              [error]="erros().nova ?? null"
            />
            <app-input
              #campoConfirmar
              label="Confirmar nova senha"
              type="password"
              autocomplete="new-password"
              [formControl]="confirmar"
              [error]="erros().confirmar ?? null"
            />

            <button
              app-button
              type="submit"
              variant="dark"
              size="lg"
              [loading]="salvando()"
              [disabled]="espera.restante() > 0"
            >
              @if (salvando()) {
                Salvando…
              } @else if (espera.restante() > 0) {
                Aguarde {{ mmss(espera.restante()) }}
              } @else {
                Salvar nova senha
              }
            </button>
          </form>
        </app-card>
      </div>
    </section>
  `,
  styles: `
    h1 {
      margin-bottom: 14px;
    }
    .cartao {
      max-width: 480px;
      margin-top: 28px;
    }
    .form {
      display: grid;
      gap: 18px;
    }
    .form [app-button] {
      justify-self: start;
    }
  `,
})
export class MinhaConta {
  private readonly auth = inject(Auth);
  private readonly toast = inject(ToastService);

  protected readonly atual = new FormControl('', { nonNullable: true });
  protected readonly nova = new FormControl('', { nonNullable: true });
  protected readonly confirmar = new FormControl('', { nonNullable: true });

  protected readonly erros = signal<Erros>({});
  protected readonly erroLimite = signal(false);
  protected readonly salvando = signal(false);
  protected readonly espera = criarContador(inject(DestroyRef));
  protected readonly mmss = mmss;

  protected readonly campoAtual = viewChild<Input>('campoAtual');
  protected readonly campoNova = viewChild<Input>('campoNova');
  protected readonly campoConfirmar = viewChild<Input>('campoConfirmar');

  // O aviso de limite some quando o contador do botão chega a zero
  protected readonly alertaLimite = computed(() =>
    this.erroLimite() && this.espera.restante() > 0 ? MSG.limite : null,
  );

  constructor() {
    const campos: [Campo, FormControl<string>][] = [
      ['atual', this.atual],
      ['nova', this.nova],
      ['confirmar', this.confirmar],
    ];
    for (const [campo, controle] of campos) {
      controle.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.limpar(campo));
    }
  }

  protected salvar(): void {
    if (this.salvando() || this.espera.restante() > 0) return;

    const erros = this.validar();
    this.erros.set(erros);
    const primeiro = erros.atual ? this.campoAtual() : erros.nova ? this.campoNova() : erros.confirmar ? this.campoConfirmar() : null;
    if (primeiro) {
      primeiro.focar();
      return;
    }

    this.erroLimite.set(false);
    this.salvando.set(true);
    this.auth
      .alterarSenha(this.atual.value, this.nova.value)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.atual.reset('');
          this.nova.reset('');
          this.confirmar.reset('');
          this.erros.set({});
          this.toast.success(MSG.sucesso);
        },
        error: (e) => this.falha(ApiError.de(e)),
      });
  }

  private validar(): Erros {
    const erros: Erros = {};
    const nova = this.nova.value;
    if (!this.atual.value) erros.atual = MSG.informeAtual;

    if (!nova) erros.nova = MSG.informeNova;
    else if ([...nova].length < MIN_CARACTERES) erros.nova = MSG.curta;
    else if (new TextEncoder().encode(nova).length > MAX_BYTES) erros.nova = MSG.longa;
    else if (nova === this.atual.value) erros.nova = MSG.igual;

    if (!erros.nova && this.confirmar.value !== nova) erros.confirmar = MSG.naoCoincide;
    return erros;
  }

  private falha(e: ApiError): void {
    if (e.status === 429) {
      this.erroLimite.set(true);
      this.espera.iniciar(e.retryAfter ?? ESPERA_PADRAO_S);
    } else if (e.code === 'INVALID_CURRENT_PASSWORD') {
      this.erros.set({ atual: MSG.atualErrada });
      this.campoAtual()?.focar();
    } else if (e.code === 'WEAK_PASSWORD') {
      this.erros.set({ nova: MSG.fraca });
      this.campoNova()?.focar();
    } else if (e.status === 400 && (e.campos['currentPassword'] || e.campos['newPassword'])) {
      this.erros.set({ atual: e.campos['currentPassword'], nova: e.campos['newPassword'] });
    } else if (!e.servidor && !e.semConexao && e.status !== 401 && e.status !== 403) {
      // 401, 403, 5xx e falta de conexão já foram tratados pelo interceptor
      this.toast.error(MSG.indisponivel);
    }
  }

  private limpar(campo: Campo): void {
    if (this.erros()[campo]) this.erros.update((e) => ({ ...e, [campo]: undefined }));
  }
}
