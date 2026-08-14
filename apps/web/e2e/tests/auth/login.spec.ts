// spec: specs/ecommerce-login.md
import { test, expect } from '../../src/fixtures/base';
import { requireEnvCredentials } from '../../src/helpers/credentials';

test.describe('Login', { tag: '@login' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard-user-successful-login', { tag: ['@smoke', '@critical'] }, async ({ loginPage, catalogPage, page }) => {
    const { username, password } = requireEnvCredentials('STANDARD_USER', 'STANDARD_PASSWORD');

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

  test('locked-user-shows-account-locked-error', { tag: ['@smoke', '@critical'] }, async ({ loginPage, catalogPage, page }) => {
    const { username, password } = requireEnvCredentials('LOCKED_USER', 'LOCKED_PASSWORD');

    await loginPage.login(username, password);

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText('Account is locked');
    await expect(catalogPage.catalogPage).toHaveCount(0);
  });

  test('admin-user-successful-login-shows-admin-link', { tag: ['@critical'] }, async ({ loginPage, catalogPage, page }) => {
    const { username, password } = requireEnvCredentials('ADMIN_USER', 'ADMIN_PASSWORD');

    await loginPage.login(username, password);

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(catalogPage.catalogPage).toBeVisible();
    await expect(catalogPage.heading).toHaveText('Product Catalog');
    await expect(catalogPage.navbarUsername).toHaveText(username);
    await expect(catalogPage.adminLink).toBeVisible();
    await expect(catalogPage.adminLink).toContainText('Admin');
    await expect(catalogPage.adminLink).toHaveAttribute('href', '/admin');
  });

  test('empty-username-submission', async ({ loginPage, page }) => {
    await loginPage.passwordInput.fill('x');
    await loginPage.submitButton.click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(loginPage.errorAlert).toHaveCount(0);
  });

  test('empty-password-submission', async ({ loginPage, page }) => {
    await loginPage.usernameInput.fill('foo');
    await loginPage.submitButton.click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(loginPage.errorAlert).toHaveCount(0);
  });

  test('invalid-credentials', { tag: '@critical' }, async ({ loginPage, catalogPage, page }) => {
    await loginPage.login('foo', 'bar');

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText('Invalid username or password');
    await expect(catalogPage.catalogPage).toHaveCount(0);
  });
});
