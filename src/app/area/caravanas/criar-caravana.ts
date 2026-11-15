import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { distinctUntilChanged, finalize, map, startWith } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { CaravanasApi } from '../../core/caravanas/caravanas.api';
import { Caravana, CaravanaInput, Municipio } from '../../core/caravanas/caravanas.models';
import { localParaInstant } from '../../core/formatos';
import { Alert } from '../../shared/alert';
import { Button } from '../../shared/button';
import { FileInput } from '../../shared/file-input';
import { Input } from '../../shared/input';
import { Modal } from '../../shared/modal';
import { OpcaoSelect, Select } from '../../shared/select';
import { Tabs } from '../../shared/tabs';
import { ToastService } from '../../shared/toast';
import { CaravanaCard, CartaoCaravana } from './caravana-card';

const MAX_CAPA_BYTES = 5 * 1024 * 1024;
const TIPOS_CAPA = ['image/jpeg', 'image/png'];

type Campo =
  | 'gameName'
  | 'state'
  | 'municipalityId'
  | 'departsAt'
  | 'salesDeadline'
  | 'basePrice'
  | 'totalSeats'
  | 'maxInstallments'
  | 'description'
  | 'cover';
type Erros = Partial<Record<Campo, string>>;

const CAMPOS_EM_ORDEM: readonly Campo[] = [
  'cover',
  'gameName',
  'state',
  'municipalityId',
  'departsAt',
  'salesDeadline',
  'basePrice',
  'totalSeats',
  'maxInstallments',
  'description',
];

const CAMPO_POR_CODIGO: Readonly<Record<string, Campo>> = {
  DEPARTURE_IN_PAST: 'departsAt',
  DEADLINE_IN_PAST: 'salesDeadline',
  DEADLINE_AFTER_DEPARTURE: 'salesDeadline',
  AMOUNT_BELOW_MINIMUM: 'basePrice',
  GAME_NAME_INVALID: 'gameName',
  INVALID_STATE: 'state',
  INVALID_MUNICIPALITY: 'municipalityId',
  INVALID_IMAGE: 'cover',
};

function numeroOuNaN(texto: string): number {
  return /^\d+([.,]\d{1,2})?$/.test(texto.trim()) ? Number(texto.trim().replace(',', '.')) : NaN;
}

/** Modal de criação de caravana: formulário à esquerda e prévia ao vivo do card (abas "Dados" e "Prévia" no celular). */
@Component({
  selector: 'app-criar-caravana',
  imports: [ReactiveFormsModule, Alert, Button, CaravanaCard, FileInput, Input, Modal, Select, Tabs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './criar-caravana.html',
  styleUrl: './criar-caravana.scss',
})
export class CriarCaravana {
  private readonly api = inject(CaravanasApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly open = input(false);
  readonly closed = output<void>();
  readonly created = output<Caravana>();

  protected readonly form = new FormGroup({
    gameName: new FormControl('', { nonNullable: true }),
    state: new FormControl('', { nonNullable: true }),
    municipalityId: new FormControl('', { nonNullable: true }),
    departsAt: new FormControl('', { nonNullable: true }),
    salesDeadline: new FormControl('', { nonNullable: true }),
    basePrice: new FormControl('', { nonNullable: true }),
    totalSeats: new FormControl('', { nonNullable: true }),
    maxInstallments: new FormControl('1', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
  });

  protected readonly valores = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });
  protected readonly estados = signal<OpcaoSelect[]>([]);
  protected readonly municipios = signal<OpcaoSelect[]>([]);
  protected readonly carregandoMunicipios = signal(false);
  protected readonly capa = signal<File | null>(null);
  protected readonly capaUrl = signal<string | null>(null);
  protected readonly erros = signal<Erros>({});
  protected readonly erroGeral = signal<string | null>(null);
  protected readonly salvando = signal(false);
  protected readonly aba = signal('dados');
  protected readonly estreito = signal(false);

  protected readonly abas = [
    { id: 'dados', rotulo: 'Dados' },
    { id: 'previa', rotulo: 'Prévia' },
  ];

  private estadosCarregados = false;

  protected readonly previa = computed<CartaoCaravana>(() => {
    const v = this.valores();
    const municipio = this.municipios().find((m) => m.valor === v.municipalityId)?.rotulo;
    const partida = v.departsAt && !Number.isNaN(new Date(v.departsAt).getTime()) ? new Date(v.departsAt).toISOString() : null;
    const total = Number(v.totalSeats);
    const preco = numeroOuNaN(v.basePrice ?? '');
    return {
      jogo: (v.gameName ?? '').trim(),
      capaUrl: this.capaUrl(),
      local: municipio ? `${municipio}/${v.state}` : '',
      partida,
      vagasLivres: Number.isInteger(total) && total > 0 ? total : 0,
      vagasTotais: Number.isInteger(total) && total > 0 ? total : 0,
      preco: Number.isNaN(preco) ? null : preco,
      esgotada: false,
      cancelada: false,
      confirmada: false,
    };
  });

  constructor() {
    if (typeof matchMedia === 'function') {
      const consulta = matchMedia('(max-width: 759px)');
      this.estreito.set(consulta.matches);
      const aoMudar = (e: MediaQueryListEvent) => this.estreito.set(e.matches);
      consulta.addEventListener('change', aoMudar);
      this.destroyRef.onDestroy(() => consulta.removeEventListener('change', aoMudar));
    }

    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        this.reiniciar();
        this.carregarEstados();
      });
    });

    this.form.controls.state.valueChanges
      .pipe(startWith(this.form.controls.state.value), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((uf) => this.carregarMunicipios(uf));

    for (const campo of Object.keys(this.form.controls) as Exclude<Campo, 'cover'>[]) {
      this.form.controls[campo].valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.limpar(campo));
    }

    this.destroyRef.onDestroy(() => this.liberarCapa());
  }

  protected escolherCapa(arquivo: File | null): void {
    this.liberarCapa();
    this.limpar('cover');
    if (!arquivo) {
      this.capa.set(null);
      return;
    }
    if (!TIPOS_CAPA.includes(arquivo.type)) {
      this.capa.set(null);
      this.erros.update((e) => ({ ...e, cover: 'Use uma imagem JPG ou PNG.' }));
      return;
    }
    if (arquivo.size > MAX_CAPA_BYTES) {
      this.capa.set(null);
      this.erros.update((e) => ({ ...e, cover: 'A imagem deve ter até 5 MB.' }));
      return;
    }
    this.capa.set(arquivo);
    this.capaUrl.set(URL.createObjectURL(arquivo));
  }

  protected salvar(): void {
    if (this.salvando()) return;
    this.erroGeral.set(null);

    const { dados, erros } = this.validar();
    this.erros.set(erros);
    const primeiro = CAMPOS_EM_ORDEM.find((c) => erros[c]);
    if (primeiro || !dados) {
      this.erroGeral.set('Confira os campos destacados.');
      this.aba.set('dados');
      this.focarPrimeiroErro(primeiro);
      return;
    }

    this.salvando.set(true);
    this.api
      .criar(dados, this.capa())
      .pipe(
        finalize(() => this.salvando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (caravana) => {
          this.toast.success('Caravana criada.');
          this.created.emit(caravana);
        },
        error: (e: unknown) => this.falha(ApiError.de(e)),
      });
  }

  private validar(): { dados: CaravanaInput | null; erros: Erros } {
    const v = this.form.getRawValue();
    const erros: Erros = {};
    const agora = Date.now();

    const jogo = v.gameName.trim();
    if (!jogo) erros.gameName = 'Informe o nome do jogo.';
    else if (jogo.length > 100) erros.gameName = 'Use até 100 caracteres.';

    if (!v.state) erros.state = 'Escolha a UF.';
    if (!v.municipalityId) erros.municipalityId = 'Escolha o município.';

    const partida = v.departsAt ? new Date(v.departsAt).getTime() : NaN;
    const limite = v.salesDeadline ? new Date(v.salesDeadline).getTime() : NaN;
    if (Number.isNaN(partida)) erros.departsAt = 'Informe a data e a hora da partida.';
    else if (partida <= agora) erros.departsAt = 'A partida precisa ser no futuro.';
    if (Number.isNaN(limite)) erros.salesDeadline = 'Informe a data limite de vendas.';
    else if (limite <= agora) erros.salesDeadline = 'A data limite precisa ser no futuro.';
    else if (!erros.departsAt && limite > partida) erros.salesDeadline = 'A data limite não pode ser depois da partida.';

    const preco = numeroOuNaN(v.basePrice);
    if (Number.isNaN(preco)) erros.basePrice = 'Informe o preço com até 2 casas decimais. Use 0 para vaga grátis.';

    const vagas = Number(v.totalSeats);
    if (!/^\d+$/.test(v.totalSeats.trim()) || vagas < 1 || vagas > 100) erros.totalSeats = 'Informe de 1 a 100 vagas.';

    const parcelas = Number(v.maxInstallments);
    if (!/^\d+$/.test(v.maxInstallments.trim()) || parcelas < 1 || parcelas > 12) {
      erros.maxInstallments = 'Informe de 1 a 12 parcelas.';
    }

    if (v.description.length > 2000) erros.description = 'Use até 2000 caracteres.';
    if (this.erros().cover) erros.cover = this.erros().cover;

    if (Object.keys(erros).length) return { dados: null, erros };
    return {
      dados: {
        gameName: jogo,
        state: v.state,
        municipalityId: Number(v.municipalityId),
        departsAt: localParaInstant(v.departsAt),
        basePrice: preco,
        totalSeats: vagas,
        description: v.description.trim(),
        salesDeadline: localParaInstant(v.salesDeadline),
        maxInstallments: parcelas,
      },
      erros,
    };
  }

  private falha(e: ApiError): void {
    const erros: Erros = {};
    for (const [campo, mensagem] of Object.entries(e.campos)) {
      if ((CAMPOS_EM_ORDEM as readonly string[]).includes(campo)) erros[campo as Campo] = mensagem;
    }
    const doCodigo = e.code ? CAMPO_POR_CODIGO[e.code] : undefined;
    if (doCodigo && e.detail) erros[doCodigo] = e.detail;

    if (Object.keys(erros).length) {
      this.erros.set(erros);
      this.erroGeral.set('Confira os campos destacados.');
      this.aba.set('dados');
      this.focarPrimeiroErro(CAMPOS_EM_ORDEM.find((c) => erros[c]));
    } else if (e.status === 429) {
      this.erroGeral.set('Muitas tentativas. Aguarde um pouco e tente de novo.');
    } else if (e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 403 && e.detail) {
      this.erroGeral.set(e.detail);
    } else if (!e.servidor && !e.semConexao && e.status !== 401 && e.status !== 403) {
      this.erroGeral.set('Não foi possível criar a caravana. Tente de novo.');
    }
  }

  private focarPrimeiroErro(campo: Campo | undefined): void {
    if (!campo || campo === 'cover') return;
    // O painel "Dados" pode ter acabado de voltar no celular: espera a renderização antes de focar
    queueMicrotask(() =>
      this.host.nativeElement.querySelector<HTMLElement>(`[data-campo="${campo}"] :is(input, select, textarea)`)?.focus(),
    );
  }

  private carregarEstados(): void {
    if (this.estadosCarregados) return;
    this.api
      .estados()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ufs) => {
          this.estados.set(ufs.map((uf) => ({ valor: uf, rotulo: uf })));
          this.estadosCarregados = true;
        },
        error: () => this.erroGeral.set('Não foi possível carregar as UFs. Feche e abra o formulário de novo.'),
      });
  }

  private carregarMunicipios(uf: string): void {
    this.municipios.set([]);
    this.form.controls.municipalityId.setValue('', { emitEvent: false });
    if (!uf) return;
    this.carregandoMunicipios.set(true);
    this.api
      .municipios(uf)
      .pipe(
        map((lista: Municipio[]) => lista.map((m) => ({ valor: String(m.id), rotulo: m.name }))),
        finalize(() => this.carregandoMunicipios.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (opcoes) => {
          if (this.form.controls.state.value === uf) this.municipios.set(opcoes);
        },
        error: () => this.erros.update((e) => ({ ...e, municipalityId: 'Não foi possível carregar os municípios.' })),
      });
  }

  private reiniciar(): void {
    this.form.reset();
    this.capa.set(null);
    this.liberarCapa();
    this.erros.set({});
    this.erroGeral.set(null);
    this.aba.set('dados');
  }

  private liberarCapa(): void {
    const url = this.capaUrl();
    if (url) URL.revokeObjectURL(url);
    this.capaUrl.set(null);
  }

  private limpar(campo: Campo): void {
    if (this.erros()[campo]) this.erros.update((e) => ({ ...e, [campo]: undefined }));
  }
}
