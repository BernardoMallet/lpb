import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EMPTY, Subscription, catchError, debounceTime, distinctUntilChanged, exhaustMap, finalize, map, of, switchMap, timer } from 'rxjs';
import { ApiError } from '../core/api/api-error';
import { Seo } from '../core/seo';
import { API, ROTAS, SITE } from '../core/site.config';
import { Alert } from '../shared/alert';
import { Avatar } from '../shared/avatar';
import { Button } from '../shared/button';
import { Card } from '../shared/card';
import { Input } from '../shared/input';
import { OpcaoSelect, Select } from '../shared/select';

type MeioPagamento = 'PIX' | 'CARD';
interface Pagamento {
  id: string;
  amount: number;
  method: MeioPagamento;
  pixCopyPaste: string | null;
  pixQrCodeUrl: string | null;
  checkoutUrl: string | null;
}
interface Pedido {
  orderId: string;
  orderStatus: string;
  payment: Pagamento | null;
  resumed: boolean;
}
interface Hospicio {
  id: number;
  name: string;
}

const SIMULADO = 'dev://pagamento-simulado';
type Campo = 'name' | 'cpf' | 'email' | 'password' | 'cep' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'hospicioId' | 'lgpdAccepted';
interface ConsultaCep {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}
interface StatusPedido {
  status: string;
  paymentStatus: string | null;
}

function cpfValido(valor: string): boolean {
  const cpf = valor.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(cpf[i]) * (n + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink, Alert, Avatar, Button, Card, Input, Select],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss',
})
export class Cadastro implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly seo = inject(Seo);
  private readonly destroyRef = inject(DestroyRef);
  private acompanhamento?: Subscription;

  protected readonly nome = SITE.nome;
  protected readonly moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  protected readonly entrar = ROTAS.entrar;
  protected readonly etapa = signal<'dados' | 'pagamento' | 'concluido' | 'expirado' | 'recusado'>('dados');
  protected readonly pedido = signal<Pedido | null>(null);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly errosCampos = signal<Partial<Record<Campo, string>>>({});
  protected readonly aviso = signal<string | null>(null);
  protected readonly avisoCep = signal<string | null>(null);
  protected readonly buscandoCep = signal(false);
  protected readonly hospicios = signal<OpcaoSelect[]>([]);
  protected readonly mensalidade = signal<number | null>(null);
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    cpf: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    cep: new FormControl('', { nonNullable: true }),
    street: new FormControl('', { nonNullable: true }),
    number: new FormControl('', { nonNullable: true }),
    complement: new FormControl('', { nonNullable: true }),
    neighborhood: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    state: new FormControl('', { nonNullable: true }),
    hospicioId: new FormControl('', { nonNullable: true }),
    lgpdAccepted: new FormControl(false, { nonNullable: true }),
    method: new FormControl<MeioPagamento>('PIX', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.seo.atualizar({ titulo: `Seja sócio | ${SITE.nome}`, descricao: SITE.descricao,
      caminho: ROTAS.sejaSocio, noindex: true });
    const pedidoPendente = sessionStorage.getItem('lpb-cadastro-pedido');
    if (pedidoPendente) {
      this.pedido.set({ orderId: pedidoPendente, orderStatus: 'PENDING_PAYMENT', payment: null, resumed: true });
      this.etapa.set('pagamento');
      this.verificar();
      this.acompanhar(pedidoPendente);
    }
    this.http.get<Hospicio[]>(`${API.url}/hospicios`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (itens) => this.hospicios.set(itens.map((h) => ({ valor: String(h.id), rotulo: h.name }))),
      error: () => this.erro.set('Não foi possível carregar os hospícios. Recarregue a página.'),
    });
    this.http.get<{ monthlyFee: number }>(`${API.url}/membership/signup/terms`)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: ({ monthlyFee }) => this.mensalidade.set(monthlyFee),
        error: () => this.erro.set('Não foi possível carregar o valor da mensalidade. Recarregue a página.'),
      });
    this.form.controls.cep.valueChanges.pipe(
      map((valor) => valor.replace(/\D/g, '')),
      distinctUntilChanged(),
      debounceTime(400),
      switchMap((cep) => {
        this.avisoCep.set(null);
        this.buscandoCep.set(cep.length === 8);
        if (cep.length !== 8) return of(null);
        return this.http.get<ConsultaCep>(`https://viacep.com.br/ws/${cep}/json/`).pipe(
          catchError(() => {
            this.avisoCep.set('Não foi possível consultar o CEP. Preencha o endereço manualmente.');
            return of(null);
          }),
          finalize(() => this.buscandoCep.set(false)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((endereco) => {
      if (!endereco) return;
      if (endereco.erro) {
        this.avisoCep.set('CEP não encontrado. Confira-o ou preencha o endereço manualmente.');
        return;
      }
      this.form.patchValue({
        street: endereco.logradouro ?? '',
        neighborhood: endereco.bairro ?? '',
        city: endereco.localidade ?? '',
        state: endereco.uf ?? '',
      });
      this.avisoCep.set('Endereço preenchido. Confira os dados e informe o número.');
    });
  }

  protected enviar(): void {
    if (this.carregando() || this.mensalidade() === null) return;
    const v = this.form.getRawValue();
    this.errosCampos.set({});
    if (!v.name.trim() || !v.cpf.trim() || !v.email.trim() || !v.password ||
        !v.cep.trim() || !v.street.trim() || !v.number.trim() || !v.neighborhood.trim() ||
        !v.city.trim() || !v.state.trim() || !v.hospicioId || !v.lgpdAccepted) {
      const campos: Partial<Record<Campo, string>> = {};
      if (!v.name.trim()) campos.name = 'Informe seu nome completo.';
      if (!v.cpf.trim()) campos.cpf = 'Informe seu CPF.';
      if (!v.email.trim()) campos.email = 'Informe seu e-mail.';
      if (!v.password) campos.password = 'Informe sua senha.';
      if (!v.cep.trim()) campos.cep = 'Informe seu CEP.';
      if (!v.street.trim()) campos.street = 'Informe a rua.';
      if (!v.number.trim()) campos.number = 'Informe o número.';
      if (!v.neighborhood.trim()) campos.neighborhood = 'Informe o bairro.';
      if (!v.city.trim()) campos.city = 'Informe a cidade.';
      if (!v.state.trim()) campos.state = 'Informe a UF.';
      if (!v.hospicioId) campos.hospicioId = 'Escolha o hospício.';
      if (!v.lgpdAccepted) campos.lgpdAccepted = 'É necessário aceitar o tratamento dos dados.';
      this.errosCampos.set(campos);
      this.erro.set('Preencha os campos obrigatórios e aceite o tratamento dos dados.');
      return;
    }
    this.erro.set(null);
    if (!cpfValido(v.cpf)) {
      this.errosCampos.set({ cpf: 'Informe um CPF válido.' });
      this.erro.set('Confira os campos destacados.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) {
      this.errosCampos.set({ email: 'Informe um e-mail válido.' });
      this.erro.set('Confira os campos destacados.');
      return;
    }
    if (v.password.length < 10 || new TextEncoder().encode(v.password).length > 72) {
      this.errosCampos.set({ password: 'A senha deve ter pelo menos 10 caracteres e no máximo 72 bytes.' });
      this.erro.set('Confira os campos destacados.');
      return;
    }
    this.carregando.set(true);
    this.http.post<Pedido>(`${API.url}/membership/signup`, {
      ...v, hospicioId: Number(v.hospicioId), complement: v.complement.trim() || null, installments: 1,
    }).pipe(finalize(() => this.carregando.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (pedido) => {
        this.pedido.set(pedido);
        this.form.controls.password.reset();
        if (pedido.orderStatus === 'PAID') {
          this.etapa.set('concluido');
        } else if (pedido.payment) {
          sessionStorage.setItem('lpb-cadastro-pedido', pedido.orderId);
          this.etapa.set('pagamento');
          this.acompanhar(pedido.orderId);
        } else {
          this.erro.set('O pagamento não foi iniciado. Tente novamente.');
        }
      },
      error: (e: unknown) => {
        const apiError = ApiError.de(e);
        const campos = { ...apiError.campos };
        const campoPorCodigo: Record<string, Campo> = {
          INVALID_CPF: 'cpf', INVALID_CEP: 'cep', INVALID_STATE: 'state',
          INVALID_HOSPICIO: 'hospicioId', WEAK_PASSWORD: 'password',
        };
        const campo = apiError.code ? campoPorCodigo[apiError.code] : undefined;
        if (campo && apiError.detail) campos[campo] = apiError.detail;
        this.errosCampos.set(campos);
        this.erro.set(Object.keys(campos).length ? 'Confira os campos destacados.' : this.mensagem(e));
      },
    });
  }

  protected simulado(): boolean {
    const p = this.pedido()?.payment;
    return p?.checkoutUrl === SIMULADO || p?.pixQrCodeUrl === SIMULADO;
  }

  protected confirmarSimulacao(): void {
    const payment = this.pedido()?.payment;
    if (!payment || !this.simulado() || this.carregando()) return;
    this.erro.set(null);
    this.carregando.set(true);
    this.http.post<void>(`${API.url}/dev/payments/${payment.id}/confirm`, null)
      .pipe(finalize(() => this.carregando.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.verificar(),
        error: (e: unknown) => this.erro.set(this.mensagem(e)),
      });
  }

  protected verificar(): void {
    const id = this.pedido()?.orderId;
    if (!id) return;
    this.http.get<StatusPedido>(`${API.url}/membership/signup/orders/${id}/status`)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (status) => this.atualizarStatus(status),
        error: () => this.erro.set('Não foi possível consultar o pagamento. Tente novamente.'),
      });
  }

  private acompanhar(id: string): void {
    this.acompanhamento?.unsubscribe();
    this.acompanhamento = timer(5000, 5000).pipe(
      exhaustMap(() => this.http.get<StatusPedido>(`${API.url}/membership/signup/orders/${id}/status`).pipe(
        catchError(() => {
          this.erro.set('Não foi possível consultar o pagamento. Tentaremos novamente.');
          return EMPTY;
        }),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((status) => this.atualizarStatus(status));
  }

  private atualizarStatus({ status, paymentStatus }: StatusPedido): void {
    if (status === 'PAID') {
      sessionStorage.removeItem('lpb-cadastro-pedido');
      this.acompanhamento?.unsubscribe();
      this.erro.set(null);
      this.etapa.set('concluido');
    } else if (status === 'EXPIRED' || status === 'CANCELED' || paymentStatus === 'EXPIRED') {
      sessionStorage.removeItem('lpb-cadastro-pedido');
      this.acompanhamento?.unsubscribe();
      this.etapa.set('expirado');
    } else if (paymentStatus === 'DECLINED') {
      sessionStorage.removeItem('lpb-cadastro-pedido');
      this.acompanhamento?.unsubscribe();
      this.etapa.set('recusado');
    }
  }

  protected async copiar(codigo: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(codigo);
      this.aviso.set('Código copiado.');
    } catch {
      this.aviso.set('Não foi possível copiar. Selecione e copie o código abaixo.');
    }
  }

  protected voltar(): void {
    this.acompanhamento?.unsubscribe();
    sessionStorage.removeItem('lpb-cadastro-pedido');
    this.pedido.set(null);
    this.erro.set(null);
    this.etapa.set('dados');
  }

  private mensagem(erro: unknown): string {
    const e = ApiError.de(erro);
    if (e.code === 'SIGNUP_REFUSED') return 'Não foi possível concluir o cadastro. Confira os dados e a senha.';
    if (e.status === 429) return 'Muitas tentativas. Aguarde e tente novamente.';
    if (e.status === 503) return 'Pagamento indisponível. Tente novamente mais tarde.';
    const campos = Object.values(e.campos);
    if (campos.length) return campos.join(' ');
    if (e.detail && e.status >= 400 && e.status < 500) return e.detail;
    return 'Não foi possível continuar. Tente novamente.';
  }
}
