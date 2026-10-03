/**
 * Shape shared by every environment file so `environment.ts` and
 * `environment.development.ts` cannot drift apart.
 */
export interface AppEnvironment {
  readonly production: boolean;
  /** Base URL of the WebApiTest API, without a trailing slash. */
  readonly apiBaseUrl: string;
  readonly auth: {
    /** Application (client) id of the SPA app registration in Entra ID. */
    readonly clientId: string;
    /** Directory (tenant) id. */
    readonly tenantId: string;
    /** Delegated scope exposed by the API app registration, e.g. api://<api-client-id>/access_as_user. */
    readonly apiScope: string;
    /** Where Entra ID returns after sign-in. Relative URLs are resolved against the current origin. */
    readonly redirectUri: string;
  };
}
