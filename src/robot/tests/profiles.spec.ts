import { expect, test } from '@playwright/test';
import {
  clickTestId,
  deleteRowByText,
  expectToast,
  fillHostInput,
  searchList,
} from './helpers/forms';
import { createPackageViaUi, createProfileViaUi } from './helpers/entities';
import { openPackagesPage, openProfilesPage, openRowByText } from './helpers/nav';
import { uniqueCode, uniqueLabel } from './helpers/unique';

test.describe.configure({ mode: 'serial' });

const packageName = uniqueLabel('PW ProfPkg');
const profileName = uniqueLabel('PW Prof');
const profileCode = uniqueCode('pwprof');
const editedName = `${profileName} edited`;

test.beforeEach(async ({ page }) => {
  await page.goto('/backoffice/dashboard');
});

test('lists profiles from the Profiles menu', async ({ page }) => {
  await openProfilesPage(page);
  await expect(page.getByTestId('profiles-new')).toBeVisible();
  await expect(page.locator('p-table, app-empty-state').first()).toBeVisible();
});

test('does not create a profile with an empty name', async ({ page }) => {
  await openProfilesPage(page);
  await clickTestId(page, 'profiles-new');
  await expect(page.getByRole('heading', { name: 'เพิ่มโปรไฟล์' })).toBeVisible();
  await clickTestId(page, 'profile-save');
  await expect(page).toHaveURL(/\/backoffice\/profiles\/new/);
});

test('creates a profile with a package', async ({ page }) => {
  await createPackageViaUi(page, packageName);
  await createProfileViaUi(page, profileName, profileCode, packageName);
});

test('rejects a duplicate profile code', async ({ page }) => {
  await openProfilesPage(page);
  await clickTestId(page, 'profiles-new');
  await fillHostInput(page, 'profile-name', uniqueLabel('PW DupProf'));
  await fillHostInput(page, 'profile-code', profileCode);
  await clickTestId(page, 'profile-save');
  await expectToast(page, /already exists|ข้อผิดพลาด|Error/i);
  await expect(page).toHaveURL(/\/backoffice\/profiles\/new/);
});

test('edits a profile name and notes', async ({ page }) => {
  await openProfilesPage(page);
  await searchList(page, 'profiles-search', 'profiles-search-btn', profileName);
  await openRowByText(page, profileName);
  await expect(page.getByRole('heading', { name: 'แก้ไขโปรไฟล์' })).toBeVisible();
  await fillHostInput(page, 'profile-name', editedName);
  await fillHostInput(page, 'profile-notes', 'Updated by Playwright');
  await clickTestId(page, 'profile-save');
  await expectToast(page, 'บันทึกโปรไฟล์แล้ว');
  await searchList(page, 'profiles-search', 'profiles-search-btn', editedName);
  await expect(page.getByRole('cell', { name: editedName })).toBeVisible();
});

test('deletes a profile', async ({ page }) => {
  await openProfilesPage(page);
  await searchList(page, 'profiles-search', 'profiles-search-btn', editedName);
  await deleteRowByText(page, editedName);
  await expectToast(page, 'ลบโปรไฟล์แล้ว');
  await searchList(page, 'profiles-search', 'profiles-search-btn', editedName);
  await expect(page.getByRole('cell', { name: editedName })).toHaveCount(0);
});

test('deletes the profile package fixture', async ({ page }) => {
  await openPackagesPage(page);
  await searchList(page, 'packages-search', 'packages-search-btn', packageName);
  await deleteRowByText(page, packageName);
  await expectToast(page, 'ลบแพ็กเกจแล้ว');
});
