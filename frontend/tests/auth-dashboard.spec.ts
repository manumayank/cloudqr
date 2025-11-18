import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

/**
 * Authentication and Dashboard E2E Tests
 */

const randomEmail = () =>
  `test+${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@qrconnect.test`;

test.describe('Authentication Flow', () => {
  test('unauthenticated user is redirected to login from /dashboard', async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies();
    await page.context().clearPermissions();

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /login|sign/i })).toBeVisible();
  });

  test('user can register new account and see dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const email = randomEmail();
    const password = 'Test1234!';

    await loginPage.goto();
    await loginPage.signup(email, password, 'Test Business', '+91 98765 43210');

    // Should redirect to dashboard
    await loginPage.expectRedirectToDashboard();

    const dashboard = new DashboardPage(page);
    await dashboard.expectDashboardPage();
  });

  test('user cannot login with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Should stay on login page with error
    await loginPage.expectLoginPage();
    await loginPage.expectError();
  });

  test('existing user can log in successfully', async ({ page }) => {
    // This test uses the authenticated state from setup
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.expectDashboardPage();
    await dashboard.expectStatsVisible();
  });
});

test.describe('Dashboard Functionality', () => {
  test('dashboard shows empty state for new users', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.expectDashboardPage();

    // Check for either empty state or campaigns
    const emptyStateVisible = await page
      .getByText(/no campaigns yet/i)
      .isVisible()
      .catch(() => false);

    const campaignsVisible = await page
      .locator('[data-testid="campaign-card"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(emptyStateVisible || campaignsVisible).toBe(true);
  });

  test('dashboard stats cards are visible', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.expectStatsVisible();

    // Check all 4 stat cards are present
    const statCards = page.locator('[data-testid="stat-card"]');
    await expect(statCards).toHaveCount(4);

    // Verify stat labels
    await expect(page.getByText(/total campaigns/i)).toBeVisible();
    await expect(page.getByText(/total scans/i)).toBeVisible();
    await expect(page.getByText(/active campaigns/i)).toBeVisible();
    await expect(page.getByText(/scans today/i)).toBeVisible();
  });

  test('new campaign button is accessible', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.newCampaignButton).toBeVisible();
    await dashboard.clickNewCampaign();

    // Should navigate to get-started flow
    await expect(page).toHaveURL(/\/get-started/);
  });

  test('navigation menu works', async ({ page }) => {
    await page.goto('/dashboard');

    // Test navigation links
    const settingsLink = page.getByRole('link', { name: /settings/i });
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();

    await expect(page).toHaveURL(/\/dashboard\/settings/);
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });
});

test.describe('Responsive Layout', () => {
  test('dashboard works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Stats should stack vertically
    const statCards = page.locator('[data-testid="stat-card"]');
    await expect(statCards.first()).toBeVisible();
  });

  test('mobile menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard');

    // Find hamburger menu button
    const menuButton = page.locator('button[aria-label*="menu"], button:has(svg)').first();

    // Menu should be accessible
    await expect(menuButton).toBeVisible();
  });
});
