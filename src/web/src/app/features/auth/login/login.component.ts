import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';
import { ConfirmHelper } from '../../../shared/confirm.helper';
import { apiErrorMessage } from '../../../services/http-utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule],
  template: `
    <div class="login-shell">
      <section class="login-hero">
        <div class="login-brand-card" aria-hidden="true">
          <svg class="login-brand-mark" viewBox="0 0 72 72" fill="none">
            <path
              d="M18 46c0-8.8 7.2-16 16-16h4c8.8 0 16 7.2 16 16"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
            />
            <circle cx="26" cy="24" r="6" stroke="currentColor" stroke-width="2.4" />
            <circle cx="46" cy="24" r="6" stroke="currentColor" stroke-width="2.4" />
            <rect x="31" y="32" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2.4" />
          </svg>
          <div class="login-brand-name">OMNI CHAT</div>
        </div>
        <span class="login-pill">OMNICHAT</span>
        <h1>ระบบจัดการหลังบ้าน</h1>
        <p class="login-hero-title">OmniChat</p>
      </section>

      <section class="login-panel">
        <div class="login-card">
          <span class="login-pill">ACCOUNT ACCESS</span>
          <h2>เข้าสู่ระบบ</h2>
          <p class="login-subtitle">ใช้อีเมลที่ลงทะเบียนไว้</p>

          <form class="login-form" [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-field">
              <label for="email">อีเมล</label>
              <input
                id="email"
                pInputText
                formControlName="email"
                autocomplete="username"
                class="w-full"
                [class.login-input-invalid]="showError('email')"
                placeholder="กรอกอีเมล"
                data-testid="login-email"
              />
              @if (showError('email')) {
                <small class="login-error">กรุณากรอกอีเมล</small>
              }
            </div>
            <div class="form-field">
              <label for="password">รหัสผ่าน</label>
              <p-password
                inputId="password"
                formControlName="password"
                [feedback]="false"
                [toggleMask]="true"
                fluid
                autocomplete="current-password"
                placeholder="กรอกรหัสผ่าน"
                styleClass="w-full"
                [inputStyleClass]="showError('password') ? 'login-input-invalid' : ''"
                data-testid="login-password"
              />
              @if (showError('password')) {
                <small class="login-error">กรุณากรอกรหัสผ่าน</small>
              }
            </div>
            <p-button
              type="submit"
              label="เข้าสู่ระบบ"
              styleClass="w-full login-submit"
              [loading]="loading()"
              data-testid="login-submit"
            />
          </form>
        </div>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .login-shell {
      min-height: 100%;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(22rem, 28rem);
      align-items: center;
      gap: 3rem;
      padding: 3.5rem 6vw 3.5rem 8vw;
      background:
        radial-gradient(ellipse 70% 80% at 58% 48%, #ffffff 0%, transparent 55%),
        linear-gradient(115deg, #d7e6f2 0%, #eaf2f8 42%, #f7fafc 100%);
    }

    .login-hero {
      max-width: 28rem;
    }

    .login-brand-card {
      width: 7.25rem;
      height: 7.25rem;
      margin-bottom: 1.35rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      background: #fff;
      border-radius: 1.15rem;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
      color: #1e293b;
    }

    .login-brand-mark {
      width: 3.4rem;
      height: 3.4rem;
    }

    .login-brand-name {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1;
    }

    .login-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.28rem 0.75rem;
      border-radius: 999px;
      background: #d7e8f4;
      color: #2f5f86;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .login-hero h1,
    .login-hero-title {
      margin: 0;
      color: #1c3550;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.15;
    }

    .login-hero h1 {
      margin-top: 0.9rem;
      font-size: clamp(2rem, 3.4vw, 2.75rem);
    }

    .login-hero-title {
      margin-top: 0.15rem;
      font-size: clamp(2rem, 3.4vw, 2.75rem);
    }

    .login-panel {
      display: flex;
      justify-content: flex-end;
    }

    .login-card {
      width: 100%;
      max-width: 26rem;
      padding: 1.85rem 1.75rem 1.7rem;
      background: #fff;
      border-radius: 1.15rem;
      box-shadow: 0 18px 50px rgba(28, 53, 80, 0.1);
    }

    .login-card h2 {
      margin: 0.85rem 0 0.35rem;
      color: #1c3550;
      font-size: 1.85rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .login-subtitle {
      margin: 0 0 1.35rem;
      color: #5b738a;
      font-size: 0.95rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.05rem;
    }

    .login-form .form-field label {
      color: #1c3550;
      font-weight: 600;
    }

    .login-error {
      color: #dc2626;
      font-size: 0.82rem;
    }

    :host ::ng-deep {
      .login-form .p-inputtext,
      .login-form .p-password {
        width: 100%;
      }

      .login-form .p-inputtext {
        border-radius: 0.7rem;
        border-color: #d5e0ea;
        padding: 0.75rem 0.9rem;
      }

      .login-form .p-inputtext::placeholder {
        color: #94a3b8;
      }

      .login-form .login-input-invalid,
      .login-form .p-inputtext.login-input-invalid {
        border-color: #f3b4b4;
      }

      .login-submit.p-button {
        margin-top: 0.35rem;
        height: 2.85rem;
        border: 0;
        border-radius: 0.7rem;
        background: #6699bb;
        font-weight: 600;
      }

      .login-submit.p-button:not(:disabled):hover {
        background: #5b8aab;
      }
    }

    @media (max-width: 960px) {
      .login-shell {
        grid-template-columns: 1fr;
        justify-items: center;
        gap: 2rem;
        padding: 2rem 1.25rem 2.5rem;
      }

      .login-hero,
      .login-panel {
        width: 100%;
        max-width: 26rem;
      }

      .login-panel {
        justify-content: center;
      }
    }
  `,
})
export class LoginComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly helper = inject(ConfirmHelper);

  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: [environment.defaultLoginEmail, [Validators.required, Validators.email]],
    password: [environment.defaultLoginPassword, [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    void this.authService.initializeSession().then(() => {
      if (this.authService.isAuthenticated()) {
        void this.router.navigate(['/backoffice/profiles']);
      }
    });
  }

  showError(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.authService
      .login(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigate(['/backoffice/profiles']);
        },
        error: (error) => {
          this.loading.set(false);
          this.helper.toastError(apiErrorMessage(error, 'เข้าสู่ระบบไม่สำเร็จ'));
        },
      });
  }
}
