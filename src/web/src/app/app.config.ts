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

/**
 * Nocturne — the back-office theme. Colours come from the design system's
 * OKLCH ramps: a near-neutral blue-grey ground with a single blurple accent
 * used as a line and a glow, never as a flood. See styles.scss for the token
 * sheet the rest of the app reads.
 */
const NOCTURNE_ACCENT = {
  50: '#f5f4ff',
  100: '#f5f4ff',
  200: '#e7e5fe',
  300: '#d2cefd',
  400: '#b5abfc',
  500: '#9184d9',
  600: '#796cbf',
  700: '#5d5294',
  800: '#423a6a',
  900: '#2b2741',
  950: '#1f1c30',
};

/** The neutral ramp, ordered the way PrimeNG expects a surface scale. */
const NOCTURNE_SURFACE = {
  0: '#f3f5fe',
  50: '#e4e7f5',
  100: '#cfd3e5',
  200: '#b2b6ca',
  300: '#9397ab',
  400: '#75798c',
  500: '#595d6c',
  600: '#3f424d',
  700: '#292b31',
  800: '#232532',
  900: '#1b1d2c',
  950: '#161826',
};

const Nocturne = definePreset(Lara, {
  primitive: {
    fontFamily: "Inter, 'Noto Sans Thai', system-ui, sans-serif",
    borderRadius: {
      none: '0',
      xs: '4px',
      sm: '4px',
      md: '8px',
      lg: '14px',
      xl: '14px',
    },
  },
  semantic: {
    primary: NOCTURNE_ACCENT,
    colorScheme: {
      light: {
        surface: {
          0: '#fbfbfe',
          50: '#f4f5fa',
          100: '#eaecf5',
          200: '#dde0ec',
          300: '#c2c6d6',
          400: '#9397ab',
          500: '#7c8093',
          600: '#6b6f80',
          700: '#595d6c',
          800: '#3f424d',
          900: '#292b31',
          950: '#1c1d2b',
        },
        primary: {
          color: '#6f62b8',
          contrastColor: '#fbfbfe',
          hoverColor: '#574a9e',
          activeColor: '#453a80',
        },
        highlight: {
          background: 'color-mix(in srgb, #6f62b8 12%, transparent)',
          focusBackground: 'color-mix(in srgb, #6f62b8 20%, transparent)',
          color: '#453a80',
          focusColor: '#2b2741',
        },
        content: {
          background: '#fbfbfe',
          hoverBackground: 'color-mix(in srgb, #1c1d2b 5%, transparent)',
          borderColor: 'color-mix(in srgb, #1c1d2b 14%, transparent)',
          color: '#1c1d2b',
          hoverColor: '#292b31',
        },
        text: {
          color: '#1c1d2b',
          hoverColor: '#292b31',
          mutedColor: '#7c8093',
          hoverMutedColor: '#6b6f80',
        },
        formField: {
          background: '#fbfbfe',
          disabledBackground: '#eaecf5',
          filledBackground: '#f4f5fa',
          borderColor: 'color-mix(in srgb, #1c1d2b 14%, transparent)',
          hoverBorderColor: 'color-mix(in srgb, #1c1d2b 38%, transparent)',
          focusBorderColor: '#6f62b8',
          invalidBorderColor: '#c2404b',
          color: '#1c1d2b',
          disabledColor: '#9397ab',
          placeholderColor: '#9397ab',
          floatLabelColor: '#7c8093',
          iconColor: '#7c8093',
        },
        overlay: {
          select: { background: '#fbfbfe', borderColor: 'color-mix(in srgb, #1c1d2b 14%, transparent)', color: '#1c1d2b' },
          popover: { background: '#fbfbfe', borderColor: 'color-mix(in srgb, #1c1d2b 14%, transparent)', color: '#1c1d2b' },
          modal: { background: '#fbfbfe', borderColor: 'color-mix(in srgb, #1c1d2b 14%, transparent)', color: '#1c1d2b' },
        },
      },
      dark: {
        surface: NOCTURNE_SURFACE,
        primary: {
          color: '#9184d9',
          contrastColor: '#161826',
          hoverColor: '#b5abfc',
          activeColor: '#d2cefd',
        },
        highlight: {
          background: 'color-mix(in srgb, #9184d9 16%, transparent)',
          focusBackground: 'color-mix(in srgb, #9184d9 24%, transparent)',
          color: '#e7e5fe',
          focusColor: '#f5f4ff',
        },
        content: {
          background: '#232532',
          hoverBackground: 'color-mix(in srgb, #e9e9ed 7%, transparent)',
          borderColor: 'color-mix(in srgb, #e9e9ed 16%, transparent)',
          color: '#e9e9ed',
          hoverColor: '#f3f5fe',
        },
        text: {
          color: '#e9e9ed',
          hoverColor: '#f3f5fe',
          mutedColor: '#9397ab',
          hoverMutedColor: '#b2b6ca',
        },
        formField: {
          background: '#232532',
          disabledBackground: '#1b1d2c',
          filledBackground: '#1b1d2c',
          borderColor: 'color-mix(in srgb, #e9e9ed 16%, transparent)',
          hoverBorderColor: 'color-mix(in srgb, #e9e9ed 45%, transparent)',
          focusBorderColor: '#9184d9',
          invalidBorderColor: '#e58a8a',
          color: '#e9e9ed',
          disabledColor: '#75798c',
          placeholderColor: '#75798c',
          floatLabelColor: '#9397ab',
          iconColor: '#9397ab',
        },
        overlay: {
          select: { background: '#232532', borderColor: 'color-mix(in srgb, #e9e9ed 16%, transparent)', color: '#e9e9ed' },
          popover: { background: '#232532', borderColor: 'color-mix(in srgb, #e9e9ed 16%, transparent)', color: '#e9e9ed' },
          modal: { background: '#232532', borderColor: 'color-mix(in srgb, #e9e9ed 16%, transparent)', color: '#e9e9ed' },
        },
      },
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
        preset: Nocturne,
        options: {
          // ThemeService owns this class on <html>; PrimeNG's own light and
          // dark schemes flip with it, in step with the tokens in styles.scss.
          darkModeSelector: '.app-dark',
        },
      },
    }),
    MessageService,
    ConfirmationService,
    provideAppInitializer(() => inject(AuthService).initializeSession()),
  ],
};
