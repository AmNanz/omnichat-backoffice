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
import { ThemeService } from '../../../shared/theme.service';
import { apiErrorMessage } from '../../../services/http-utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule],
  template: `
    <div class="login-shell">
      <section class="login-hero">
        <div class="login-brand">
          <img src="brand/mindchat-wordmark.png" alt="mindchat" />
          <span>Back-office</span>
          <button
            type="button"
            class="login-theme"
            [attr.aria-label]="theme.theme() === 'dark' ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'"
            (click)="theme.toggle()"
            data-testid="login-theme-toggle"
          >
            <i [class]="theme.theme() === 'dark' ? 'ph ph-sun' : 'ph ph-moon'"></i>
          </button>
        </div>

        <div class="login-hero-body">
          <div class="login-kicker">ระบบจัดการหลังบ้าน</div>
          <h1>จัดการผู้เช่า แพ็กเกจ<br />และการเรียกเก็บเงิน<br />ได้จากที่เดียว</h1>
          <p>
            โปรไฟล์ บริษัท ผู้ใช้ โควตา ใบแจ้งหนี้ และบันทึกการใช้งาน —
            ครบในแผงควบคุมเดียว
          </p>
          <ul class="login-points">
            <li><i class="ph ph-identification-card"></i><span>โปรไฟล์และบริษัทในผังเดียว</span></li>
            <li><i class="ph ph-gauge"></i><span>โควตาและการใช้งานแบบเรียลไทม์</span></li>
            <li><i class="ph ph-clock-counter-clockwise"></i><span>บันทึกทุกการเปลี่ยนแปลง</span></li>
          </ul>
        </div>

        <div class="login-foot">mindchat · ใช้งานภายในองค์กรเท่านั้น</div>
      </section>

      <section class="login-panel">
        <div class="login-card">
          <h2>เข้าสู่ระบบ</h2>
          <p class="login-subtitle">ใช้อีเมลที่ลงทะเบียนไว้กับทีมผู้ดูแล</p>

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
              icon="ph ph-arrow-right"
              iconPos="right"
              styleClass="w-full login-submit"
              [loading]="loading()"
              data-testid="login-submit"
            />

            <p class="login-note">การเข้าสู่ระบบทั้งหมดถูกบันทึกไว้ในบันทึกการใช้งาน</p>
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
      grid-template-columns: minmax(0, 1.1fr) minmax(380px, 0.9fr);
      background: var(--color-bg);
      color: var(--color-text);
    }

    /* The hero is the one place the accent runs as a field — a soft bloom,
       not a flood. */
    .login-hero {
      position: relative;
      overflow: hidden;
      padding: 56px 56px 44px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background:
        radial-gradient(
          ellipse 80% 70% at 15% 10%,
          color-mix(in srgb, var(--color-accent) 22%, transparent),
          transparent 60%
        ),
        linear-gradient(160deg, var(--login-hero-from) 0%, var(--login-hero-to) 70%);
    }

    .login-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .login-brand img {
      height: 26px;
      width: auto;
      object-fit: contain;
    }

    .login-theme {
      margin-left: auto;
      display: inline-grid;
      place-items: center;
      width: 34px;
      height: 34px;
      font-size: 17px;
      color: var(--color-neutral-400);
      background: transparent;
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      cursor: pointer;
    }

    .login-theme:hover {
      background: color-mix(in srgb, var(--color-text) 7%, transparent);
      color: var(--color-text);
    }

    .login-brand span {
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-neutral-500);
      padding-left: 12px;
      box-shadow: inset 1px 0 0 var(--color-divider);
    }

    .login-hero-body {
      max-width: 520px;
    }

    .login-kicker {
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--color-accent-text);
      margin-bottom: 14px;
    }

    .login-hero h1 {
      margin: 0;
      font-size: 38px;
      font-weight: 500;
      line-height: 1.12;
      letter-spacing: -0.03em;
    }

    .login-hero p {
      margin: 16px 0 0;
      font-size: 14px;
      color: var(--color-neutral-400);
      max-width: 420px;
    }

    .login-points {
      list-style: none;
      margin: 28px 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .login-points li {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--color-neutral-300);
    }

    .login-points i {
      font-size: 17px;
      color: var(--color-accent-text);
      width: 20px;
      text-align: center;
    }

    .login-foot {
      font-size: 11px;
      color: var(--color-neutral-600);
    }

    .login-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 44px;
      box-shadow: inset 1px 0 0 var(--color-divider);
    }

    .login-card {
      width: 100%;
      max-width: 360px;
    }

    .login-card h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      letter-spacing: -0.02em;
    }

    .login-subtitle {
      margin: 6px 0 24px;
      font-size: 13px;
      color: var(--color-neutral-500);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .login-form ::ng-deep .p-inputtext {
      min-height: 40px;
    }

    .login-error {
      color: var(--tone-bad);
      font-size: 12px;
    }

    .login-form ::ng-deep .login-input-invalid {
      border-color: var(--tone-bad);
    }

    .login-form ::ng-deep .login-submit .p-button {
      min-height: 40px;
      margin-top: 4px;
    }

    .login-note {
      margin: 6px 0 0;
      text-align: center;
      font-size: 11px;
      color: var(--color-neutral-600);
    }

    @media (max-width: 960px) {
      .login-shell {
        grid-template-columns: 1fr;
      }

      .login-hero {
        padding: 32px 24px;
        gap: 24px;
      }

      .login-hero h1 {
        font-size: 28px;
      }

      .login-panel {
        padding: 28px 24px 40px;
        box-shadow: none;
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
  readonly theme = inject(ThemeService);

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
