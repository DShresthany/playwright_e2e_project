// spec: specs/ecommerce-product.md
import { test, expect } from '../../../src/fixtures/base';
import { clearCartViaApi } from '../../../src/helpers/cart';
import type { CatalogCard } from '../../../src/pages/CatalogPage';

test.describe('Product detail cart', { tag: '@product' }, () => {
  test.beforeEach(async ({ catalogPage, page, request }) => {
    await catalogPage.goto();
    await clearCartViaApi(page, request);
  });

  test('pdp-add-shows-in-cart-and-view-cart', { tag: ['@smoke', '@critical'] }, async ({
    catalogPage,
    productPage,
  }) => {
    let stockBefore: string;
    let overlayBefore: number;

    await test.step('Arrange: open in-stock PDP', async () => {
      const card = await catalogPage.findInStockCard();
      await catalogPage.productLink(card.id).click();
      await expect(productPage.addToCartButton, {
        message: 'Precondition Failed: PDP Add should be enabled on empty cart',
      }).toBeEnabled();
      stockBefore = await productPage.inStockCopy();
      overlayBefore = await productPage.onlyNLeftText.count();
    });

    await test.step('Act: Add on PDP', async () => {
      await productPage.addToCart();
    });

    await test.step('Assert: In Cart (1), View Cart, badge 1, stock unchanged', async () => {
      await expect(productPage.addToCartButton).toHaveCount(0);
      await expect(productPage.removeFromCartButton).toHaveText(/In Cart \(1\)/);
      await expect(productPage.viewCartButton).toBeVisible();
      await expect(productPage.cartBadge).toHaveText('1');
      await expect(productPage.inStockText).toHaveText(stockBefore);
      await expect(productPage.onlyNLeftText).toHaveCount(overlayBefore);
    });
  });

  test('pdp-remove-restores-add', { tag: ['@critical'] }, async ({ catalogPage, productPage }) => {
    let stockBefore: string;
    let overlayBefore: number;

    await test.step('Arrange: open PDP and capture stock', async () => {
      const card = await catalogPage.findEnabledAddCard();
      await catalogPage.productLink(card.id).click();
      await expect(productPage.addToCartButton, {
        message: 'Precondition Failed: PDP Add should be enabled on empty cart',
      }).toBeEnabled();
      stockBefore = await productPage.inStockCopy();
      overlayBefore = await productPage.onlyNLeftText.count();
    });

    await test.step('Act: Add then Remove', async () => {
      await productPage.addToCart();
      await expect(productPage.removeFromCartButton, {
        message: 'Precondition Failed: PDP should show In Cart after Add',
      }).toHaveText(/In Cart \(1\)/);
      await productPage.removeFromCartButton.click();
    });

    await test.step('Assert: Add restored; View Cart and badge gone; stock unchanged', async () => {
      await expect(productPage.addToCartButton).toBeVisible();
      await expect(productPage.addToCartButton).toBeEnabled();
      await expect(productPage.viewCartButton).toHaveCount(0);
      await expect(productPage.cartBadge).toHaveCount(0);
      await expect(productPage.inStockText).toHaveText(stockBefore);
      await expect(productPage.onlyNLeftText).toHaveCount(overlayBefore);
    });
  });

  test('pdp-view-cart-navigates-to-cart', { tag: ['@critical'] }, async ({
    catalogPage,
    productPage,
    cartPage,
    page,
  }) => {
    let card: CatalogCard;

    await test.step('Arrange: open in-stock PDP and Add', async () => {
      card = await catalogPage.findInStockCard();
      await catalogPage.productLink(card.id).click();
      await productPage.addToCart();
      await expect(productPage.viewCartButton, {
        message: 'Precondition Failed: View Cart should appear after PDP Add',
      }).toBeVisible();
    });

    await test.step('Act: View Cart', async () => {
      await productPage.viewCartButton.click();
    });

    await test.step('Assert: cart page shows that line', async () => {
      await expect(page).toHaveURL(/\/cart$/);
      await expect(cartPage.cartPage).toBeVisible();
      await expect(cartPage.item(card.id)).toBeVisible();
      await expect(cartPage.itemName(card.id)).toHaveText(card.name);
    });
  });

  test('pdp-add-reflects-on-catalog-card', { tag: ['@critical'] }, async ({
    catalogPage,
    productPage,
  }) => {
    let card: CatalogCard;

    await test.step('Arrange: Add on in-stock PDP', async () => {
      card = await catalogPage.findInStockCard();
      await catalogPage.productLink(card.id).click();
      await productPage.addToCart();
      await expect(productPage.removeFromCartButton, {
        message: 'Precondition Failed: PDP should show In Cart after Add',
      }).toHaveText(/In Cart \(1\)/);
    });

    await test.step('Act: return to catalog', async () => {
      await catalogPage.goto();
    });

    await test.step('Assert: same card shows In Cart actions', async () => {
      await expect(catalogPage.inCartActions(card.id)).toBeVisible();
      await expect(catalogPage.removeFromCartButton(card.id)).toBeVisible();
      await expect(catalogPage.goToCartButton(card.id)).toBeVisible();
      await expect(catalogPage.addToCartButton(card.id)).toHaveCount(0);
    });
  });

  test('pdp-in-cart-qty-matches-cart-increase', { tag: ['@critical'] }, async ({
    catalogPage,
    productPage,
    cartPage,
    page,
  }) => {
    let card: CatalogCard;
    let stockBefore: string;
    let pdpPath: string;

    await test.step('Arrange: Add on PDP then increase qty on cart', async () => {
      card = await catalogPage.findInStockCard();
      await catalogPage.productLink(card.id).click();
      stockBefore = await productPage.inStockCopy();
      pdpPath = new URL(page.url()).pathname;
      await productPage.addToCart();
      await expect(productPage.removeFromCartButton, {
        message: 'Precondition Failed: PDP should show In Cart (1) after Add',
      }).toHaveText(/In Cart \(1\)/);
      await productPage.viewCartButton.click();
      await expect(cartPage.item(card.id), {
        message: 'Precondition Failed: cart should contain the PDP product',
      }).toBeVisible();
      await cartPage.increaseButton(card.id).click();
      await expect(cartPage.itemQuantity(card.id), {
        message: 'Precondition Failed: cart quantity should be 2 after increase',
      }).toHaveText('2');
    });

    await test.step('Act: return to PDP', async () => {
      await page.goto(pdpPath);
      await expect(productPage.productPage).toBeVisible();
    });

    await test.step('Assert: In Cart (2), badge 2, stock unchanged', async () => {
      await expect(productPage.removeFromCartButton).toHaveText(/In Cart \(2\)/);
      await expect(productPage.cartBadge).toHaveText('2');
      await expect(productPage.inStockText).toHaveText(stockBefore);
    });
  });
});
