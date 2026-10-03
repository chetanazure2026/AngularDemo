import { Injectable, computed, signal } from '@angular/core';
import {
  AccountInfo,
  AuthenticationResult,
  BrowserAuthError,
  InteractionRequiredAuthError,
  PublicClientApplication,
} from '@azure/msal-browser';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AppRole } from '../models';

const RETURN_URL_KEY = 'webapitest.returnUrl';
const PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * All authentication logic lives here: Microsoft Entra ID sign-in/sign-out through MSAL,
 * the active account, its app roles, and access tokens for the API.
 * Components read the signals; the auth interceptor asks for tokens.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msal = new PublicClientApplication({
    auth: {
      clientId: environment.auth.clientId,
      authority: `https://login.microsoftonline.com/${environment.auth.tenantId}`,
      redirectUri: environment.auth.redirectUri,
      postLogoutRedirectUri: environment.auth.redirectUri,
    },
    cache: {
      cacheLocation: 'sessionStorage',
    },
  });

  private readonly accountState = signal<AccountInfo | null>(null);
  private readonly initializedState = signal(false);
  private interactionInProgress = false;

  /** Signed-in account, or `null`. */
  readonly account = this.accountState.asReadonly();
  readonly isInitialized = this.initializedState.asReadonly();
  readonly isAuthenticated = computed(() => this.accountState() !== null);
  readonly displayName = computed(() => this.accountState()?.name ?? this.accountState()?.username ?? null);
  readonly userName = computed(() => this.accountState()?.username ?? null);

  /** Entra ID app roles from the ID token (`roles` claim). */
  readonly roles = computed<readonly string[]>(() => {
    const claims = this.accountState()?.idTokenClaims;
    const roles = claims?.['roles'];
    return Array.isArray(roles) ? roles.filter((r): r is string => typeof r === 'string') : [];
  });

  /** False until real Entra ID ids are placed in the environment file. */
  readonly isConfigured =
    environment.auth.clientId !== PLACEHOLDER_ID && environment.auth.tenantId !== PLACEHOLDER_ID;

  /**
   * Must run once before anything else (wired through `provideAppInitializer`).
   * Completes a pending redirect sign-in and restores a cached account.
   */
  async initialize(): Promise<void> {
    if (this.initializedState()) {
      return;
    }

    await this.msal.initialize();

    try {
      const result = await this.msal.handleRedirectPromise();
      if (result?.account) {
        this.setActiveAccount(result.account);
      } else {
        const cached = this.msal.getActiveAccount() ?? this.msal.getAllAccounts()[0] ?? null;
        this.setActiveAccount(cached);
      }
    } catch (error: unknown) {
      console.error('Sign-in redirect could not be completed.', error);
      this.setActiveAccount(null);
    } finally {
      this.initializedState.set(true);
    }
  }

  /** Starts the Entra ID sign-in (full-page redirect). */
  async login(returnUrl?: string): Promise<void> {
    if (returnUrl) {
      this.setReturnUrl(returnUrl);
    }
    if (this.interactionInProgress) {
      return;
    }
    this.interactionInProgress = true;
    await this.msal.loginRedirect({ scopes: [environment.auth.apiScope] });
  }

  async logout(): Promise<void> {
    const account = this.accountState();
    this.setActiveAccount(null);
    await this.msal.logoutRedirect({ account: account ?? undefined });
  }

  hasRole(role: AppRole): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(...roles: readonly AppRole[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  /**
   * Access token for the API, acquired silently from cache/refresh token.
   * Falls back to an interactive redirect when consent or re-authentication is required,
   * in which case `null` is emitted and the page navigates away.
   */
  getAccessToken(): Observable<string | null> {
    const account = this.accountState();
    if (!account) {
      return of(null);
    }

    return from(
      this.msal.acquireTokenSilent({
        scopes: [environment.auth.apiScope],
        account,
      }),
    ).pipe(
      map((result: AuthenticationResult) => result.accessToken),
      catchError((error: unknown) => {
        if (error instanceof InteractionRequiredAuthError) {
          void this.msal.acquireTokenRedirect({ scopes: [environment.auth.apiScope], account });
          return of(null);
        }
        if (error instanceof BrowserAuthError) {
          console.error('Token acquisition failed.', error);
          return of(null);
        }
        throw error;
      }),
    );
  }

  /** Called by the error interceptor on 401: re-authenticate, remembering where the user was. */
  handleUnauthorized(currentUrl: string): void {
    if (!this.isConfigured) {
      return;
    }
    void this.login(currentUrl);
  }

  setReturnUrl(url: string): void {
    sessionStorage.setItem(RETURN_URL_KEY, url);
  }

  /** Reads and clears the URL the user wanted before being sent to sign in. */
  consumeReturnUrl(): string | null {
    const url = sessionStorage.getItem(RETURN_URL_KEY);
    if (url) {
      sessionStorage.removeItem(RETURN_URL_KEY);
    }
    return url;
  }

  private setActiveAccount(account: AccountInfo | null): void {
    this.msal.setActiveAccount(account);
    this.accountState.set(account);
  }
}
