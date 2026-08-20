import { test as setup, expect } from '@playwright/test';
import { requireEnvCredentials } from '../src/helpers/credentials';

const standardFile = 'e2e/.auth/standard.json';
const adminFile = 'e2e/.auth/admin.json';

setup('authenticate as standard user', async ({ page }) => {
  const { username, password } = requireEnvCredentials('STANDARD_USER', 'STANDARD_PASSWORD');
  await page.goto('/login');
  await page.getByTestId('username-input').fill(username);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-submit-button').click();
  await expect(page).toHaveURL(/\/catalog/);
  await page.evaluate(() => {
    localStorage.removeItem('session_id');
    localStorage.removeItem('cart-storage');
  });
  await page.context().storageState({ path: standardFile });
});

setup('authenticate as admin user', async ({ page }) => {
  const { username, password } = requireEnvCredentials('ADMIN_USER', 'ADMIN_PASSWORD');
  await page.goto('/login');
  await page.getByTestId('username-input').fill(username);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-submit-button').click();
  await expect(page).toHaveURL(/\/catalog/);
  await page.evaluate(() => {
    localStorage.removeItem('session_id');
    localStorage.removeItem('cart-storage');
  });
  await page.context().storageState({ path: adminFile });
});
