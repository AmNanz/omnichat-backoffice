import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { loginAsAdmin } from './helpers/auth';

const authFile = path.join(__dirname, '../playwright/.auth/admin.json');

setup('authenticate admin', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await loginAsAdmin(page);
  await page.context().storageState({ path: authFile });
});
