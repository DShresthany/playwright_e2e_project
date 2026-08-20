import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  readonly cartPage: Locator;
  readonly emptyState: Locator;
  readonly emptyHeading: Locator;
  readonly continueShoppingButton: Locator;
  readonly heading: Locator;
  readonly itemCount: Locator;
  readonly clearCartButton: Locator;
  readonly itemsList: Locator;
  readonly orderSummaryHeading: Locator;
  readonly orderSubtotal: Locator;
  readonly orderShipping: Locator;
  readonly orderTotal: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingLinkButton: Locator;
  readonly cartBadge: Locator;
  readonly checkoutPage: Locator;
  readonly checkoutHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.cartPage = page.getByTestId('cart-page');
    this.emptyState = page.getByTestId('cart-empty-state');
    this.emptyHeading = page.getByTestId('cart-empty-heading');
    this.continueShoppingButton = page.getByTestId('continue-shopping-button');
    this.heading = page.getByTestId('cart-heading');
    this.itemCount = page.getByTestId('cart-item-count');
    this.clearCartButton = page.getByTestId('clear-cart-button');
    this.itemsList = page.getByTestId('cart-items-list');
    this.orderSummaryHeading = page.getByTestId('order-summary-heading');
    this.orderSubtotal = page.getByTestId('order-subtotal');
    this.orderShipping = page.getByTestId('order-shipping');
    this.orderTotal = page.getByTestId('order-total');
    this.checkoutButton = page.getByTestId('proceed-to-checkout-button');
    this.continueShoppingLinkButton = page.getByTestId('continue-shopping-link-button');
    this.cartBadge = page.getByTestId('navbar-cart-badge');
    this.checkoutPage = page.getByTestId('checkout-page');
    this.checkoutHeading = page.getByTestId('checkout-heading');
  }

  /** Opens /cart. */
  async goto(): Promise<void> {
    await this.page.goto('/cart');
  }

  item(id: string): Locator {
    return this.page.getByTestId(`cart-item-${id}`);
  }

  itemName(id: string): Locator {
    return this.page.getByTestId(`cart-item-name-${id}`);
  }

  itemImageLink(id: string): Locator {
    return this.page.getByTestId(`cart-item-image-link-${id}`);
  }

  itemPrice(id: string): Locator {
    return this.page.getByTestId(`cart-item-price-${id}`);
  }

  itemQuantity(id: string): Locator {
    return this.page.getByTestId(`cart-item-quantity-${id}`);
  }

  itemSubtotal(id: string): Locator {
    return this.page.getByTestId(`cart-item-subtotal-${id}`);
  }

  increaseButton(id: string): Locator {
    return this.page.getByTestId(`cart-item-increase-${id}`);
  }

  decreaseButton(id: string): Locator {
    return this.page.getByTestId(`cart-item-decrease-${id}`);
  }

  removeButton(id: string): Locator {
    return this.page.getByTestId(`cart-item-remove-${id}`);
  }
}
