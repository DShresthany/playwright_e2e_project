// spec: specs/ecommerce-cart.md
import { test, expect } from '../../../src/fixtures/base';
import { clearCartViaApi } from '../../../src/helpers/cart';
import type { CatalogCard } from '../../../src/pages/CatalogPage';

function parsePrice(text: string): number {
  return Number(text.replace(/[^0-9.]/g, ''));
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

test.describe('Cart', { tag: '@cart' }, () => {
  test.beforeEach(async ({ catalogPage, page, request }) => {
    await catalogPage.goto();
    await clearCartViaApi(page, request);
  });

  test('empty-cart-after-clear', { tag: ['@smoke', '@critical'] }, async ({ cartPage }) => {
    expect(true).toBe(false);
    await cartPage.goto();

    await expect(cartPage.emptyState).toBeVisible();
    await expect(cartPage.emptyHeading).toHaveText('Your cart is empty');
    await expect(cartPage.itemsList).toHaveCount(0);
    await expect(cartPage.cartBadge).toHaveCount(0);
  });

  test('filled-cart-shows-line-and-summary', { tag: ['@smoke', '@critical'] }, async ({ catalogPage, cartPage, page }) => {
    let card: CatalogCard;

    await test.step('Arrange: add one in-stock product from catalog', async () => {
      card = await catalogPage.addEnabledProductToCart();
    });

    await test.step('Act: open cart', async () => {
      await catalogPage.cartLink.click();
    });

    await test.step('Assert: line, summary, and badge', async () => {
      await expect(page).toHaveURL(/\/cart$/);
      await expect(cartPage.heading).toHaveText('Shopping Cart');
      await expect(cartPage.itemCount).toContainText('1');
      await expect(cartPage.item(card.id)).toBeVisible();
      await expect(cartPage.itemName(card.id)).toHaveText(card.name);
      await expect(cartPage.itemPrice(card.id)).toHaveText(card.price);
      await expect(cartPage.itemQuantity(card.id)).toHaveText('1');
      await expect(cartPage.itemSubtotal(card.id)).toHaveText(card.price);
      await expect(cartPage.orderSummaryHeading).toBeVisible();
      await expect(cartPage.orderSubtotal).toHaveText(card.price);
      await expect(cartPage.orderShipping).toHaveText('Free');
      await expect(cartPage.orderTotal).toHaveText(card.price);
      await expect(cartPage.cartBadge).toHaveText('1');
      await expect(cartPage.checkoutButton).toBeVisible();
    });
  });

  test('increase-quantity-updates-totals-and-badge', { tag: ['@critical'] }, async ({ catalogPage, cartPage }) => {
    let card: CatalogCard;
    let doubled: string;

    await test.step('Arrange: one line at qty 1', async () => {
      card = await catalogPage.addEnabledProductToCart();
      await catalogPage.cartLink.click();
      await expect(cartPage.itemQuantity(card.id), { message: 'Precondition Failed: line quantity should be 1' }).toHaveText('1');
      await expect(cartPage.cartBadge, { message: 'Precondition Failed: badge should be 1' }).toHaveText('1');
      await expect(cartPage.decreaseButton(card.id), { message: 'Precondition Failed: decrease should be disabled at qty 1' }).toBeDisabled();
      doubled = formatPrice(parsePrice(card.price) * 2);
    });

    await test.step('Act: increase quantity', async () => {
      await cartPage.increaseButton(card.id).click();
    });

    await test.step('Assert: qty, totals, and badge are 2', async () => {
      await expect(cartPage.itemQuantity(card.id)).toHaveText('2');
      await expect(cartPage.itemSubtotal(card.id)).toHaveText(doubled);
      await expect(cartPage.orderSubtotal).toHaveText(doubled);
      await expect(cartPage.orderTotal).toHaveText(doubled);
      await expect(cartPage.cartBadge).toHaveText('2');
      await expect(cartPage.decreaseButton(card.id)).toBeEnabled();
    });
  });

  test('decrease-quantity-disabled-at-one', { tag: ['@critical'] }, async ({ catalogPage, cartPage }) => {
    let card: CatalogCard;

    await test.step('Arrange: raise quantity to 2', async () => {
      card = await catalogPage.addEnabledProductToCart();
      await catalogPage.cartLink.click();
      await cartPage.increaseButton(card.id).click();
      await expect(cartPage.itemQuantity(card.id), { message: 'Precondition Failed: quantity should be 2 before decrease' }).toHaveText('2');
      await expect(cartPage.cartBadge, { message: 'Precondition Failed: badge should be 2 before decrease' }).toHaveText('2');
    });

    await test.step('Act: decrease quantity', async () => {
      await cartPage.decreaseButton(card.id).click();
    });

    await test.step('Assert: qty 1, badge 1, decrease disabled', async () => {
      await expect(cartPage.itemQuantity(card.id)).toHaveText('1');
      await expect(cartPage.itemSubtotal(card.id)).toHaveText(card.price);
      await expect(cartPage.orderSubtotal).toHaveText(card.price);
      await expect(cartPage.orderTotal).toHaveText(card.price);
      await expect(cartPage.cartBadge).toHaveText('1');
      await expect(cartPage.decreaseButton(card.id)).toBeDisabled();
    });
  });

  test('increase-disabled-at-product-stock', { tag: ['@critical'] }, async ({ catalogPage, productPage, cartPage }) => {
    let id: string;
    let stock: number;

    await test.step('Arrange: seed low-stock product and read stock N from PDP', async () => {
      const card = await catalogPage.findLowStockCard();
      id = card.id;
      await catalogPage.productLink(id).click();
      await expect(productPage.productPage, { message: 'Precondition Failed: PDP should open for low-stock product' }).toBeVisible();
      stock = await productPage.parseInStockCount();
      if (stock < 1) {
        throw new Error('Precondition Failed: low-stock PDP stock count should be at least 1');
      }
      await catalogPage.goto();
      await catalogPage.addToCartButton(id).click();
      await expect(catalogPage.inCartActions(id), { message: 'Precondition Failed: catalog Add should show In Cart' }).toBeVisible();
      await catalogPage.cartLink.click();
    });

    await test.step('Act: increase until quantity equals stock', async () => {
      for (let qty = 1; qty < stock; qty++) {
        await cartPage.increaseButton(id).click();
      }
    });

    await test.step('Assert: increase disabled at N and badge is N', async () => {
      await expect(cartPage.itemQuantity(id)).toHaveText(String(stock));
      await expect(cartPage.increaseButton(id)).toBeDisabled();
      await expect(cartPage.cartBadge).toHaveText(String(stock));
    });
  });

  test('remove-line-at-qty-one-shows-empty', { tag: ['@critical'] }, async ({ catalogPage, cartPage }) => {
    let card: CatalogCard;

    await test.step('Arrange: one line at qty 1', async () => {
      card = await catalogPage.addEnabledProductToCart();
      await catalogPage.cartLink.click();
    });

    await test.step('Act: remove the line', async () => {
      await cartPage.removeButton(card.id).click();
    });

    await test.step('Assert: empty cart and no badge', async () => {
      await expect(cartPage.emptyState).toBeVisible();
      await expect(cartPage.item(card.id)).toHaveCount(0);
      await expect(cartPage.cartBadge).toHaveCount(0);
    });
  });

  test('clear-cart-button-empties-cart', { tag: ['@critical'] }, async ({ catalogPage, cartPage }) => {
    await test.step('Arrange: filled cart', async () => {
      await catalogPage.addEnabledProductToCart();
      await catalogPage.cartLink.click();
      await expect(cartPage.clearCartButton, { message: 'Precondition Failed: Clear Cart should be visible on a filled cart' }).toBeVisible();
    });

    await test.step('Act: click Clear Cart', async () => {
      await cartPage.clearCartButton.click();
    });

    await test.step('Assert: empty cart and no badge', async () => {
      await expect(cartPage.emptyState).toBeVisible();
      await expect(cartPage.itemsList).toHaveCount(0);
      await expect(cartPage.cartBadge).toHaveCount(0);
    });
  });

  test('continue-shopping-from-filled-cart', { tag: ['@critical'] }, async ({ catalogPage, cartPage, page }) => {
    await test.step('Arrange: filled cart', async () => {
      await catalogPage.addEnabledProductToCart();
      await catalogPage.cartLink.click();
    });

    await test.step('Act: continue shopping from summary', async () => {
      await cartPage.continueShoppingLinkButton.click();
    });

    await test.step('Assert: catalog', async () => {
      await expect(page).toHaveURL(/\/catalog$/);
      await expect(catalogPage.catalogPage).toBeVisible();
    });
  });

  test('proceed-to-checkout-authenticated', { tag: ['@critical'] }, async ({ catalogPage, cartPage, page }) => {
    await test.step('Arrange: filled cart', async () => {
      await catalogPage.addEnabledProductToCart();
      await catalogPage.cartLink.click();
    });

    await test.step('Act: proceed to checkout', async () => {
      await cartPage.checkoutButton.click();
    });

    await test.step('Assert: checkout landing', async () => {
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(cartPage.checkoutPage).toBeVisible();
      await expect(cartPage.checkoutHeading).toHaveText('Checkout');
    });
  });

  test('two-products-then-remove-one', { tag: ['@critical'] }, async ({ catalogPage, cartPage }) => {
    let productA: CatalogCard;
    let productB: CatalogCard;
    let expectedTotal: string;

    await test.step('Arrange: add two distinct in-stock products', async () => {
      productA = await catalogPage.addEnabledProductToCart();
      productB = await catalogPage.addEnabledProductToCart([productA.id]);
      expectedTotal = formatPrice(parsePrice(productA.price) + parsePrice(productB.price));
      await catalogPage.cartLink.click();
    });

    await test.step('Assert: two lines, summed totals, badge 2', async () => {
      await expect(cartPage.item(productA.id)).toBeVisible();
      await expect(cartPage.item(productB.id)).toBeVisible();
      await expect(cartPage.itemCount).toContainText('2');
      await expect(cartPage.itemName(productA.id)).toHaveText(productA.name);
      await expect(cartPage.itemPrice(productA.id)).toHaveText(productA.price);
      await expect(cartPage.itemQuantity(productA.id)).toHaveText('1');
      await expect(cartPage.itemSubtotal(productA.id)).toHaveText(productA.price);
      await expect(cartPage.itemName(productB.id)).toHaveText(productB.name);
      await expect(cartPage.itemPrice(productB.id)).toHaveText(productB.price);
      await expect(cartPage.itemQuantity(productB.id)).toHaveText('1');
      await expect(cartPage.itemSubtotal(productB.id)).toHaveText(productB.price);
      await expect(cartPage.orderSubtotal).toHaveText(expectedTotal);
      await expect(cartPage.orderTotal).toHaveText(expectedTotal);
      await expect(cartPage.cartBadge).toHaveText('2');
    });

    await test.step('Act: remove one line', async () => {
      await cartPage.removeButton(productA.id).click();
    });

    await test.step('Assert: other line remains', async () => {
      await expect(cartPage.item(productA.id)).toHaveCount(0);
      await expect(cartPage.item(productB.id)).toBeVisible();
      await expect(cartPage.emptyState).toHaveCount(0);
      await expect(cartPage.itemCount).toContainText('1');
      await expect(cartPage.cartBadge).toHaveText('1');
    });
  });

  test('remove-line-at-qty-greater-than-one', { tag: ['@critical'] }, async ({ catalogPage, cartPage }) => {
    let card: CatalogCard;

    await test.step('Arrange: one line at qty 2', async () => {
      card = await catalogPage.addEnabledProductToCart();
      await catalogPage.cartLink.click();
      await cartPage.increaseButton(card.id).click();
      await expect(cartPage.itemQuantity(card.id), { message: 'Precondition Failed: quantity should be 2 before remove' }).toHaveText('2');
      await expect(cartPage.cartBadge, { message: 'Precondition Failed: badge should be 2 before remove' }).toHaveText('2');
    });

    await test.step('Act: remove the entire line', async () => {
      await cartPage.removeButton(card.id).click();
    });

    await test.step('Assert: line gone, empty cart, no badge', async () => {
      await expect(cartPage.item(card.id)).toHaveCount(0);
      await expect(cartPage.emptyState).toBeVisible();
      await expect(cartPage.cartBadge).toHaveCount(0);
    });
  });

  test('cart-line-name-opens-pdp', { tag: ['@critical'] }, async ({ catalogPage, cartPage, productPage, page }) => {
    let card: CatalogCard;

    await test.step('Arrange: one line on /cart', async () => {
      card = await catalogPage.addEnabledProductToCart();
      await catalogPage.cartLink.click();
      await expect(cartPage.item(card.id), { message: 'Precondition Failed: seeded product should appear on /cart' }).toBeVisible();
    });

    await test.step('Act: click cart line name', async () => {
      await cartPage.itemName(card.id).click();
    });

    await test.step('Assert: PDP matches the cart line', async () => {
      await expect(page).toHaveURL(/\/products\//);
      await expect(productPage.productPage).toBeVisible();
      await expect(productPage.name).toHaveText(card.name);
      await expect(productPage.price).toHaveText(card.price);
    });
  });

  test('cart-line-image-opens-pdp', { tag: ['@critical'] }, async ({ catalogPage, cartPage, productPage, page }) => {
    let card: CatalogCard;

    await test.step('Arrange: one line on /cart', async () => {
      card = await catalogPage.addEnabledProductToCart();
      await catalogPage.cartLink.click();
      await expect(cartPage.item(card.id), { message: 'Precondition Failed: seeded product should appear on /cart' }).toBeVisible();
    });

    await test.step('Act: click cart line image', async () => {
      await cartPage.itemImageLink(card.id).click();
    });

    await test.step('Assert: PDP matches the cart line', async () => {
      await expect(page).toHaveURL(/\/products\//);
      await expect(productPage.productPage).toBeVisible();
      await expect(productPage.name).toHaveText(card.name);
      await expect(productPage.price).toHaveText(card.price);
    });
  });

  test('filled-cart-survives-reload', { tag: ['@critical'] }, async ({ catalogPage, cartPage, page }) => {
    let card: CatalogCard;

    await test.step('Arrange: add one in-stock product on catalog', async () => {
      card = await catalogPage.addEnabledProductToCart();
    });

    await test.step('Act: reload catalog, then cart', async () => {
      await page.reload();
      await expect(catalogPage.inCartActions(card.id), { message: 'Precondition Failed: catalog In Cart should persist after reload' }).toBeVisible();
      await catalogPage.cartLink.click();
      await page.reload();
    });

    await test.step('Assert: cart line and badge persist', async () => {
      await expect(page).toHaveURL(/\/cart$/);
      await expect(cartPage.item(card.id)).toBeVisible();
      await expect(cartPage.itemName(card.id)).toHaveText(card.name);
      await expect(cartPage.itemQuantity(card.id)).toHaveText('1');
      await expect(cartPage.cartBadge).toHaveText('1');
    });
  });
});
