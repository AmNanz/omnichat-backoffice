import { Page, expect } from '@playwright/test';
import { clickTestId } from './forms';

export async function openRolesPage(page: Page): Promise<void> {
  await clickTestId(page, 'nav-roles');
  await expect(page.getByRole('heading', { name: 'บทบาท' })).toBeVisible();
}

export async function openUsersPage(page: Page): Promise<void> {
  await clickTestId(page, 'nav-users');
  await expect(page.getByRole('heading', { name: 'ผู้ใช้' })).toBeVisible();
}

export async function openPackagesPage(page: Page): Promise<void> {
  await clickTestId(page, 'nav-packages');
  await expect(page.getByRole('heading', { name: 'แพ็กเกจ' })).toBeVisible();
}

export async function openProfilesPage(page: Page): Promise<void> {
  await clickTestId(page, 'nav-profiles');
  await expect(page.getByRole('heading', { name: 'โปรไฟล์' })).toBeVisible();
}

export async function openSubscriptionsPage(page: Page): Promise<void> {
  await clickTestId(page, 'nav-subscriptions');
  await expect(page.getByRole('heading', { name: 'การสมัคร' })).toBeVisible();
}

export async function openRowByText(page: Page, text: string): Promise<void> {
  await page.getByRole('row', { name: new RegExp(text) }).first().click();
}
