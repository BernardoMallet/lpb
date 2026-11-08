import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../core/api/api-error';
import { LoginResponse } from '../core/auth/auth.models';
import { Auth } from '../core/auth/auth';
import { criarContador, mmss } from '../core/contador';
import { Seo } from '../core/seo';
import { ROTAS, SITE } from '../core/site.config';
import { Alert } from '../shared/alert';
import { Avatar } from '../shared/avatar';
import { Button } from '../shared/button';
import { Card } from '../shared/card';
import { Input } from '../shared/input';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ESPERA_PADRAO_S = 60;

const MSG = {
  credenciais: 'E-mail ou senha inválidos. Confira os dados e tente de novo.',
  limite: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  indisponivel: 'Não foi possível continuar agora. Tente de novo em instantes.',
  otpInvalido: 'Código inválido. Confira o e-mail e tente de novo.',
  otpExpirado: 'O código expirou. Peça um novo para continuar.',
  otpLimite: 'Você atingiu o limite de tentativas. Peça um novo código.',
  otpIncompleto: 'Digite os 6 dígitos do código.',
  reenviado: 'Enviamos um novo código. O anterior deixou de valer.',
  reenvioNegado: 'Não foi possível reenviar o código. Volte e confira seus dados.',
  aguardeReenvio: 'Aguarde o contador antes de pedir outro código.',
} as const;

interface ErrosCredenciais {
  email?: string;
  senha?: string;
}

/** /entrar: e-mail e senha, depois código de 6 dígitos enviado por e-mail. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Alert, Avatar, Button, Card, Input],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  /** Query params (withComponentInputBinding). */
  readonly retorno = input<string | undefined>();
  readonly expirou = input<string | undefined>();

  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly seo = inject(Seo);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly nome = SITE.nome;
  protected readonly rotaSite = '/';

  protected readonly email = new FormControl('', { nonNullable: true });
  protected readonly senha = new FormControl('', { nonNullable: true });
  protected readonly codigo = new FormControl('', { nonNullable: true });

  protected readonly etapa = signal<'credenciais' | 'codigo'>('credenciais');
  protected readonly desafio = signal<LoginResponse | null>(null);
  protected readonly carregando = signal(false);
  protected readonly reenviando = signal(false);

  protected readonly errosCred = signal<ErrosCredenciais>({});
  protected readonly erroGeral = signal<string | null>(null);
  protected readonly erroCodigo = signal<string | null>(null);
  protected readonly avisoCodigo = signal<string | null>(null);
  protected readonly codigoEncerrado = signal(false);

  protected readonly espera = criarContador(this.destroyRef);
  protected readonly reenvio = criarContador(this.destroyRef);
  protected readonly mmss = mmss;

  protected readonly campoEmail = viewChild<Input>('campoEmail');
  protected readonly campoSenha = viewChild<Input>('campoSenha');
  protected readonly campoCodigo = viewChild<Input>('campoCodigo');

  protected readonly emailInformado = signal('');
  protected readonly emailMascarado = computed(() => {
    const [usuario, dominio] = this.emailInformado().split('@');
    if (!dominio) return this.emailInformado();
    return `${usuario[0] ?? ''}${'•'.repeat(Math.min(Math.max(usuario.length - 1, 1), 5))}@${dominio}`;
  });
  protected readonly minutos = computed(() => Math.max(1, Math.round((this.desafio()?.expiresInSeconds ?? 600) / 60)));

  protected readonly rotuloReenviar = computed(() => {
    const s = this.reenvio.restante();
    if (s > 0) return `Reenviar em ${mmss(s)}`;
    return this.codigoEncerrado() ? 'Enviar novo código' : 'Reenviar código';
  });

  // O aviso de limite some quando o contador do botão chega a zero
  protected readonly alertaGeral = computed(() => {
    const msg = this.erroGeral();
    return msg === MSG.limite && this.espera.restante() === 0 ? null : msg;
  });

  constructor() {
    this.email.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.limparErroCred('email'));
    this.senha.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.limparErroCred('senha'));
    this.codigo.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.erroCodigo.set(null));
  }

  ngOnInit(): void {
    this.seo.atualizar({
      titulo: `Entrar | ${SITE.nome}`,
      descricao: SITE.descricao,
      caminho: ROTAS.entrar,
      noindex: true,
    });
  }

  protected continuar(): void {
    if (this.carregando() || this.espera.restante() > 0) return;

    const email = this.email.value.trim();
    const erros: ErrosCredenciais = {};
    if (!email) erros.email = 'Informe seu e-mail.';
    else if (!EMAIL.test(email)) erros.email = 'Informe um e-mail válido.';
    if (!this.senha.value) erros.senha = 'Informe sua senha.';
    this.errosCred.set(erros);
    if (erros.email || erros.senha) {
      (erros.email ? this.campoEmail() : this.campoSenha())?.focar();
      return;
    }

    this.erroGeral.set(null);
    this.carregando.set(true);
    this.auth
      .login(email, this.senha.value)
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (r) => this.irParaCodigo(r),
        error: (e) => this.falhaCredenciais(ApiError.de(e)),
      });
  }

  protected reenviar(): void {
    if (this.reenviando() || this.carregando() || this.reenvio.restante() > 0) return;

    this.reenviando.set(true);
    this.avisoCodigo.set(null);
    this.erroCodigo.set(null);
    const anterior = this.desafio()?.challengeId;
    this.auth
      .login(this.email.value.trim(), this.senha.value)
      .pipe(finalize(() => this.reenviando.set(false)))
      .subscribe({
        next: (r) => {
          // Mesmo desafio = o back-end ainda estava no intervalo de reenvio e não mandou e-mail
          const repetido = r.challengeId === anterior;
          this.irParaCodigo(r, repetido ? MSG.aguardeReenvio : MSG.reenviado);
        },
        error: (e) => this.falhaReenvio(ApiError.de(e)),
      });
  }

  protected confirmar(): void {
    const desafio = this.desafio();
    if (!desafio || this.carregando() || this.codigoEncerrado()) return;

    const codigo = this.codigo.value;
    if (codigo.length !== 6) {
      this.erroCodigo.set(MSG.otpIncompleto);
      this.campoCodigo()?.focar();
      return;
    }

    this.erroCodigo.set(null);
    this.avisoCodigo.set(null);
    this.carregando.set(true);
    this.auth.verificarOtp(desafio.challengeId, codigo).subscribe({
      // No sucesso o botão segue ocupado até a navegação, evitando um segundo envio do mesmo código
      next: () => void this.router.navigateByUrl(this.destino()),
      error: (e) => {
        this.carregando.set(false);
        this.falhaCodigo(ApiError.de(e));
      },
    });
  }

  protected voltar(): void {
    this.reenvio.parar();
    this.desafio.set(null);
    this.senha.reset('');
    this.codigo.reset('');
    this.codigo.enable();
    this.codigoEncerrado.set(false);
    this.erroCodigo.set(null);
    this.avisoCodigo.set(null);
    this.erroGeral.set(null);
    this.etapa.set('credenciais');
    this.focarDepois(() => this.campoEmail());
  }

  private irParaCodigo(r: LoginResponse, aviso: string | null = null): void {
    this.desafio.set(r);
    this.emailInformado.set(this.email.value.trim());
    this.reenvio.iniciar(r.resendAvailableInSeconds);
    this.codigo.reset('');
    this.codigo.enable();
    this.codigoEncerrado.set(false);
    this.avisoCodigo.set(aviso);
    this.etapa.set('codigo');
    this.focarDepois(() => this.campoCodigo());
  }

  private falhaCredenciais(e: ApiError): void {
    if (e.status === 429) {
      this.espera.iniciar(e.retryAfter ?? ESPERA_PADRAO_S);
      this.erroGeral.set(MSG.limite);
    } else if (e.status === 401) {
      this.erroGeral.set(MSG.credenciais);
    } else if (e.status === 400 && (e.campos['email'] || e.campos['password'])) {
      this.errosCred.set({ email: e.campos['email'], senha: e.campos['password'] });
    } else if (!e.servidor && !e.semConexao) {
      // 5xx e falta de conexão já foram avisados pelo interceptor
      this.erroGeral.set(MSG.indisponivel);
    }
  }

  private falhaReenvio(e: ApiError): void {
    if (e.status === 429) this.reenvio.iniciar(e.retryAfter ?? ESPERA_PADRAO_S);
    else if (e.status === 401 || e.status === 400) this.erroCodigo.set(MSG.reenvioNegado);
    else if (!e.servidor && !e.semConexao) this.erroCodigo.set(MSG.indisponivel);
  }

  private falhaCodigo(e: ApiError): void {
    if (e.code === 'OTP_EXPIRED') return this.encerrarCodigo(MSG.otpExpirado);
    if (e.code === 'OTP_ATTEMPTS_EXCEEDED') return this.encerrarCodigo(MSG.otpLimite);

    if (e.status === 401 || e.status === 400) {
      this.codigo.reset('');
      this.erroCodigo.set(e.status === 400 ? MSG.otpIncompleto : MSG.otpInvalido);
      this.campoCodigo()?.focar();
    } else if (!e.servidor && !e.semConexao) {
      this.erroCodigo.set(MSG.indisponivel);
    }
  }

  private encerrarCodigo(mensagem: string): void {
    this.codigoEncerrado.set(true);
    this.codigo.disable();
    this.erroCodigo.set(mensagem);
  }

  /** Só aceita caminho interno, para o parâmetro não virar redirecionamento aberto. */
  private destino(): string {
    const r = this.retorno() ?? '';
    const interno = r.startsWith('/') && !r.startsWith('//') && !r.startsWith('/\\');
    return interno && !r.startsWith(ROTAS.entrar) ? r : ROTAS.aposLogin;
  }

  private limparErroCred(campo: keyof ErrosCredenciais): void {
    if (this.errosCred()[campo]) this.errosCred.update((e) => ({ ...e, [campo]: undefined }));
  }

  private focarDepois(campo: () => Input | undefined): void {
    afterNextRender(() => campo()?.focar(), { injector: this.injector });
  }
}
