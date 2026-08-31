import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'backoffice.theme';

/** Kept in step with the `--color-bg` of each theme in styles.scss. */
const THEME_COLOR: Record<Theme, string> = {
  dark: '#161826',
  light: '#eef0f8',
};

/**
 * Owns the active theme. The class on <html> is what actually switches both
 * this app's tokens and PrimeNG's colour scheme (its `darkModeSelector` is
 * `.app-dark`), so everything follows from setting it in one place.
 *
 * index.html applies the stored choice before first paint; this service is the
 * runtime owner of the same value.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.read());

  /** True when the user has never chosen — the OS preference still leads. */
  private followsSystem = !this.stored();

  constructor() {
    this.apply(this.theme());
    this.watchSystem();
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.followsSystem = false;
    this.theme.set(theme);
    this.apply(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // A browser with site data blocked still gets a working toggle, it just
      // starts from the OS preference again next visit.
    }
  }

  private apply(theme: Theme): void {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.classList.toggle('app-dark', theme === 'dark');
    root.classList.toggle('app-light', theme === 'light');
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[theme]);
  }

  /** Follow the OS while the user has not picked a side. */
  private watchSystem(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (event) => {
      if (!this.followsSystem) {
        return;
      }
      const next: Theme = event.matches ? 'light' : 'dark';
      this.theme.set(next);
      this.apply(next);
    });
  }

  private stored(): Theme | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch {
      return null;
    }
  }

  private read(): Theme {
    const stored = this.stored();
    if (stored) {
      return stored;
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  }
}
