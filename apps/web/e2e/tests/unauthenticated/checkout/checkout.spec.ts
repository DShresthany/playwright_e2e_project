// spec: specs/ecommerce-checkout.md
import { test, expect } from '../../../src/fixtures/base';

test.describe('Checkout', { tag: '@checkout' }, () => {
  test('guest-checkout-deep-link-empty', { tag: ['@critical'] }, async ({
    checkoutPage,
    loginPage,
    page,
  }) => {
    await checkoutPage.goto();

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.loginPage).toBeVisible();
    await expect(checkoutPage.checkoutPage).toHaveCount(0);
    await expect(checkoutPage.emptyCart).toHaveCount(0);
  });
});
