import {APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter, } from '@angular/router';
import { authInterceptor } from './core/interceptors/auth.interceptor';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi} from '@angular/common/http';
import {AuthBootstrapService} from './core/services/AuthBootstrapService';



export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),

    provideHttpClient(withInterceptors([authInterceptor]),withFetch()),
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthBootstrapService) => () => auth.init(),
      deps: [AuthBootstrapService],
      multi: true
    }
  ]
};
