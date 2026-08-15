import { expect, test } from '@playwright/test';
import {
  clickTestId,
  deleteRowByText,
  dialogAccept,
  expectToast,
  fillHostInput,
  searchList,
  selectOption,
} from './helpers/forms';
import { createPackageViaUi, createProfileViaUi } from './helpers/entities';
import {
  openPackagesPage,
  openProfilesPage,
  openRowByText,
  openSubscriptionsPage,
} from './helpers/nav';
import { uniqueCode, uniqueLabel } from './helpers/unique';

test.describe.configure({ mode: 'serial' });

const packageName = uniqueLabel('PW SubPkg');
const profileName = uniqueLabel('PW SubProf');
const profileCode = uniqueCode('pwsub');
const profileOption = `${profileName} (${profileCode})`;

test.beforeEach(async ({ page }) => {
  await page.goto('/backoffice/dashboard');
});

test('lists subscriptions from the Subscriptions menu', async ({ page }) => {
  await openSubscriptionsPage(page);
  await expect(page.getByTestId('subscriptions-new')).toBeVisible();
  await expect(page.locator('p-table, app-empty-state').first()).toBeVisible();
});

test('does not create a subscription without a profile', async ({ page }) => {
  await openSubscriptionsPage(page);
  await clickTestId(page, 'subscriptions-new');
  await expect(page.getByRole('heading', { name: 'เพิ่มการสมัคร' })).toBeVisible();
  await clickTestId(page, 'subscription-save');
  await expect(page).toHaveURL(/\/backoffice\/subscriptions\/new/);
});

test('creates a subscription for a profile and package', async ({ page }) => {
  await createPackageViaUi(page, packageName);
  await createProfileViaUi(page, profileName, profileCode, packageName);
  await openSubscriptionsPage(page);
  await clickTestId(page, 'subscriptions-new');
  await selectOption(page, 'subscription-profile', profileOption);
  await selectOption(page, 'subscription-package', packageName);
  await fillHostInput(page, 'subscription-notes', 'Playwright subscription');
  await clickTestId(page, 'subscription-save');
  await expectToast(page, 'บันทึกการสมัครแล้ว');
  await expect(page).toHaveURL(/\/backoffice\/subscriptions$/);
  await expect(page.getByRole('cell', { name: profileName })).toBeVisible();
});

test('edits subscription notes', async ({ page }) => {
  await openSubscriptionsPage(page);
  await openRowByText(page, profileName);
  await expect(page.getByRole('heading', { name: 'แก้ไขการสมัคร' })).toBeVisible();
  await fillHostInput(page, 'subscription-notes', 'Updated by Playwright');
  await page.getByRole('button', { name: 'บันทึก' }).click();
  await expectToast(page, 'บันทึกการสมัครแล้ว');
});

test('suspends and activates a subscription', async ({ page }) => {
  await openSubscriptionsPage(page);
  await openRowByText(page, profileName);
  await clickTestId(page, 'subscription-suspend');
  await dialogAccept(page);
  await expectToast(page, 'ระงับการสมัครแล้ว');
  await expect(page.getByTestId('subscription-activate')).toBeVisible();
  await clickTestId(page, 'subscription-activate');
  await expectToast(page, 'เปิดใช้งานการสมัครแล้ว');
  await expect(page.getByTestId('subscription-suspend')).toBeVisible();
});

test('deletes a subscription', async ({ page }) => {
  await openSubscriptionsPage(page);
  await openRowByText(page, profileName);
  await clickTestId(page, 'subscription-delete');
  await dialogAccept(page);
  await expectToast(page, 'ลบการสมัครแล้ว');
  await expect(page).toHaveURL(/\/backoffice\/subscriptions$/);
  await expect(page.getByRole('cell', { name: profileName })).toHaveCount(0);
});

test('deletes subscription fixtures', async ({ page }) => {
  await openProfilesPage(page);
  await searchList(page, 'profiles-search', 'profiles-search-btn', profileName);
  await deleteRowByText(page, profileName);
  await expectToast(page, 'ลบโปรไฟล์แล้ว');
  await openPackagesPage(page);
  await searchList(page, 'packages-search', 'packages-search-btn', packageName);
  await deleteRowByText(page, packageName);
  await expectToast(page, 'ลบแพ็กเกจแล้ว');
});
