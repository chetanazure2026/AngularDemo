import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),

    // Single HttpClient configuration. Order matters: auth adds the token first,
    // error wraps the whole chain so it also sees failures from the auth step.
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])),

    // Complete any pending MSAL redirect and restore the account before the first route renders.
    provideAppInitializer(() => inject(AuthService).initialize()),
  ],
};
