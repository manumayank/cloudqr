import { test, expect } from '@playwright/test';
import { GetStartedPage } from './pages/GetStartedPage';
import { EditorPage } from './pages/EditorPage';
import { CheckoutPage } from './pages/CheckoutPage';

/**
 * Get Started Wizard E2E Tests
 * Tests the complete onboarding flow
 */

test.describe('Get Started Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API endpoints that might be called
    await page.route('**/campaigns', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/orders', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'order-123',
            status: 'pending',
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });
  });

  test('complete flow from landing to checkout', async ({ page }) => {
    // 1. Start from landing page
    await page.goto('/');

    const getStartedButton = page.getByRole('link', { name: /get qr cards|get started/i }).first();
    await expect(getStartedButton).toBeVisible();
    await getStartedButton.click();

    // 2. Persona Selection
    const getStarted = new GetStartedPage(page);
    await getStarted.expectPersonaStep();
    await getStarted.selectPersona('ecommerce');

    // 3. Use Case Selection
    await getStarted.expectUseCaseStep();
    await getStarted.selectUseCase('reviews');

    // 4. Should navigate to templates
    await expect(page).toHaveURL(/\/get-started\/templates/);

    // Select first template
    const templateCards = page.locator('.card, [class*="card"]').filter({ hasText: /template|design/i });
    const firstTemplate = templateCards.first();

    // Click template if visible
    const templateVisible = await firstTemplate.isVisible().catch(() => false);
    if (templateVisible) {
      await firstTemplate.click();
    }

    // Continue to editor
    const continueButton = page.getByRole('button', { name: /continue to design|continue/i });
    const continueVisible = await continueButton.isVisible().catch(() => false);
    if (continueVisible) {
      await continueButton.click();
    }

    // 5. Card Editor
    await expect(page).toHaveURL(/\/get-started\/editor/);

    const editor = new EditorPage(page);
    await editor.fillCardDetails(
      'Test Restaurant',
      'Love our food? Leave a review!',
      'Your feedback helps us improve'
    );

    // Verify preview updates
    await expect(page.getByText('Test Restaurant')).toBeVisible();

    // Continue to checkout
    await editor.continue();

    // 6. Checkout
    await expect(page).toHaveURL(/\/get-started\/checkout/);

    const checkout = new CheckoutPage(page);
    await checkout.selectQuantity(250);
    await checkout.expectPriceDisplayed('₹1,999');

    await checkout.fillAddress(
      '123 Test Street, Area',
      'Mumbai',
      'Maharashtra',
      '400001',
      '+91 98765 43210'
    );

    // Note: We don't actually submit the order in tests to avoid creating real orders
    await expect(checkout.placeOrderButton).toBeEnabled();
  });

  test('persona selection step works correctly', async ({ page }) => {
    const getStarted = new GetStartedPage(page);
    await getStarted.goto();

    await getStarted.expectPersonaStep();

    // Both personas should be visible
    await expect(getStarted.personaEcommerce).toBeVisible();
    await expect(getStarted.personaRestaurant).toBeVisible();

    // Select ecommerce
    await getStarted.selectPersona('ecommerce');

    // Should show use case selection
    await getStarted.expectUseCaseStep();
  });

  test('use case pre-fills content in editor', async ({ page }) => {
    const getStarted = new GetStartedPage(page);
    await getStarted.goto();

    await getStarted.selectPersona('restaurant');
    await getStarted.selectUseCase('reviews');

    // Navigate through templates to editor
    await page.waitForURL(/\/get-started\/templates/, { timeout: 5000 }).catch(() => {});

    // Try to navigate to editor directly for testing
    await page.goto('/get-started/editor');

    // Editor should have review-related placeholder text
    const headlineInput = page.getByLabel(/headline/i);
    const headlineValue = await headlineInput.inputValue();

    expect(headlineValue.toLowerCase()).toContain('review');
  });

  test('card editor live preview updates', async ({ page }) => {
    await page.goto('/get-started/editor');

    const editor = new EditorPage(page);

    const businessName = 'Live Preview Test';
    await editor.businessNameInput.fill(businessName);

    // Preview should update with business name
    const preview = page.locator('[data-testid="card-preview"]');
    await expect(preview.getByText(businessName)).toBeVisible({ timeout: 5000 });
  });

  test('checkout validates required fields', async ({ page }) => {
    await page.goto('/get-started/checkout');

    const checkout = new CheckoutPage(page);

    // Try to submit without filling address
    await expect(checkout.placeOrderButton).toBeDisabled();

    // Fill minimum required fields
    await checkout.fillAddress(
      '123 Street',
      'Mumbai',
      'Maharashtra',
      '400001',
      '+91 9876543210'
    );

    // Button should now be enabled
    await expect(checkout.placeOrderButton).toBeEnabled();
  });

  test('quantity selection updates price', async ({ page }) => {
    await page.goto('/get-started/checkout');

    const checkout = new CheckoutPage(page);

    // Select 100 cards
    await checkout.selectQuantity(100);
    await checkout.expectPriceDisplayed('₹999');

    // Select 250 cards
    await checkout.selectQuantity(250);
    await checkout.expectPriceDisplayed('₹1,999');

    // Select 500 cards
    await checkout.selectQuantity(500);
    await checkout.expectPriceDisplayed('₹3,499');
  });
});

test.describe('Get Started Wizard - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('wizard works on mobile devices', async ({ page }) => {
    const getStarted = new GetStartedPage(page);
    await getStarted.goto();

    // Persona cards should be visible and tappable
    await getStarted.expectPersonaStep();
    await expect(getStarted.personaEcommerce).toBeVisible();

    await getStarted.selectPersona('ecommerce');

    // Use case selection should work
    await getStarted.expectUseCaseStep();
  });

  test('editor form is mobile-friendly', async ({ page }) => {
    await page.goto('/get-started/editor');

    // Inputs should be appropriately sized for touch
    const businessNameInput = page.getByLabel(/business name/i);
    await expect(businessNameInput).toBeVisible();

    // Verify input is at least 44px tall (iOS recommendation)
    const boundingBox = await businessNameInput.boundingBox();
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
  });
});
