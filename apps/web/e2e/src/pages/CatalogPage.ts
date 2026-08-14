import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CatalogPage extends BasePage {
  readonly catalogPage: Locator;
  readonly heading: Locator;
  readonly navbarUsername: Locator;
  readonly logoutButton: Locator;
  readonly adminLink: Locator;

  constructor(page: Page) {
    super(page);
    this.catalogPage = page.getByTestId('catalog-page');
    this.heading = page.getByTestId('catalog-heading');
    this.navbarUsername = page.getByTestId('navbar-username');
    this.logoutButton = page.getByTestId('navbar-logout-button');
    this.adminLink = page.getByTestId('navbar-admin-link');
  }

  async goto(): Promise<void> {
    await this.page.goto('/catalog');
  }
}
