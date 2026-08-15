import { Page } from '@playwright/test';

export async function fillHostInput(
  page: Page,
  testId: string,
  value: string,
): Promise<void> {
  const host = page.getByTestId(testId);
  const tag = await host.evaluate((el) => el.tagName.toLowerCase());
  if (tag === 'input' || tag === 'textarea') {
    await host.fill(value);
    return;
  }
  await host.locator('input').first().fill(value);
}

export async function clickTestId(page: Page, testId: string): Promise<void> {
  const host = page.getByTestId(testId);
  const button = host.locator('button').first();
  if ((await button.count()) > 0) {
    await button.click();
    return;
  }
  await host.click();
}

export async function selectOption(
  page: Page,
  testId: string,
  label: string,
): Promise<void> {
  await page.getByTestId(testId).click();
  await page.getByRole('option', { name: label }).click();
}

export async function dialogAccept(page: Page): Promise<void> {
  const dialog = page.getByRole('alertdialog', { name: 'ยืนยัน' });
  await dialog.waitFor({ state: 'visible' });
  await dialog.getByRole('button', { name: 'ใช่' }).click();
}

export async function dialogReject(page: Page): Promise<void> {
  const dialog = page.getByRole('alertdialog', { name: 'ยืนยัน' });
  await dialog.waitFor({ state: 'visible' });
  await dialog.getByRole('button', { name: 'ไม่' }).click();
}

export async function expectToast(
  page: Page,
  text: string | RegExp,
): Promise<void> {
  await page.locator('.p-toast-message').filter({ hasText: text }).first().waitFor({
    state: 'visible',
  });
}

export async function deleteRowByText(page: Page, text: string): Promise<void> {
  const row = page.getByRole('row', { name: new RegExp(text) }).first();
  await row.getByRole('button', { name: 'ลบ' }).click();
  await dialogAccept(page);
}

export async function searchList(
  page: Page,
  searchTestId: string,
  searchBtnTestId: string,
  query: string,
): Promise<void> {
  await fillHostInput(page, searchTestId, query);
  await clickTestId(page, searchBtnTestId);
}
