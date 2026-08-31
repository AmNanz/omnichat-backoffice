import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ThemeService } from './shared/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule],
  template: `
    <p-toast />
    <p-confirmDialog />
    <router-outlet />
  `,
})
export class App {
  // Constructed here so the theme is owned from app start, including on the
  // login screen, which sits outside the back-office layout.
  private readonly theme = inject(ThemeService);
}
