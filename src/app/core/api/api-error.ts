import { HttpErrorResponse } from '@angular/common/http';

interface ProblemaCampo {
  field: string;
  message: string;
}

// Corpo de erro do back-end (ProblemDetail + code, requestId e errors[])
interface Problema {
  detail?: string;
  code?: string;
  requestId?: string;
  errors?: ProblemaCampo[];
}

/** Erro normalizado de qualquer chamada à API. Lançado pelo interceptor. */
export class ApiError {
  constructor(
    readonly status: number,
    readonly detail: string | null,
    readonly code: string | null,
    readonly requestId: string | null,
    readonly campos: Readonly<Record<string, string>>,
    readonly retryAfter: number | null,
  ) {}

  get semConexao(): boolean {
    return this.status === 0;
  }

  get servidor(): boolean {
    return this.status >= 500;
  }

  static de(erro: unknown): ApiError {
    if (erro instanceof ApiError) return erro;
    if (!(erro instanceof HttpErrorResponse)) return new ApiError(0, null, null, null, {}, null);

    const corpo = (typeof erro.error === 'object' && erro.error !== null ? erro.error : {}) as Problema;
    const campos: Record<string, string> = {};
    for (const c of corpo.errors ?? []) campos[c.field] ??= c.message;

    const espera = Number(erro.headers?.get('Retry-After'));
    return new ApiError(
      erro.status,
      corpo.detail ?? null,
      corpo.code ?? null,
      corpo.requestId ?? null,
      campos,
      Number.isFinite(espera) && espera > 0 ? espera : null,
    );
  }
}
