// spec: specs/ecommerce-catalog.md
import { test, expect } from '../../src/fixtures/base';
import { clearCartViaApi } from '../../src/helpers/cart';

test.describe('Catalog card cart', { tag: '@catalog' }, () => {
  test.beforeEach(async ({ catalogPage, page, request }) => {
    await catalogPage.goto();
    await clearCartViaApi(page, request);
  });

  test('catalog-card-add-shows-in-cart-actions', { tag: ['@critical'] }, async ({ catalogPage, page }) => {
    const { id } = await catalogPage.findEnabledAddCard();

    await catalogPage.addToCartButton(id).click();

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(catalogPage.inCartActions(id)).toBeVisible();
    await expect(catalogPage.removeFromCartButton(id)).toBeVisible();
    await expect(catalogPage.goToCartButton(id)).toBeVisible();
    await expect(catalogPage.goToCartButton(id)).toContainText('In Cart');
    await expect(catalogPage.addToCartButton(id)).toHaveCount(0);
  });

  test('catalog-card-remove-restores-add-button', { tag: ['@critical'] }, async ({ catalogPage }) => {
    const { id } = await catalogPage.findEnabledAddCard();

    await catalogPage.addToCartButton(id).click();
    await expect(catalogPage.inCartActions(id)).toBeVisible();
    await catalogPage.removeFromCartButton(id).click();

    await expect(catalogPage.addToCartButton(id)).toBeVisible();
    await expect(catalogPage.addToCartButton(id)).toBeEnabled();
    await expect(catalogPage.removeFromCartButton(id)).toHaveCount(0);
    await expect(catalogPage.inCartActions(id)).toHaveCount(0);
  });

  test('catalog-card-add-shows-navbar-badge-1', { tag: ['@critical'] }, async ({ catalogPage, page }) => {
    await expect(catalogPage.cartBadge).toHaveCount(0);
    const { id } = await catalogPage.findEnabledAddCard();

    await catalogPage.addToCartButton(id).click();

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(catalogPage.cartBadge).toHaveText('1');
  });

  test('catalog-card-in-cart-navigates-to-cart-page', { tag: ['@critical'] }, async ({ catalogPage, page }) => {
    const { id } = await catalogPage.findEnabledAddCard();

    await catalogPage.addToCartButton(id).click();
    await catalogPage.goToCartButton(id).click();

    await expect(page).toHaveURL(/\/cart$/);
    await expect(catalogPage.cartPage).toBeVisible();
  });
});
