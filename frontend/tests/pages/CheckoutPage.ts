import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Checkout page
 */
export class CheckoutPage {
  readonly page: Page;
  readonly quantity100: Locator;
  readonly quantity250: Locator;
  readonly quantity500: Locator;
  readonly quantity1000: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly pincodeInput: Locator;
  readonly phoneInput: Locator;
  readonly placeOrderButton: Locator;
  readonly orderSummary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.quantity100 = page.getByRole('button', { name: /100 cards/i });
    this.quantity250 = page.getByRole('button', { name: /250 cards/i });
    this.quantity500 = page.getByRole('button', { name: /500 cards/i });
    this.quantity1000 = page.getByRole('button', { name: /1000 cards/i });
    this.addressInput = page.getByLabel(/street address|address/i);
    this.cityInput = page.getByLabel(/city/i);
    this.stateInput = page.getByLabel(/state/i);
    this.pincodeInput = page.getByLabel(/pin.*code|pincode|zip/i);
    this.phoneInput = page.getByLabel(/phone/i);
    this.placeOrderButton = page.getByRole('button', { name: /place order/i });
    this.orderSummary = page.locator('[data-testid="order-summary"]');
  }

  async goto() {
    await this.page.goto('/get-started/checkout');
  }

  async selectQuantity(quantity: 100 | 250 | 500 | 1000) {
    const quantityMap = {
      100: this.quantity100,
      250: this.quantity250,
      500: this.quantity500,
      1000: this.quantity1000,
    };
    await quantityMap[quantity].click();
  }

  async fillAddress(address: string, city: string, state: string, pincode: string, phone: string) {
    await this.addressInput.fill(address);
    await this.cityInput.fill(city);
    await this.stateInput.fill(state);
    await this.pincodeInput.fill(pincode);
    await this.phoneInput.fill(phone);
  }

  async placeOrder() {
    await this.placeOrderButton.click();
  }

  async expectPriceDisplayed(price: string) {
    await expect(this.page.getByText(price)).toBeVisible();
  }
}
