// spec: specs/ecommerce-cart.md
import { test, expect } from '../../../src/fixtures/base';
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
});
