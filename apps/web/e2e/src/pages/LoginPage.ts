import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly loginPage: Locator;
  readonly loginForm: Locator;
  readonly heading: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.loginPage = page.getByTestId('login-page');
    this.loginForm = page.getByTestId('login-form');
    this.heading = page.getByTestId('login-heading');
    this.usernameInput = page.getByTestId('username-input');
    this.passwordInput = page.getByTestId('password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.errorAlert = page.getByTestId('login-error');
    this.errorMessage = page.getByTestId('login-error-message');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
