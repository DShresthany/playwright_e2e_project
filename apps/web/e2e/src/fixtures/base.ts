import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CatalogPage } from '../pages/CatalogPage';

type PageFixtures = {
  loginPage: LoginPage;
  catalogPage: CatalogPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  catalogPage: async ({ page }, use) => {
    await use(new CatalogPage(page));
  },
});

export { expect };
