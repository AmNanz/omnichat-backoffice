import { expect, test } from '@playwright/test';
import {
  clickTestId,
  dialogAccept,
  dialogReject,
  expectToast,
  fillHostInput,
  searchList,
} from './helpers/forms';
import { openRolesPage, openRowByText } from './helpers/nav';
import { uniqueLabel } from './helpers/unique';

test.describe.configure({ mode: 'serial' });

const roleName = uniqueLabel('PW Role');
const editedName = `${roleName} edited`;

test.beforeEach(async ({ page }) => {
  await page.goto('/backoffice/dashboard');
});

test('lists roles from the Roles menu', async ({ page }) => {
  await openRolesPage(page);
  await expect(page.getByTestId('roles-new')).toBeVisible();
  await expect(
    page.locator('p-table, app-empty-state').first(),
  ).toBeVisible();
});

test('does not create a role with an empty name', async ({ page }) => {
  await openRolesPage(page);
  await clickTestId(page, 'roles-new');
  await expect(page.getByRole('heading', { name: 'เพิ่มบทบาท' })).toBeVisible();
  await clickTestId(page, 'role-save');
  await expect(page).toHaveURL(/\/backoffice\/roles\/new/);
});

test('creates a role with permissions', async ({ page }) => {
  await openRolesPage(page);
  await clickTestId(page, 'roles-new');
  await fillHostInput(page, 'role-name', roleName);
  await fillHostInput(page, 'role-description', 'Playwright role');
  await page.locator('.perm-module').first().waitFor();
  await page.getByRole('button', { name: 'เลือกทั้งหมด' }).click();
  await clickTestId(page, 'role-save');
  await expectToast(page, 'บันทึกบทบาทแล้ว');
  await expect(page).toHaveURL(/\/backoffice\/roles$/);
  await searchList(page, 'roles-search', 'roles-search-btn', roleName);
  await expect(page.getByRole('cell', { name: roleName })).toBeVisible();
});

test('rejects a duplicate role slug', async ({ page }) => {
  await openRolesPage(page);
  await clickTestId(page, 'roles-new');
  await fillHostInput(page, 'role-name', roleName);
  await page.locator('.perm-module').first().waitFor();
  await page.getByRole('button', { name: 'เลือกทั้งหมด' }).click();
  await clickTestId(page, 'role-save');
  await expectToast(page, /already exists|ข้อผิดพลาด|Error/i);
  await expect(page).toHaveURL(/\/backoffice\/roles\/new/);
});

test('edits a role name and description', async ({ page }) => {
  await openRolesPage(page);
  await searchList(page, 'roles-search', 'roles-search-btn', roleName);
  await openRowByText(page, roleName);
  await expect(page.getByRole('heading', { name: 'แก้ไขบทบาท' })).toBeVisible();
  await fillHostInput(page, 'role-name', editedName);
  await fillHostInput(page, 'role-description', 'Updated by Playwright');
  await clickTestId(page, 'role-save');
  await expectToast(page, 'บันทึกบทบาทแล้ว');
  await searchList(page, 'roles-search', 'roles-search-btn', editedName);
  await expect(page.getByRole('cell', { name: editedName })).toBeVisible();
});

test('suspends and activates a role', async ({ page }) => {
  await openRolesPage(page);
  await searchList(page, 'roles-search', 'roles-search-btn', editedName);
  await openRowByText(page, editedName);
  await clickTestId(page, 'role-suspend');
  await dialogAccept(page);
  await expectToast(page, 'ระงับบทบาทแล้ว');
  await expect(page.getByTestId('role-activate')).toBeVisible();
  await clickTestId(page, 'role-activate');
  await expectToast(page, 'เปิดใช้งานบทบาทแล้ว');
  await expect(page.getByTestId('role-suspend')).toBeVisible();
});

test('cancels deleting a role', async ({ page }) => {
  await openRolesPage(page);
  await searchList(page, 'roles-search', 'roles-search-btn', editedName);
  await openRowByText(page, editedName);
  await clickTestId(page, 'role-delete');
  await dialogReject(page);
  await expect(page).toHaveURL(/\/backoffice\/roles\/.+/);
  await expect(page.getByTestId('role-name')).toHaveValue(editedName);
});

test('deletes a role', async ({ page }) => {
  await openRolesPage(page);
  await searchList(page, 'roles-search', 'roles-search-btn', editedName);
  await openRowByText(page, editedName);
  await clickTestId(page, 'role-delete');
  await dialogAccept(page);
  await expectToast(page, 'ลบบทบาทแล้ว');
  await expect(page).toHaveURL(/\/backoffice\/roles$/);
  await searchList(page, 'roles-search', 'roles-search-btn', editedName);
  await expect(page.getByRole('cell', { name: editedName })).toHaveCount(0);
});
