import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Product identity and visible card text captured from the catalog grid. */
export type CatalogCard = {
  id: string;
  name: string;
  price: string;
};

export class CatalogPage extends BasePage {
  readonly catalogPage: Locator;
  readonly heading: Locator;
  readonly productCount: Locator;
  readonly productGrid: Locator;
  readonly productCards: Locator;
  readonly navbarUsername: Locator;
  readonly logoutButton: Locator;
  readonly adminLink: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly cartPage: Locator;

  constructor(page: Page) {
    super(page);
    this.catalogPage = page.getByTestId('catalog-page');
    this.heading = page.getByTestId('catalog-heading');
    this.productCount = page.getByTestId('catalog-product-count');
    this.productGrid = page.getByTestId('product-grid');
    this.productCards = page.getByRole('list', { name: 'Product catalog' }).getByRole('listitem');
    this.navbarUsername = page.getByTestId('navbar-username');
    this.logoutButton = page.getByTestId('navbar-logout-button');
    this.adminLink = page.getByTestId('navbar-admin-link');
    this.cartLink = page.getByTestId('navbar-cart-link');
    this.cartBadge = page.getByTestId('navbar-cart-badge');
    this.cartPage = page.getByTestId('cart-page');
  }

  /** Opens /catalog and waits for the catalog shell and product grid. */
  async goto(): Promise<void> {
    await this.page.goto('/catalog');
    await expect(this.catalogPage).toBeVisible();
    await expect(this.productGrid).toBeVisible();
  }

  productName(id: string): Locator {
    return this.page.getByTestId(`product-name-${id}`);
  }

  productPrice(id: string): Locator {
    return this.page.getByTestId(`product-price-${id}`);
  }

  productImage(id: string): Locator {
    return this.page.getByTestId(`product-image-${id}`);
  }

  productLink(id: string): Locator {
    return this.page.getByTestId(`product-link-${id}`);
  }

  addToCartButton(id: string): Locator {
    return this.page.getByTestId(`product-add-to-cart-${id}`);
  }

  inCartActions(id: string): Locator {
    return this.page.getByTestId(`product-in-cart-actions-${id}`);
  }

  removeFromCartButton(id: string): Locator {
    return this.page.getByTestId(`product-remove-from-cart-${id}`);
  }

  goToCartButton(id: string): Locator {
    return this.page.getByTestId(`product-go-to-cart-${id}`);
  }

  outOfStockBadge(id: string): Locator {
    return this.page.getByTestId(`product-out-of-stock-badge-${id}`);
  }

  lowStockBadge(id: string): Locator {
    return this.page.getByTestId(`product-low-stock-badge-${id}`);
  }

  /**
   * Parses the numeric count from the catalog-product-count label
   * (e.g. "12 products" → 12) for comparison with the card list.
   */
  async listedProductCount(): Promise<number> {
    const text = await this.productCount.textContent();
    const match = text?.match(/(\d+)/);
    if (!match) {
      throw new Error(`Could not parse product count from: ${text}`);
    }
    return Number(match[1]);
  }

  /**
   * Finds the first card with an enabled Add button and no OOS/low-stock badge.
   * Use for regular in-stock assertions (scenario 1.4).
   */
  async findInStockCard(): Promise<CatalogCard> {
    const addButtons = this.page.getByRole('button', { name: /^Add .+ to cart$/ });
    await expect(addButtons.first()).toBeVisible();
    const count = await addButtons.count();
    for (let i = 0; i < count; i++) {
      const button = addButtons.nth(i);
      if (!(await button.isEnabled())) {
        continue;
      }
      const id = this.idFromAddTestId(await button.getAttribute('data-testid'));
      if (await this.outOfStockBadge(id).count()) {
        continue;
      }
      if (await this.lowStockBadge(id).count()) {
        continue;
      }
      return this.cardDetails(id);
    }
    throw new Error('No in-stock catalog card without a stock badge');
  }

  /**
   * Finds the first card whose Add button is enabled (may include low-stock).
   * Prefer for authenticated add/remove flows when any purchasable card works.
   */
  async findEnabledAddCard(): Promise<CatalogCard> {
    const addButtons = this.page.getByRole('button', { name: /^Add .+ to cart$/ });
    await expect(addButtons.first()).toBeVisible();
    const count = await addButtons.count();
    for (let i = 0; i < count; i++) {
      const button = addButtons.nth(i);
      if (await button.isEnabled()) {
        const id = this.idFromAddTestId(await button.getAttribute('data-testid'));
        return this.cardDetails(id);
      }
    }
    throw new Error('No catalog card with enabled Add');
  }

  /**
   * Finds the first card showing an "Out of stock" status badge.
   * Use for OOS UI assertions (scenario 1.5).
   */
  async findOutOfStockCard(): Promise<CatalogCard> {
    const badge = this.page.getByRole('status', { name: 'Out of stock' }).first();
    await expect(badge).toBeVisible();
    const id = this.idFromBadgeTestId(await badge.getAttribute('data-testid'), 'product-out-of-stock-badge-');
    return this.cardDetails(id);
  }

  /**
   * Finds the first card showing a "Low stock" status badge.
   * Use for low-stock UI assertions (scenario 1.6).
   */
  async findLowStockCard(): Promise<CatalogCard> {
    const badge = this.page.getByRole('status', { name: 'Low stock' }).first();
    await expect(badge).toBeVisible();
    const id = this.idFromBadgeTestId(await badge.getAttribute('data-testid'), 'product-low-stock-badge-');
    return this.cardDetails(id);
  }

  /** Reads visible name and price for a product id from the catalog card. */
  private async cardDetails(id: string): Promise<CatalogCard> {
    const name = (await this.productName(id).textContent())?.trim() ?? '';
    const price = (await this.productPrice(id).textContent())?.trim() ?? '';
    return { id, name, price };
  }

  /** Extracts the product id from a product-add-to-cart-* test id. */
  private idFromAddTestId(testId: string | null): string {
    const id = testId?.replace('product-add-to-cart-', '');
    if (!id) {
      throw new Error(`Unexpected add button test id: ${testId}`);
    }
    return id;
  }

  /** Extracts the product id from a stock-badge test id with the given prefix. */
  private idFromBadgeTestId(testId: string | null, prefix: string): string {
    const id = testId?.replace(prefix, '');
    if (!id) {
      throw new Error(`Unexpected badge test id: ${testId}`);
    }
    return id;
  }
}
