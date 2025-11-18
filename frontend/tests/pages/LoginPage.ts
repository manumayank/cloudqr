import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Login/Signup page
 * Encapsulates all login/registration interactions
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly businessNameInput: Locator;
  readonly phoneInput: Locator;
  readonly loginButton: Locator;
  readonly signupButton: Locator;
  readonly loginTab: Locator;
  readonly signupTab: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.businessNameInput = page.getByLabel(/business name/i);
    this.phoneInput = page.getByLabel(/phone/i);
    this.loginButton = page.getByRole('button', { name: /^login$/i });
    this.signupButton = page.getByRole('button', { name: /create account|sign up/i });
    this.loginTab = page.getByRole('button', { name: /^login$/i }).first();
    this.signupTab = page.getByRole('button', { name: /sign up/i }).first();
    this.errorMessage = page.locator('[role="alert"], .error-message, .text-error-600');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    // Ensure we're in login mode
    const tabVisible = await this.loginTab.isVisible().catch(() => false);
    if (tabVisible) {
      await this.loginTab.click();
    }

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async signup(email: string, password: string, businessName: string, phone: string) {
    // Switch to signup mode
    const tabVisible = await this.signupTab.isVisible().catch(() => false);
    if (tabVisible) {
      await this.signupTab.click();
    }

    // Fill in business details first (if visible)
    const businessNameVisible = await this.businessNameInput.isVisible().catch(() => false);
    if (businessNameVisible) {
      await this.businessNameInput.fill(businessName);
    }

    const phoneVisible = await this.phoneInput.isVisible().catch(() => false);
    if (phoneVisible) {
      await this.phoneInput.fill(phone);
    }

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signupButton.click();
  }

  async expectLoginPage() {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.page.getByRole('heading', { name: /login|sign up/i })).toBeVisible();
  }

  async expectError() {
    await expect(this.errorMessage).toBeVisible();
  }

  async expectRedirectToDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  }
}
