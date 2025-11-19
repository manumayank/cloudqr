import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Get Started wizard
 */
export class GetStartedPage {
  readonly page: Page;
  readonly personaEcommerce: Locator;
  readonly personaRestaurant: Locator;
  readonly useCaseReviews: Locator;
  readonly useCaseFeedback: Locator;
  readonly useCaseWhatsapp: Locator;
  readonly useCaseCustomLink: Locator;
  readonly continueButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.personaEcommerce = page.getByRole('button', { name: /amazon.*flipkart|ecommerce/i });
    this.personaRestaurant = page.getByRole('button', { name: /restaurant/i });
    this.useCaseReviews = page.getByRole('button', { name: /get more reviews|reviews/i });
    this.useCaseFeedback = page.getByRole('button', { name: /collect feedback|feedback/i });
    this.useCaseWhatsapp = page.getByRole('button', { name: /whatsapp|grow whatsapp/i });
    this.useCaseCustomLink = page.getByRole('button', { name: /custom link/i });
    this.continueButton = page.getByRole('button', { name: /continue/i });
    this.backButton = page.getByRole('button', { name: /back/i });
  }

  async goto() {
    await this.page.goto('/get-started');
  }

  async selectPersona(persona: 'ecommerce' | 'restaurant') {
    if (persona === 'ecommerce') {
      await this.personaEcommerce.click();
    } else {
      await this.personaRestaurant.click();
    }
  }

  async selectUseCase(useCase: 'reviews' | 'feedback' | 'whatsapp' | 'custom') {
    const useCaseMap = {
      reviews: this.useCaseReviews,
      feedback: this.useCaseFeedback,
      whatsapp: this.useCaseWhatsapp,
      custom: this.useCaseCustomLink,
    };
    await useCaseMap[useCase].click();
  }

  async expectPersonaStep() {
    await expect(this.personaEcommerce).toBeVisible();
    await expect(this.personaRestaurant).toBeVisible();
  }

  async expectUseCaseStep() {
    await expect(this.useCaseReviews).toBeVisible();
  }
}
