import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeTh from '@angular/common/locales/th';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { PRIMENG_TH } from './core/primeng-th';
import { AuthService } from './services/auth.service';

registerLocaleData(localeTh);

const OmniLara = definePreset(Lara, {
  primitive: {
    fontFamily: "Kanit, sans-serif",
  },
  semantic: {
    primary: {
      50: '#f3f8fb',
      100: '#e4eef5',
      200: '#c9ddea',
      300: '#a8c6db',
      400: '#86b0cc',
      500: '#6699bb',
      600: '#5589ac',
      700: '#45708e',
      800: '#385a73',
      900: '#2d485c',
      950: '#1c3550',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: LOCALE_ID, useValue: 'th-TH' },
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: true,
      translation: PRIMENG_TH,
      theme: {
        preset: OmniLara,
        options: {
          darkModeSelector: '.app-dark',
        },
      },
    }),
    MessageService,
    ConfirmationService,
    provideAppInitializer(() => inject(AuthService).initializeSession()),
  ],
};
