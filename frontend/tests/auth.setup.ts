import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Authentication setup - runs once before all tests
 * Creates a test user and saves authenticated state
 */
setup('authenticate', async ({ page }) => {
  // Generate unique test user
  const testEmail = `test+${Date.now()}@qrconnect.test`;
  const testPassword = 'Test1234!';

  console.log(`Setting up test user: ${testEmail}`);

  // Mock authentication API endpoints
  await page.route('**/auth/register', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: '1',
          email: testEmail,
          businessName: 'Test Business Inc',
          phone: '+91 98765 43210',
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }),
    });
  });

  await page.route('**/campaigns', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/login');

  // Switch to signup tab if it exists
  const signupTab = page.getByRole('button', { name: /sign up/i }).first();
  const isVisible = await signupTab.isVisible().catch(() => false);

  if (isVisible) {
    await signupTab.click();
  }

  // Fill registration form
  const businessNameInput = page.getByLabel(/business name/i);
  const businessNameVisible = await businessNameInput.isVisible().catch(() => false);

  if (businessNameVisible) {
    await businessNameInput.fill('Test Business Inc');
  }

  const phoneInput = page.getByLabel(/phone/i);
  const phoneVisible = await phoneInput.isVisible().catch(() => false);

  if (phoneVisible) {
    await phoneInput.fill('+91 98765 43210');
  }

  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/password/i).fill(testPassword);

  // Submit form
  await page.getByRole('button', { name: /create account|sign up/i }).click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

  // Verify dashboard loaded
  await expect(
    page.getByRole('heading', { name: /dashboard/i })
  ).toBeVisible({ timeout: 10000 });

  // Save signed-in state to file
  await page.context().storageState({ path: authFile });

  console.log('✅ Authentication setup complete');
});
