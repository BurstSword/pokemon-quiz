import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(
      appRoutes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
      }),
    ),
  ],
};
