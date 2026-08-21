// spec: specs/ecommerce-checkout.md
import { test, expect } from '../../../src/fixtures/base';
import { clearCartViaApi } from '../../../src/helpers/cart';
import type { CatalogCard } from '../../../src/pages/CatalogPage';

/** Webcam — high stock for parallel place-order (Core checkout strategy). */
const CHECKOUT_PRODUCT_ID = '10';

const SHIPPING = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  address: '123 Algorithm Ave',
};
const VALID_CARD = '4242424242424242';
const INVALID_LUHN_CARD = '4242424242424241';

test.describe('Checkout', { tag: '@checkout' }, () => {
  test.beforeEach(async ({ catalogPage, page, request }) => {
    await catalogPage.goto();
    await clearCartViaApi(page, request);
    await expect(catalogPage.navbarUsername, {
      message: 'Precondition Failed: standard_user should still be signed in after clearing cart',
    }).toBeVisible();
  });

  test('auth-empty-checkout-shows-empty-cart-ui', { tag: ['@critical'] }, async ({
    checkoutPage,
    catalogPage,
    page,
  }) => {
    await checkoutPage.gotoWhenSignedIn();

    await expect(page).toHaveURL(/\/checkout$/);
    await expect(checkoutPage.checkoutPage).toBeVisible();
    await expect(checkoutPage.emptyCart).toBeVisible();
    await expect(checkoutPage.emptyCart).toContainText('Your cart is empty');
    await expect(checkoutPage.continueShoppingButton).toBeVisible();
    await expect(checkoutPage.form).toHaveCount(0);
    await expect(checkoutPage.cartBadge).toHaveCount(0);

    await checkoutPage.continueShoppingButton.click();

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(catalogPage.catalogPage).toBeVisible();
  });

  test('filled-checkout-shows-form-and-webcam-summary', { tag: ['@critical'] }, async ({
    catalogPage,
    checkoutPage,
    page,
  }) => {
    let product: CatalogCard;

    await test.step('Arrange: seed checkout product qty 1', async () => {
      product = await catalogPage.addProductToCart(CHECKOUT_PRODUCT_ID);
    });

    await test.step('Act: open checkout', async () => {
      await checkoutPage.gotoWhenSignedIn();
    });

    await test.step('Assert: form, fields, and product summary — no submit', async () => {
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(checkoutPage.heading).toHaveText('Checkout');
      await expect(checkoutPage.form).toBeVisible();
      await expect(checkoutPage.shippingHeading).toHaveText('Shipping Information');
      await expect(checkoutPage.paymentHeading).toHaveText('Payment Information');
      await expect(checkoutPage.firstName).toBeVisible();
      await expect(checkoutPage.lastName).toBeVisible();
      await expect(checkoutPage.address).toBeVisible();
      await expect(checkoutPage.cardNumber).toBeVisible();
      await expect(checkoutPage.cardNumber).toHaveAttribute('placeholder', '4242 4242 4242 4242');
      await expect(checkoutPage.expiry).toBeVisible();
      await expect(checkoutPage.cvv).toBeVisible();
      await expect(checkoutPage.cardholderName).toBeVisible();
      await expect(checkoutPage.placeOrderButton).toBeVisible();
      await expect(checkoutPage.placeOrderButton).toContainText(product.price);
      await expect(page.getByText(product.name, { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Qty: 1')).toBeVisible();
      await expect(page.getByText(product.price).first()).toBeVisible();
      await expect(page.getByText('Free')).toBeVisible();
    });
  });

  test('filled-checkout-back-to-cart', { tag: ['@critical'] }, async ({
    catalogPage,
    checkoutPage,
    cartPage,
    page,
  }) => {
    let product: CatalogCard;

    await test.step('Arrange: seed product and open checkout', async () => {
      product = await catalogPage.addProductToCart(CHECKOUT_PRODUCT_ID);
      await checkoutPage.gotoWhenSignedIn();
      await expect(checkoutPage.form, {
        message: 'Precondition Failed: filled checkout form should be visible',
      }).toBeVisible();
    });

    await test.step('Act: Back to Cart', async () => {
      await checkoutPage.backToCartLink.click();
    });

    await test.step('Assert: cart shows seeded line', async () => {
      await expect(page).toHaveURL(/\/cart$/);
      await expect(cartPage.cartPage).toBeVisible();
      await expect(cartPage.item(product.id)).toBeVisible();
    });
  });

  test('empty-form-shows-required-field-validation', { tag: ['@critical'] }, async ({
    catalogPage,
    checkoutPage,
    page,
  }) => {
    await test.step('Arrange: filled checkout, empty fields', async () => {
      await catalogPage.addProductToCart(CHECKOUT_PRODUCT_ID);
      await checkoutPage.gotoWhenSignedIn();
      await expect(checkoutPage.form, {
        message: 'Precondition Failed: filled checkout form should be visible',
      }).toBeVisible();
    });

    await test.step('Act: Place Order with empty form', async () => {
      await checkoutPage.placeOrder();
    });

    await test.step('Assert: field required messages; no checkout-error banner', async () => {
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(checkoutPage.error).toHaveCount(0);
      await expect(page.getByText('First name is required')).toBeVisible();
      await expect(page.getByText('Last name is required')).toBeVisible();
      await expect(page.getByText('Address is required')).toBeVisible();
      await expect(page.getByText('Card number is required')).toBeVisible();
      await expect(page.getByText('Expiry is required')).toBeVisible();
      await expect(page.getByText('CVV is required')).toBeVisible();
      await expect(page.getByText('Name is required', { exact: true })).toBeVisible();
    });
  });

  test('invalid-luhn-card-shows-checkout-error', { tag: ['@critical'] }, async ({
    catalogPage,
    checkoutPage,
    page,
  }) => {
    await test.step('Arrange: seed product and open checkout', async () => {
      await catalogPage.addProductToCart(CHECKOUT_PRODUCT_ID);
      await checkoutPage.gotoWhenSignedIn();
      await expect(checkoutPage.form, {
        message: 'Precondition Failed: filled checkout form should be visible',
      }).toBeVisible();
    });

    await test.step('Act: submit Luhn-invalid card with other fields filled', async () => {
      await checkoutPage.fillShipping(SHIPPING.firstName, SHIPPING.lastName, SHIPPING.address);
      await checkoutPage.fillPayment(
        INVALID_LUHN_CARD,
        '12/30',
        '123',
        `${SHIPPING.firstName} ${SHIPPING.lastName}`,
      );
      await checkoutPage.placeOrder();
    });

    await test.step('Assert: checkout-error banner; stay on checkout', async () => {
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(checkoutPage.error).toBeVisible();
      await expect(checkoutPage.errorMessage).toHaveText(
        'Invalid card number. Please check and try again.',
      );
      await expect(checkoutPage.confirmationPage).toHaveCount(0);
    });
  });

  // 2.6 + 2.7
  test('place-webcam-order-shows-confirmation', { tag: ['@smoke', '@critical'] }, async ({
    catalogPage,
    checkoutPage,
    cartPage,
    page,
  }) => {
    let product: CatalogCard;

    await test.step('Arrange: seed product qty 1 and open checkout', async () => {
      product = await catalogPage.addProductToCart(CHECKOUT_PRODUCT_ID);
      await checkoutPage.gotoWhenSignedIn();
      await expect(checkoutPage.form, {
        message: 'Precondition Failed: filled checkout form should be visible',
      }).toBeVisible();
    });

    await test.step('Act: Place Order with valid shipping and payment', async () => {
      await checkoutPage.fillShipping(SHIPPING.firstName, SHIPPING.lastName, SHIPPING.address);
      await checkoutPage.fillPayment(
        VALID_CARD,
        '12/30',
        '123',
        `${SHIPPING.firstName} ${SHIPPING.lastName}`,
      );
      await checkoutPage.placeOrder();
    });

    await test.step('Assert: this order confirmation', async () => {
      await expect(page).toHaveURL(/\/orders\/\d+$/);
      await expect(checkoutPage.confirmationPage).toBeVisible();
      await expect(checkoutPage.confirmationHeading).toHaveText('Order Confirmed!');
      await expect(checkoutPage.confirmationNumber).toHaveText(/Order #\d+/);
      const orderId = page.url().match(/\/orders\/(\d+)$/)?.[1];
      if (!orderId) {
        throw new Error('Confirmation URL did not include an order id');
      }
      await expect(checkoutPage.confirmationNumber).toContainText(orderId);
      await expect(checkoutPage.shippingName).toHaveText(
        `${SHIPPING.firstName} ${SHIPPING.lastName}`,
      );
      await expect(checkoutPage.shippingAddress).toHaveText(SHIPPING.address);
      await expect(checkoutPage.itemsHeading).toHaveText('Order Items');
      await expect(page.getByText(product.name, { exact: true })).toBeVisible();
      await expect(page.getByText(`${product.price} × 1`)).toBeVisible();
      await expect(checkoutPage.cartBadge).toHaveCount(0);
    });

    await test.step('Assert: cart empty after place order (2.7)', async () => {
      await cartPage.goto();
      await expect(cartPage.emptyState).toBeVisible();
      await expect(cartPage.emptyHeading).toHaveText('Your cart is empty');
      await expect(cartPage.cartBadge).toHaveCount(0);
    });
  });
});
