// spec: specs/ecommerce-cart.md
import { test, expect } from '../../../src/fixtures/base';
import { requireEnvCredentials } from '../../../src/helpers/credentials';
import type { CatalogCard } from '../../../src/pages/CatalogPage';

test.describe('Cart', { tag: '@cart' }, () => {
  test('guest-empty-cart-page', { tag: ['@smoke', '@critical'] }, async ({ cartPage, page }) => {
    await cartPage.goto();

    await expect(page).toHaveURL(/\/cart$/);
    await expect(cartPage.cartPage).toBeVisible();
    await expect(cartPage.emptyState).toBeVisible();
    await expect(cartPage.emptyHeading).toHaveText('Your cart is empty');
    await expect(cartPage.cartBadge).toHaveCount(0);
  });

  test('guest-empty-cart-continue-shopping', { tag: ['@critical'] }, async ({ cartPage, catalogPage, page }) => {
    await cartPage.goto();
    await cartPage.continueShoppingButton.click();

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(catalogPage.catalogPage).toBeVisible();
  });

  test('guest-proceed-to-checkout-redirects-to-login', { tag: ['@critical'] }, async ({ catalogPage, cartPage, loginPage, page }) => {
    let card: CatalogCard;

    await test.step('Arrange: seed one in-stock item from catalog card', async () => {
      await catalogPage.goto();
      card = await catalogPage.addEnabledProductToCart();
      await catalogPage.cartLink.click();
      await expect(cartPage.item(card.id), { message: 'Precondition Failed: seeded product should appear on /cart' }).toBeVisible();
    });

    await test.step('Act: proceed to checkout as guest', async () => {
      await cartPage.checkoutButton.click();
    });

    await test.step('Assert: redirected to login', async () => {
      await expect(page).toHaveURL(/\/login$/);
      await expect(loginPage.loginPage).toBeVisible();
    });
  });

  test('guest-checkout-login-returns-to-checkout', { tag: ['@critical'] }, async ({ catalogPage, cartPage, loginPage, page }) => {
    const { username, password } = requireEnvCredentials('STANDARD_USER', 'STANDARD_PASSWORD');
    let card: CatalogCard;

    await test.step('Arrange: seed cart and proceed to checkout as guest', async () => {
      await catalogPage.goto();
      card = await catalogPage.addEnabledProductToCart();
      await catalogPage.cartLink.click();
      await expect(cartPage.item(card.id), { message: 'Precondition Failed: seeded product should appear on /cart' }).toBeVisible();
      await cartPage.checkoutButton.click();
      await expect(page, { message: 'Precondition Failed: guest checkout should redirect to /login' }).toHaveURL(/\/login$/);
      await expect(loginPage.loginPage).toBeVisible();
    });

    await test.step('Act: log in as standard user', async () => {
      await loginPage.login(username, password);
    });

    await test.step('Assert: returned to checkout, not catalog', async () => {
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(cartPage.checkoutPage).toBeVisible();
      await expect(cartPage.checkoutHeading).toHaveText('Checkout');
    });
  });
});
