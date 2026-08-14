// spec: specs/ecommerce-login.md
// scenario: 1.1. standard-user-successful-login
import { test, expect } from '../../src/fixtures/base';

function requireStandardCredentials(): { username: string; password: string } {
  const username = process.env.STANDARD_USER;
  const password = process.env.STANDARD_PASSWORD;
  if (!username || !password) {
    throw new Error('STANDARD_USER and STANDARD_PASSWORD must be set');
  }
  return { username, password };
}

test.describe('Login', () => {
  test('standard-user-successful-login', { tag: ['@smoke', '@critical'] }, async ({ loginPage, catalogPage, page }) => {
    const { username, password } = requireStandardCredentials();

    // 1. Confirm the login form is visible
    await loginPage.goto();
    await expect(loginPage.loginPage).toBeVisible();
    await expect(loginPage.loginForm).toBeVisible();
    await expect(loginPage.heading).toHaveText('Welcome Back');
    await loginPage.login(username, password);

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(catalogPage.catalogPage).toBeVisible();
    await expect(catalogPage.heading).toHaveText('Product Catalog');
    await expect(catalogPage.navbarUsername).toHaveText(username);
    await expect(catalogPage.logoutButton).toBeVisible();
    await expect(catalogPage.adminLink).toHaveCount(0);
  });
});
