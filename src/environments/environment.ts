import { AppEnvironment } from './environment.model';

/** Production environment (used by `ng build`). */
export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: 'https://localhost:7009',
  auth: {
    clientId: '7430cbbe-9de5-4075-8223-7048ac3ae067',
    tenantId: '8de02168-2005-49e3-ae8e-100f33e724d8',
    apiScope: 'api://4b668255-2e5d-49aa-afa8-9e316b75b147/access_as_user',
    redirectUri: '/',
  },
};
