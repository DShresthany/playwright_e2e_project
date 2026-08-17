import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  readonly productPage: Locator;
  readonly name: Locator;
  readonly price: Locator;
  readonly notFound: Locator;
  readonly notFoundHeading: Locator;
  readonly backToCatalogButton: Locator;
  readonly stockBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.productPage = page.getByTestId('product-page');
    this.name = page.getByTestId('product-detail-name');
    this.price = page.getByTestId('product-detail-price');
    this.notFound = page.getByTestId('product-not-found');
    this.notFoundHeading = page.getByTestId('product-not-found-heading');
    this.backToCatalogButton = page.getByTestId('product-not-found-back-button');
    this.stockBadge = page.getByText(/\d+ in stock/);
  }

  /** Parses the leading integer from "{N} in stock" on the PDP. */
  async parseInStockCount(): Promise<number> {
    await this.stockBadge.waitFor({ state: 'visible' });
    const text = await this.stockBadge.textContent();
    const match = text?.match(/(\d+)/);
    if (!match) {
      throw new Error(`Precondition Failed: could not parse stock from "${text}"`);
    }
    return Number(match[1]);
  }

  /** Opens /catalog (PDP is usually reached via a catalog product link). */
  async goto(): Promise<void> {
    await this.page.goto('/catalog');
  }

  /** Opens a known-invalid product slug to exercise the not-found state. */
  async gotoInvalidSlug(): Promise<void> {
    await this.page.goto('/products/no-such-product');
  }
}
