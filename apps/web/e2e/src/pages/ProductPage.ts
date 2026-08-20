import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  readonly productPage: Locator;
  readonly image: Locator;
  readonly name: Locator;
  readonly price: Locator;
  readonly description: Locator;
  readonly notFound: Locator;
  readonly notFoundHeading: Locator;
  readonly backToCatalogButton: Locator;
  readonly backToCatalogLink: Locator;
  readonly addToCartButton: Locator;
  readonly removeFromCartButton: Locator;
  readonly viewCartButton: Locator;
  readonly inStockText: Locator;
  readonly onlyNLeftText: Locator;
  readonly outOfStockText: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.productPage = page.getByTestId('product-page');
    this.image = page.getByTestId('product-detail-image');
    this.name = page.getByTestId('product-detail-name');
    this.price = page.getByTestId('product-detail-price');
    this.description = page.getByTestId('product-detail-description');
    this.notFound = page.getByTestId('product-not-found');
    this.notFoundHeading = page.getByTestId('product-not-found-heading');
    this.backToCatalogButton = page.getByTestId('product-not-found-back-button');
    this.backToCatalogLink = page.getByTestId('product-back-to-catalog');
    this.addToCartButton = page.getByTestId('product-add-to-cart-button');
    this.removeFromCartButton = page.getByTestId('product-remove-from-cart-button');
    this.viewCartButton = page.getByTestId('product-view-cart-button');
    this.inStockText = page.getByText(/\d+ in stock/);
    this.onlyNLeftText = page.getByText(/Only \d+ left/);
    this.outOfStockText = page.getByText('Out of Stock');
    this.cartBadge = page.getByTestId('navbar-cart-badge');
  }

  /** Opens /catalog (PDP is usually reached via a catalog product link). */
  async goto(): Promise<void> {
    await this.page.goto('/catalog');
  }

  /** Opens /products/:slug and waits for the product detail shell. */
  async gotoSlug(slug: string): Promise<void> {
    await this.page.goto(`/products/${slug}`);
    await expect(this.productPage).toBeVisible();
  }

  /** Opens a known-invalid product slug to exercise the not-found state. */
  async gotoInvalidSlug(): Promise<void> {
    await this.page.goto('/products/no-such-product');
  }

  /** Parses the integer from the visible "{N} in stock" copy. */
  async parseInStockCount(): Promise<number> {
    return this.parseLeadingInt(this.inStockText, '{N} in stock');
  }

  /** Parses the integer from the visible "Only {N} left" overlay. */
  async parseOnlyNLeftCount(): Promise<number> {
    return this.parseLeadingInt(this.onlyNLeftText, 'Only {N} left');
  }

  /** Reads trimmed "{N} in stock" text for before/after comparison. */
  async inStockCopy(): Promise<string> {
    await expect(this.inStockText).toBeVisible();
    return (await this.inStockText.textContent())?.trim() ?? '';
  }

  /**
   * Clicks PDP Add and waits for POST /cart/items so persist survives reload.
   */
  async addToCart(): Promise<void> {
    const synced = this.page.waitForResponse(
      (res) =>
        res.url().includes('/cart/items') &&
        res.request().method() === 'POST' &&
        res.ok(),
    );
    await this.addToCartButton.click();
    await synced;
  }

  private async parseLeadingInt(locator: Locator, label: string): Promise<number> {
    await locator.waitFor({ state: 'visible' });
    const text = await locator.textContent();
    const match = text?.match(/(\d+)/);
    if (!match) {
      throw new Error(`Precondition Failed: could not parse ${label} from "${text}"`);
    }
    return Number(match[1]);
  }
}
