import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Card Editor
 */
export class EditorPage {
  readonly page: Page;
  readonly businessNameInput: Locator;
  readonly headlineInput: Locator;
  readonly subtextInput: Locator;
  readonly brandColorInput: Locator;
  readonly logoUploadButton: Locator;
  readonly cardPreview: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.businessNameInput = page.getByLabel(/business name/i);
    this.headlineInput = page.getByLabel(/headline/i);
    this.subtextInput = page.getByLabel(/subtext/i);
    this.brandColorInput = page.locator('input[type="color"]');
    this.logoUploadButton = page.getByRole('button', { name: /upload logo/i });
    this.cardPreview = page.locator('[data-testid="card-preview"]');
    this.continueButton = page.getByRole('button', { name: /continue to.*checkout/i });
  }

  async goto() {
    await this.page.goto('/get-started/editor');
  }

  async fillCardDetails(businessName: string, headline: string, subtext?: string) {
    await this.businessNameInput.fill(businessName);
    await this.headlineInput.fill(headline);
    if (subtext) {
      await this.subtextInput.fill(subtext);
    }
  }

  async selectBrandColor(color: string) {
    await this.brandColorInput.fill(color);
  }

  async expectPreviewUpdated(text: string) {
    await expect(this.cardPreview.getByText(text)).toBeVisible();
  }

  async continue() {
    await this.continueButton.click();
  }
}
