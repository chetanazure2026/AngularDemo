# webapitest-client

Angular 19.2 front end for the WebApiTest Task Management API (`../WebApiTest`).
Standalone components, signals, functional interceptors and lazy-loaded feature routes.
Tests run on Karma + Jasmine (Chrome).

```
src/
  environments/                 environment.ts (prod) / environment.development.ts (ng serve) + shared AppEnvironment type
  app/
    app.config.ts               provideRouter(withComponentInputBinding), provideHttpClient(withInterceptors), provideAppInitializer(MSAL)
    app.routes.ts               lazy routes: /login, /tasks/** (guarded), /profile (guarded), **
    app.ts|html|scss            shell: nav, sign-in state, <app-notifications/>, <router-outlet/>
    core/                       singletons, no UI
      models/                   ApiError, PagedResult<T>, UserProfile, APP_ROLES
      services/                 ApiService (GET/POST/PUT/PATCH/DELETE), AuthService (MSAL), NotificationService
      interceptors/             auth.interceptor.ts (Bearer token), error.interceptor.ts (400/401/403/404/500/network)
      guards/                   authGuard
    shared/                     reusable UI: notifications toast, page header, loading indicator, enumLabel pipe
    features/
      auth/                     LoginComponent
      profile/                  ProfileService + ProfileComponent (GET /api/auth/me)
      tasks/                    models, TasksService, tasks.routes.ts, task-list / task-form / task-detail
      not-found/
```

## Rules of the architecture

* **Components only render and forward user intent.** All HTTP goes through feature services
  (`TasksService`, `ProfileService`) which compose `ApiService`. Nothing injects `HttpClient` directly.
* **`ApiService`** resolves paths against `environment.apiBaseUrl`, builds `HttpParams` from a typed
  record (dropping `null`/`undefined`/empty), and returns typed observables.
* **`authInterceptor`** asks `AuthService` for an access token and adds `Authorization: Bearer` only
  for requests to the API origin.
* **`errorInterceptor`** normalizes every failure into `ApiError` (status, message, validation errors,
  traceId), shows a toast per status family, triggers re-authentication on 401 and rethrows.
  A request can opt out of the toast with the `SKIP_ERROR_NOTIFICATION` context token
  (the task form does this to show field-level validation from the API).
* **`AuthService`** owns MSAL (`@azure/msal-browser`): redirect sign-in/out, active account,
  app roles from the ID token, silent token acquisition, return-URL handling. UI reads its signals.
* **`NotificationService`** is a signal store; `<app-notifications>` renders it.
* Strong typing everywhere; `any` is not used. Enum-like API values are string literal unions.

## Configure Entra ID

The API registration already exists (see `../WebApiTest/README.md`). Add a **second** registration for this SPA:

1. Entra admin center → App registrations → New registration, name `WebApiTest-Client`,
   platform **Single-page application**, redirect URI `http://localhost:4200/`.
2. API permissions → Add a permission → My APIs → `WebApiTest-Api` → Delegated → `access_as_user` → Add.
   Grant admin consent if your tenant requires it.
3. Copy the SPA's **Application (client) ID** and the **Directory (tenant) ID** into
   `src/environments/environment.development.ts`:

```ts
auth: {
  clientId: '<spa-client-id>',
  tenantId: '<tenant-id>',
  apiScope: 'api://<api-client-id>/access_as_user',
  redirectUri: '/',
}
```

4. Make sure the API's CORS allows `http://localhost:4200` (`AppSettings:CorsOrigins` in the API's
   appsettings.json, or leave it empty to allow any origin in development).

Users need one of the API's app roles (`Admin`, `Contributor`, `Reader`); the UI
hides create/edit/delete actions based on the `roles` claim.

## Run

Requires Node.js 22 (any 22.x) or newer and pnpm. On Node 22.12 use pnpm 10 (`npx pnpm@10 …` or
`npm install -g pnpm@10`); pnpm 12 itself requires Node 22.13 or newer.

```bash
pnpm install
pnpm start
```

Open http://localhost:4200. The API must be running (`dotnet run --project src/WebApiTest.Presentation`
in `../WebApiTest`) on the URL in `environment.development.ts` (`http://localhost:5032` by default).

## Test and build

```bash
pnpm test
```

Headless, single run (CI):

```bash
pnpm test:ci
```

```bash
pnpm build
```
