import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  readonly checkoutPage: Locator;
  readonly emptyCart: Locator;
  readonly continueShoppingButton: Locator;
  readonly heading: Locator;
  readonly form: Locator;
  readonly backToCartLink: Locator;
  readonly shippingHeading: Locator;
  readonly paymentHeading: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly address: Locator;
  readonly cardNumber: Locator;
  readonly expiry: Locator;
  readonly cvv: Locator;
  readonly cardholderName: Locator;
  readonly placeOrderButton: Locator;
  readonly error: Locator;
  readonly errorMessage: Locator;
  readonly confirmationPage: Locator;
  readonly confirmationHeading: Locator;
  readonly confirmationNumber: Locator;
  readonly shippingName: Locator;
  readonly shippingAddress: Locator;
  readonly itemsHeading: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.checkoutPage = page.getByTestId('checkout-page');
    this.emptyCart = page.getByTestId('checkout-empty-cart');
    this.continueShoppingButton = page.getByTestId('checkout-continue-shopping-button');
    this.heading = page.getByTestId('checkout-heading');
    this.form = page.getByTestId('checkout-form');
    this.backToCartLink = page.getByTestId('back-to-cart-link');
    this.shippingHeading = page.getByTestId('shipping-heading');
    this.paymentHeading = page.getByTestId('payment-heading');
    this.firstName = page.getByTestId('checkout-first-name');
    this.lastName = page.getByTestId('checkout-last-name');
    this.address = page.getByTestId('checkout-address');
    this.cardNumber = page.getByTestId('checkout-card-number');
    this.expiry = page.getByTestId('checkout-expiry');
    this.cvv = page.getByTestId('checkout-cvv');
    this.cardholderName = page.getByTestId('checkout-cardholder-name');
    this.placeOrderButton = page.getByTestId('place-order-button');
    this.error = page.getByTestId('checkout-error');
    this.errorMessage = page.getByTestId('checkout-error-message');
    this.confirmationPage = page.getByTestId('order-confirmation-page');
    this.confirmationHeading = page.getByTestId('order-confirmation-heading');
    this.confirmationNumber = page.getByTestId('order-confirmation-number');
    this.shippingName = page.getByTestId('order-shipping-name');
    this.shippingAddress = page.getByTestId('order-shipping-address');
    this.itemsHeading = page.getByTestId('order-items-heading');
    this.cartBadge = page.getByTestId('navbar-cart-badge');
  }

  /** Opens /checkout with a full navigation (guest deep-link). */
  async goto(): Promise<void> {
    await this.page.goto('/checkout');
  }

  /**
   * Opens /checkout while already signed in. Prefers in-app history so
   * ProtectedRoute does not race checkAuth vs persist on a full reload.
   */
  async gotoWhenSignedIn(): Promise<void> {
    await expect(this.page.getByTestId('navbar-username'), {
      message: 'Precondition Failed: must be signed in before opening checkout',
    }).toBeVisible();

    await this.page.evaluate(() => {
      window.history.pushState({}, '', '/checkout');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    try {
      await this.checkoutPage.waitFor({ state: 'visible', timeout: 5000 });
      return;
    } catch {
      await this.page.goto('/checkout');
      await expect(this.checkoutPage, {
        message: 'Precondition Failed: checkout page should be visible when signed in',
      }).toBeVisible();
    }
  }

  /** Fills shipping first name, last name, and address. */
  async fillShipping(firstName: string, lastName: string, address: string): Promise<void> {
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.address.fill(address);
  }

  /** Fills card number, expiry, CVV, and name on card. */
  async fillPayment(
    cardNumber: string,
    expiry: string,
    cvv: string,
    nameOnCard: string,
  ): Promise<void> {
    await this.cardNumber.fill(cardNumber);
    await this.expiry.fill(expiry);
    await this.cvv.fill(cvv);
    await this.cardholderName.fill(nameOnCard);
  }

  /** Submits the checkout form. */
  async placeOrder(): Promise<void> {
    await this.placeOrderButton.click();
  }
}
