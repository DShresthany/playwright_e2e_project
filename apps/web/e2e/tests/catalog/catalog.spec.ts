// spec: specs/ecommerce-catalog.md
import { test, expect } from '../../src/fixtures/base';

test.describe('Catalog', { tag: '@catalog' }, () => {
  test('catalog-loads-heading-grid-and-count', { tag: ['@smoke', '@critical'] }, async ({ catalogPage, page }) => {
    await catalogPage.goto();

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(catalogPage.catalogPage).toBeVisible();
    await expect(catalogPage.heading).toHaveText('Product Catalog');
    await expect(catalogPage.productGrid).toBeVisible();

    const listed = await catalogPage.listedProductCount();
    await expect(catalogPage.productCards).toHaveCount(listed);
  });

  test('product-card-shows-name-price-image', { tag: ['@critical'] }, async ({ catalogPage }) => {
    await catalogPage.goto();
    const { id, name, price } = await catalogPage.findInStockCard();

    await expect(catalogPage.productName(id)).toHaveText(name);
    await expect(catalogPage.productPrice(id)).toHaveText(price);
    await expect(catalogPage.productImage(id)).toBeVisible();
  });

  test('product-link-opens-pdp-matching-card', { tag: ['@critical'] }, async ({ catalogPage, productPage, page }) => {
    await catalogPage.goto();
    const { id, name, price } = await catalogPage.findInStockCard();

    await catalogPage.productLink(id).click();

    await expect(page).toHaveURL(/\/products\//);
    await expect(productPage.productPage).toBeVisible();
    await expect(productPage.name).toHaveText(name);
    await expect(productPage.price).toHaveText(price);
  });

  test('in-stock-card-add-enabled-no-oos-badge', { tag: ['@critical'] }, async ({ catalogPage }) => {
    await catalogPage.goto();
    const { id } = await catalogPage.findInStockCard();

    await expect(catalogPage.addToCartButton(id)).toBeEnabled();
    await expect(catalogPage.outOfStockBadge(id)).toHaveCount(0);
    await expect(catalogPage.lowStockBadge(id)).toHaveCount(0);
  });

  test('out-of-stock-badge-and-add-disabled', { tag: ['@critical'] }, async ({ catalogPage }) => {
    await catalogPage.goto();
    const { id } = await catalogPage.findOutOfStockCard();

    await expect(catalogPage.outOfStockBadge(id)).toHaveText('Out of Stock');
    await expect(catalogPage.addToCartButton(id)).toBeDisabled();
    await expect(catalogPage.lowStockBadge(id)).toHaveCount(0);
  });

  test('low-stock-badge-and-add-enabled', { tag: ['@critical'] }, async ({ catalogPage }) => {
    await catalogPage.goto();
    const { id } = await catalogPage.findLowStockCard();

    await expect(catalogPage.lowStockBadge(id)).toHaveText('Low Stock');
    await expect(catalogPage.addToCartButton(id)).toBeEnabled();
    await expect(catalogPage.outOfStockBadge(id)).toHaveCount(0);
  });

  test('invalid-slug-shows-not-found-and-back-to-catalog', { tag: ['@critical'] }, async ({ catalogPage, productPage, page }) => {
    await productPage.gotoInvalidSlug();

    await expect(page).toHaveURL(/\/products\/no-such-product$/);
    await expect(productPage.notFound).toBeVisible();
    await expect(productPage.notFoundHeading).toHaveText('Product Not Found');

    await productPage.backToCatalogButton.click();

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(catalogPage.catalogPage).toBeVisible();
  });
});
