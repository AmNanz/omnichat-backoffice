import { expect, Page } from '@playwright/test';
import {
  clickTestId,
  expectToast,
  fillHostInput,
  searchList,
} from './forms';
import { uniqueEmail } from './unique';
import { openPackagesPage, openProfilesPage } from './nav';

export async function createPackageViaUi(
  page: Page,
  name: string,
  extras?: { price?: string; description?: string },
): Promise<void> {
  await openPackagesPage(page);
  await clickTestId(page, 'packages-new');
  await expect(page.getByRole('heading', { name: 'เพิ่มแพ็กเกจ' })).toBeVisible();
  await fillHostInput(page, 'package-name', name);
  if (extras?.price !== undefined) {
    await fillHostInput(page, 'package-price', extras.price);
  }
  if (extras?.description) {
    await fillHostInput(page, 'package-description', extras.description);
  }
  await clickTestId(page, 'package-save');
  await expectToast(page, 'บันทึกแพ็กเกจแล้ว');
}

export async function createProfileViaUi(
  page: Page,
  name: string,
  code: string,
): Promise<void> {
  await openProfilesPage(page);
  await clickTestId(page, 'profiles-new');
  await expect(page.getByRole('heading', { name: 'เพิ่มโปรไฟล์' })).toBeVisible();
  await fillHostInput(page, 'profile-name', name);
  await fillHostInput(page, 'profile-code', code);
  await fillHostInput(page, 'profile-account-name', `${name} Acc`);
  await fillHostInput(page, 'profile-account-email', uniqueEmail(`pw.${code}`));
  await fillHostInput(page, 'profile-account-password', 'Password1');
  await clickTestId(page, 'profile-save');
  await expectToast(page, 'บันทึกโปรไฟล์แล้ว');
  await expect(page).toHaveURL(/\/backoffice\/profiles$/);
  await searchList(page, 'profiles-search', 'profiles-search-btn', name);
  await expect(page.getByRole('cell', { name })).toBeVisible();
}
