import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, shareReplay, throwError } from 'rxjs';
import { API } from '../site.config';

export interface CsrfToken {
  headerName: string;
  token: string;
}

/** O cookie XSRF-TOKEN é HttpOnly: o token vem de GET /auth/csrf e fica em cache. */
@Injectable({ providedIn: 'root' })
export class Csrf {
  private readonly http = inject(HttpClient);
  private atual: Observable<CsrfToken> | null = null;

  obter(): Observable<CsrfToken> {
    this.atual ??= this.http.get<CsrfToken>(`${API.url}/auth/csrf`).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((erro) => {
        this.atual = null;
        return throwError(() => erro);
      }),
    );
    return this.atual;
  }

  invalidar(): void {
    this.atual = null;
  }
}
