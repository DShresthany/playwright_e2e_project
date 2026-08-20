// spec: specs/ecommerce-product.md
import { test, expect } from '../../../src/fixtures/base';

test.describe('Product detail', { tag: '@product' }, () => {
  test('pdp-shows-name-price-image-description', { tag: ['@smoke', '@critical'] }, async ({
    catalogPage,
    productPage,
  }) => {
    let expectedName: string;
    let expectedPrice: string;

    await test.step('Arrange: open in-stock PDP from catalog', async () => {
      await catalogPage.goto();
      const card = await catalogPage.findInStockCard();
      expectedName = card.name;
      expectedPrice = card.price;
      await catalogPage.productLink(card.id).click();
      await expect(productPage.productPage, {
        message: 'Precondition Failed: in-stock PDP should load',
      }).toBeVisible();
      const stock = await productPage.parseInStockCount();
      if (stock < 10) {
        throw new Error(`Precondition Failed: expected stock ≥ 10, got ${stock}`);
      }
    });

    await test.step('Assert: details, in-stock copy, Add enabled, no overlays', async () => {
      await expect(productPage.name).toHaveText(expectedName);
      await expect(productPage.price).toHaveText(expectedPrice);
      await expect(productPage.image).toBeVisible();
      await expect(productPage.description).toBeVisible();
      await expect(productPage.inStockText).toBeVisible();
      await expect(productPage.addToCartButton).toBeEnabled();
      await expect(productPage.onlyNLeftText).toHaveCount(0);
      await expect(productPage.outOfStockText).toHaveCount(0);
    });
  });

  test('pdp-low-stock-shows-overlay-and-stock-badge', { tag: ['@critical'] }, async ({
    catalogPage,
    productPage,
    page,
  }) => {
    await catalogPage.goto();
    const card = await catalogPage.findLowStockCard();
    await catalogPage.productLink(card.id).click();

    await expect(page).toHaveURL(/\/products\//);
    await expect(productPage.productPage).toBeVisible();
    await expect(productPage.onlyNLeftText).toBeVisible();
    await expect(productPage.inStockText).toBeVisible();

    const overlayN = await productPage.parseOnlyNLeftCount();
    const detailN = await productPage.parseInStockCount();
    expect(overlayN).toBe(detailN);
    await expect(productPage.addToCartButton).toBeEnabled();
  });

  test('pdp-out-of-stock-add-disabled', { tag: ['@critical'] }, async ({ catalogPage, productPage }) => {
    await catalogPage.goto();
    const card = await catalogPage.findOutOfStockCard();
    await catalogPage.productLink(card.id).click();

    await expect(productPage.productPage).toBeVisible();
    await expect(productPage.outOfStockText).toHaveCount(2);
    await expect(productPage.addToCartButton).toBeDisabled();
    await expect(productPage.viewCartButton).toHaveCount(0);
  });

  test('pdp-back-to-catalog', { tag: ['@critical'] }, async ({ catalogPage, productPage, page }) => {
    await catalogPage.goto();
    const card = await catalogPage.findInStockCard();
    await catalogPage.productLink(card.id).click();
    await expect(productPage.productPage, {
      message: 'Precondition Failed: PDP should load before Back to Catalog',
    }).toBeVisible();

    await productPage.backToCatalogLink.click();

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(catalogPage.catalogPage).toBeVisible();
    await expect(catalogPage.productGrid).toBeVisible();
  });

  test('pdp-deep-link-by-slug', { tag: ['@critical'] }, async ({ productPage, page }) => {
    await productPage.gotoSlug('power-bank');

    await expect(page).toHaveURL(/\/products\/power-bank$/);
    await expect(productPage.name).toHaveText('Power Bank');
    await expect(productPage.price).toHaveText('$59.99');
  });

  test('guest-pdp-add-persists', { tag: ['@smoke', '@critical'] }, async ({
    catalogPage,
    productPage,
    page,
  }) => {
    let stockBefore: string;

    await test.step('Arrange: open in-stock PDP', async () => {
      await catalogPage.goto();
      const card = await catalogPage.findInStockCard();
      await catalogPage.productLink(card.id).click();
      await expect(productPage.addToCartButton, {
        message: 'Precondition Failed: guest PDP Add should be enabled',
      }).toBeEnabled();
      stockBefore = await productPage.inStockCopy();
    });

    await test.step('Act: Add and reload', async () => {
      await productPage.addToCart();
      await expect(productPage.removeFromCartButton).toHaveText(/In Cart \(1\)/);
      await expect(productPage.cartBadge).toHaveText('1');
      await page.reload();
      await expect(productPage.productPage).toBeVisible();
    });

    await test.step('Assert: In Cart (1) persists; stock unchanged', async () => {
      await expect(productPage.removeFromCartButton).toHaveText(/In Cart \(1\)/);
      await expect(productPage.viewCartButton).toBeVisible();
      await expect(productPage.cartBadge).toHaveText('1');
      await expect(productPage.inStockText).toHaveText(stockBefore);
    });
  });
});
