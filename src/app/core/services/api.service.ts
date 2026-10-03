import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

/** Query-string values accepted by {@link ApiService}. `null`/`undefined` entries are omitted. */
export type QueryParams = Readonly<Record<string, string | number | boolean | null | undefined>>;

export interface RequestOptions {
  readonly params?: QueryParams;
  /** Per-request flags read by interceptors (see `SKIP_ERROR_NOTIFICATION`). */
  readonly context?: HttpContext;
}

/**
 * Single entry point for HTTP calls to the WebApiTest API.
 * Resolves paths against `environment.apiBaseUrl` and returns typed observables.
 * Feature services compose their endpoints on top of this; components never call HttpClient directly.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  get<TResponse>(path: string, options?: RequestOptions): Observable<TResponse> {
    return this.http.get<TResponse>(this.url(path), this.httpOptions(options));
  }

  post<TResponse, TBody = unknown>(path: string, body: TBody, options?: RequestOptions): Observable<TResponse> {
    return this.http.post<TResponse>(this.url(path), body, this.httpOptions(options));
  }

  put<TResponse, TBody = unknown>(path: string, body: TBody, options?: RequestOptions): Observable<TResponse> {
    return this.http.put<TResponse>(this.url(path), body, this.httpOptions(options));
  }

  patch<TResponse, TBody = unknown>(path: string, body: TBody, options?: RequestOptions): Observable<TResponse> {
    return this.http.patch<TResponse>(this.url(path), body, this.httpOptions(options));
  }

  delete<TResponse = void>(path: string, options?: RequestOptions): Observable<TResponse> {
    return this.http.delete<TResponse>(this.url(path), this.httpOptions(options));
  }

  /** Absolute URL for an API path; used by interceptors to recognise API traffic. */
  url(path: string): string {
    return `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
  }

  private httpOptions(options?: RequestOptions): { params: HttpParams; context?: HttpContext } {
    return {
      params: this.toHttpParams(options?.params),
      context: options?.context,
    };
  }

  private toHttpParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }
      httpParams = httpParams.set(key, String(value));
    }

    return httpParams;
  }
}
