import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Dashboard page
 */
export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newCampaignButton: Locator;
  readonly campaignCards: Locator;
  readonly emptyState: Locator;
  readonly statsCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /dashboard/i });
    this.newCampaignButton = page.getByRole('button', { name: /create campaign|new campaign/i });
    this.campaignCards = page.locator('[data-testid="campaign-card"]');
    this.emptyState = page.getByText(/no campaigns yet/i);
    this.statsCards = page.locator('[data-testid="stat-card"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectDashboardPage() {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await expect(this.heading).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectCampaigns() {
    await expect(this.campaignCards.first()).toBeVisible();
  }

  async clickFirstCampaign() {
    await this.campaignCards.first().click();
  }

  async clickNewCampaign() {
    await this.newCampaignButton.click();
  }

  async expectStatsVisible() {
    await expect(this.statsCards.first()).toBeVisible();
  }
}
