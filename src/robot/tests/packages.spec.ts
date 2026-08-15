import { expect, test } from '@playwright/test';
import {
  clickTestId,
  deleteRowByText,
  dialogReject,
  expectToast,
  fillHostInput,
  searchList,
} from './helpers/forms';
import { createPackageViaUi } from './helpers/entities';
import { openPackagesPage, openRowByText } from './helpers/nav';
import { uniqueLabel } from './helpers/unique';

test.describe.configure({ mode: 'serial' });

const packageName = uniqueLabel('PW Pkg');
const editedName = `${packageName} edited`;

test.beforeEach(async ({ page }) => {
  await page.goto('/backoffice/dashboard');
});

test('lists packages from the Packages menu', async ({ page }) => {
  await openPackagesPage(page);
  await expect(page.getByTestId('packages-new')).toBeVisible();
  await expect(page.locator('p-table, app-empty-state').first()).toBeVisible();
});

test('does not create a package with an empty name', async ({ page }) => {
  await openPackagesPage(page);
  await clickTestId(page, 'packages-new');
  await expect(page.getByRole('heading', { name: 'เพิ่มแพ็กเกจ' })).toBeVisible();
  await clickTestId(page, 'package-save');
  await expect(page).toHaveURL(/\/backoffice\/packages\/new/);
});

test('creates a package', async ({ page }) => {
  await createPackageViaUi(page, packageName, {
    price: '199',
    description: 'Playwright package',
  });
  await openPackagesPage(page);
  await searchList(page, 'packages-search', 'packages-search-btn', packageName);
  await expect(page.getByRole('cell', { name: packageName })).toBeVisible();
});

test('rejects a duplicate package slug', async ({ page }) => {
  await openPackagesPage(page);
  await clickTestId(page, 'packages-new');
  await fillHostInput(page, 'package-name', packageName);
  await clickTestId(page, 'package-save');
  await expectToast(page, /already exists|ข้อผิดพลาด|Error/i);
  await expect(page).toHaveURL(/\/backoffice\/packages\/new/);
});

test('edits a package name and price', async ({ page }) => {
  await openPackagesPage(page);
  await searchList(page, 'packages-search', 'packages-search-btn', packageName);
  await openRowByText(page, packageName);
  await expect(page.getByRole('heading', { name: 'แก้ไขแพ็กเกจ' })).toBeVisible();
  await fillHostInput(page, 'package-name', editedName);
  await fillHostInput(page, 'package-price', '299');
  await clickTestId(page, 'package-save');
  await expectToast(page, 'บันทึกแพ็กเกจแล้ว');
  await openPackagesPage(page);
  await searchList(page, 'packages-search', 'packages-search-btn', editedName);
  await expect(page.getByRole('cell', { name: editedName })).toBeVisible();
});

test('cancels deleting a package', async ({ page }) => {
  await openPackagesPage(page);
  await searchList(page, 'packages-search', 'packages-search-btn', editedName);
  await page
    .getByRole('row', { name: new RegExp(editedName) })
    .first()
    .getByRole('button', { name: 'ลบ' })
    .click();
  await dialogReject(page);
  await expect(page.getByRole('cell', { name: editedName })).toBeVisible();
});

test('deletes a package', async ({ page }) => {
  await openPackagesPage(page);
  await searchList(page, 'packages-search', 'packages-search-btn', editedName);
  await deleteRowByText(page, editedName);
  await expectToast(page, 'ลบแพ็กเกจแล้ว');
  await searchList(page, 'packages-search', 'packages-search-btn', editedName);
  await expect(page.getByRole('cell', { name: editedName })).toHaveCount(0);
});
