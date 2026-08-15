import { Page } from '@playwright/test';
import { clickTestId, fillHostInput } from './forms';

export const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? 'admin@backoffice.local';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';

export async function login(
  page: Page,
  email = ADMIN_EMAIL,
  password = ADMIN_PASSWORD,
): Promise<void> {
  await page.goto('/login');
  await fillHostInput(page, 'login-email', email);
  await fillHostInput(page, 'login-password', password);
  await clickTestId(page, 'login-submit');
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page);
  await page.waitForURL(/\/backoffice/, { waitUntil: 'domcontentloaded' });
}

export async function logout(page: Page): Promise<void> {
  await clickTestId(page, 'logout');
  await page.waitForURL(/\/login/);
}
