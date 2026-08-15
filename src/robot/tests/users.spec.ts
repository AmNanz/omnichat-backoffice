import { expect, test } from '@playwright/test';
import { login, logout } from './helpers/auth';
import {
  clickTestId,
  dialogAccept,
  expectToast,
  fillHostInput,
  searchList,
  selectOption,
} from './helpers/forms';
import { openRowByText, openUsersPage } from './helpers/nav';
import { uniqueEmail, uniqueLabel } from './helpers/unique';

test.describe.configure({ mode: 'serial' });

const displayName = uniqueLabel('PW User');
const editedName = `${displayName} edited`;
const email = uniqueEmail();
const password = 'Passw0rd!';

test.beforeEach(async ({ page }) => {
  await page.goto('/backoffice/dashboard');
});

test('lists users from the Users menu', async ({ page }) => {
  await openUsersPage(page);
  await expect(page.getByTestId('users-new')).toBeVisible();
  await expect(
    page.locator('p-table, app-empty-state').first(),
  ).toBeVisible();
});

test('does not create a user with invalid fields', async ({ page }) => {
  await openUsersPage(page);
  await clickTestId(page, 'users-new');
  await expect(page.getByRole('heading', { name: 'เพิ่มผู้ใช้' })).toBeVisible();
  await fillHostInput(page, 'user-display-name', 'A');
  await fillHostInput(page, 'user-email', 'not-an-email');
  await fillHostInput(page, 'user-password', '123');
  await clickTestId(page, 'user-save');
  await expect(page).toHaveURL(/\/backoffice\/users\/new/);
});

test('creates a staff user with a role', async ({ page }) => {
  await openUsersPage(page);
  await clickTestId(page, 'users-new');
  await fillHostInput(page, 'user-display-name', displayName);
  await fillHostInput(page, 'user-email', email);
  await fillHostInput(page, 'user-password', password);
  await selectOption(page, 'user-role', 'Admin');
  await clickTestId(page, 'user-save');
  await expectToast(page, 'สร้างผู้ใช้แล้ว');
  await expect(page).toHaveURL(/\/backoffice\/users\/(?!new$)[^/]+/);
  await expect(page.getByRole('heading', { name: 'แก้ไขผู้ใช้' })).toBeVisible();
});

test('rejects a duplicate email', async ({ page }) => {
  await openUsersPage(page);
  await clickTestId(page, 'users-new');
  await fillHostInput(page, 'user-display-name', uniqueLabel('PW Dup'));
  await fillHostInput(page, 'user-email', email);
  await fillHostInput(page, 'user-password', password);
  await selectOption(page, 'user-role', 'Admin');
  await clickTestId(page, 'user-save');
  await expectToast(page, /already registered|ข้อผิดพลาด|Error/i);
  await expect(page).toHaveURL(/\/backoffice\/users\/new/);
});

test('edits display name', async ({ page }) => {
  await openUsersPage(page);
  await searchList(page, 'users-search', 'users-search-btn', email);
  await openRowByText(page, displayName);
  await fillHostInput(page, 'user-display-name', editedName);
  await clickTestId(page, 'user-save');
  await expectToast(page, 'บันทึกผู้ใช้แล้ว');
  await openUsersPage(page);
  await searchList(page, 'users-search', 'users-search-btn', editedName);
  await expect(page.getByRole('cell', { name: editedName })).toBeVisible();
});

test('resets a user password', async ({ page }) => {
  await openUsersPage(page);
  await searchList(page, 'users-search', 'users-search-btn', email);
  await openRowByText(page, editedName);
  await clickTestId(page, 'user-reset-password');
  await fillHostInput(page, 'user-reset-new-password', 'NewPass1');
  await page.getByRole('button', { name: 'รีเซ็ต', exact: true }).click();
  await expectToast(page, 'รีเซ็ตรหัสผ่านแล้ว');
});

test('suspends a user and blocks login', async ({ page }) => {
  await openUsersPage(page);
  await searchList(page, 'users-search', 'users-search-btn', email);
  await openRowByText(page, editedName);
  await clickTestId(page, 'user-suspend');
  await dialogAccept(page);
  await expectToast(page, 'ระงับผู้ใช้แล้ว');
  await logout(page);
  await login(page, email, 'NewPass1');
  await expectToast(page, /เข้าสู่ระบบไม่สำเร็จ|not active|inactive|ข้อผิดพลาด|Error/i);
  await expect(page).toHaveURL(/\/login/);
  await login(page);
  await page.waitForURL(/\/backoffice/);
});

test('activates a user', async ({ page }) => {
  await openUsersPage(page);
  await searchList(page, 'users-search', 'users-search-btn', email);
  await openRowByText(page, editedName);
  await clickTestId(page, 'user-activate');
  await expectToast(page, 'เปิดใช้งานผู้ใช้แล้ว');
  await expect(page.getByTestId('user-suspend')).toBeVisible();
});

test('deletes a user', async ({ page }) => {
  await openUsersPage(page);
  await searchList(page, 'users-search', 'users-search-btn', email);
  await openRowByText(page, editedName);
  await clickTestId(page, 'user-delete');
  await dialogAccept(page);
  await expectToast(page, 'ลบผู้ใช้แล้ว');
  await expect(page).toHaveURL(/\/backoffice\/users$/);
  await searchList(page, 'users-search', 'users-search-btn', email);
  await expect(page.getByRole('cell', { name: email })).toHaveCount(0);
});
