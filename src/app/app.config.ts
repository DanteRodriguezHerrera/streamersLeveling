import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';
import { authorizationInterceptor } from './core/auth/authorization.interceptor';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authorizationInterceptor])
    ),
    {
      provide: LocationStrategy,
      useClass: PathLocationStrategy
    },
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Lara,
        
      }
    })
  ]
};
