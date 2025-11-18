# QRConnect Frontend - Testing Guide

Comprehensive guide for running and writing tests for the QRConnect frontend.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Page Object Model](#page-object-model)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 20+
- Frontend running on `http://localhost:3001`
- Backend running on `http://localhost:3000` (for API calls)

### Install Dependencies

```bash
cd frontend
npm install
```

### Install Playwright Browsers

```bash
npx playwright install
```

### Run All Tests

```bash
npm run test:e2e
```

---

## Test Structure

```
frontend/
├── tests/
│   ├── pages/              # Page Object Model classes
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   ├── GetStartedPage.ts
│   │   ├── EditorPage.ts
│   │   └── CheckoutPage.ts
│   ├── auth.setup.ts       # Auth setup (runs once)
│   ├── auth-dashboard.spec.ts    # Auth & dashboard tests
│   └── get-started.spec.ts       # Onboarding flow tests
├── playwright.config.ts    # Playwright configuration
└── playwright/
    └── .auth/
        └── user.json       # Saved auth state
```

---

## Running Tests

### All Tests (Headless)

```bash
npm run test:e2e
```

### With UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

This opens a browser where you can:
- See tests running in real-time
- Debug failures
- Re-run specific tests
- Time travel through test steps

### Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### Debug Mode (Step-by-Step)

```bash
npm run test:e2e:debug
```

### Specific Test File

```bash
npx playwright test auth-dashboard
```

### Specific Test

```bash
npx playwright test -g "user can register"
```

### Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Mobile Browsers

```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### View Report

After running tests:

```bash
npm run test:report
```

---

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/some-page');

    // Act
    await page.getByRole('button', { name: /click me/i }).click();

    // Assert
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

### Using Page Object Model

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  await loginPage.expectRedirectToDashboard();
});
```

### Best Practices

1. **Use Semantic Selectors**

```typescript
// ✅ Good - role-based, resilient to text changes
await page.getByRole('button', { name: /submit/i });
await page.getByLabel(/email/i);

// ❌ Bad - fragile, breaks with styling changes
await page.click('.btn-primary');
await page.fill('#email-input');
```

2. **Use data-testid for Dynamic Content**

```typescript
// Component
<Card data-testid="campaign-card">

// Test
await page.locator('[data-testid="campaign-card"]').first().click();
```

3. **Wait for Elements Properly**

```typescript
// ✅ Good - explicit wait
await expect(page.getByText('Success')).toBeVisible();

// ❌ Bad - flaky, race condition
await page.waitForTimeout(1000);
```

4. **Use Page Object Model**

Encapsulate page interactions:

```typescript
// tests/pages/MyPage.ts
export class MyPage {
  readonly page: Page;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.submitButton = page.getByRole('button', { name: /submit/i });
  }

  async submit() {
    await this.submitButton.click();
  }
}
```

5. **Test User Flows, Not Implementation**

```typescript
// ✅ Good - tests user behavior
test('user can create campaign', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: /new campaign/i }).click();
  // ... complete flow
  await expect(page).toHaveURL(/\/dashboard\/campaigns\//);
});

// ❌ Bad - tests implementation details
test('clicking button calls API', async ({ page }) => {
  // Don't test internal state/API calls
});
```

---

## Page Object Model

### Creating a New Page Object

```typescript
// tests/pages/MyNewPage.ts
import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class MyNewPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /my page/i });
    this.submitButton = page.getByRole('button', { name: /submit/i });
  }

  async goto() {
    await this.page.goto('/my-page');
  }

  async expectPage() {
    await expect(this.page).toHaveURL(/\/my-page/);
    await expect(this.heading).toBeVisible();
  }

  async submit() {
    await this.submitButton.click();
  }
}
```

### Using in Tests

```typescript
import { MyNewPage } from './pages/MyNewPage';

test('my page works', async ({ page }) => {
  const myPage = new MyNewPage(page);

  await myPage.goto();
  await myPage.expectPage();
  await myPage.submit();
});
```

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Pull requests (to `main` or `develop`)
- Pushes to `main` or `develop`

See `.github/workflows/frontend-tests.yml` for configuration.

### Running Tests in CI

The workflow:
1. Installs dependencies
2. Installs Playwright browsers
3. Runs all E2E tests
4. Uploads test reports as artifacts
5. Runs lint and type-check
6. Builds the app

### Viewing Test Results in CI

1. Go to **Actions** tab in GitHub
2. Click on the workflow run
3. Download artifacts:
   - `playwright-report` - HTML report
   - `test-results` - Screenshots/videos

---

## Troubleshooting

### Tests Fail Locally

**Issue:** Tests pass in CI but fail locally

**Solution:**
```bash
# Clear auth state
rm -rf playwright/.auth/

# Reinstall browsers
npx playwright install --force

# Run setup again
npx playwright test auth.setup.ts
```

### Port Already in Use

**Issue:** `EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port in playwright.config.ts
baseURL: 'http://localhost:3002'
```

### Selector Not Found

**Issue:** `Timeout 10000ms exceeded waiting for selector`

**Solution:**
```typescript
// Increase timeout for slow operations
await expect(page.getByText('Slow loading')).toBeVisible({ timeout: 30000 });

// Or check if element exists first
const isVisible = await page.getByText('Maybe').isVisible().catch(() => false);
if (isVisible) {
  // Do something
}
```

### Authentication Issues

**Issue:** Tests fail with 401 or redirect to login

**Solution:**
```bash
# Regenerate auth state
rm -rf playwright/.auth/
npx playwright test auth.setup.ts
```

### Flaky Tests

**Issue:** Tests pass/fail intermittently

**Solution:**
```typescript
// Use explicit waits
await expect(page.getByText('Loaded')).toBeVisible();

// Not:
await page.waitForTimeout(1000); // ❌ Flaky

// Wait for network idle
await page.waitForLoadState('networkidle');

// Retry flaky tests
test.describe.configure({ retries: 2 });
```

### Debugging Failed Tests

```bash
# Run with debug mode
npm run test:e2e:debug

# Run with headed mode to see browser
npm run test:e2e:headed

# Run specific test
npx playwright test -g "failing test name" --debug
```

### Trace Viewer

View trace for failed tests:

```bash
# After a failed test run
npx playwright show-trace test-results/auth-dashboard-spec/trace.zip
```

This opens a UI where you can:
- See each step
- View DOM snapshots
- See network requests
- Check console logs

---

## Advanced Topics

### API Mocking

Mock backend responses for faster tests:

```typescript
test('shows campaigns from API', async ({ page }) => {
  // Mock API response
  await page.route('**/api/campaigns', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: '1', name: 'Test Campaign', scans: 100 }
      ]),
    });
  });

  await page.goto('/dashboard');
  await expect(page.getByText('Test Campaign')).toBeVisible();
});
```

### Screenshot on Failure

Automatically taken, but you can also manually capture:

```typescript
test('my test', async ({ page }) => {
  await page.goto('/dashboard');

  // Manually capture screenshot
  await page.screenshot({ path: 'debug-screenshot.png' });
});
```

### Video Recording

Configured in `playwright.config.ts`:

```typescript
use: {
  video: 'retain-on-failure', // or 'on', 'off'
}
```

### Parallel Execution

```bash
# Run tests in parallel (default)
npx playwright test

# Run sequentially
npx playwright test --workers=1
```

### Test Isolation

Each test gets a fresh browser context (cookies, localStorage cleared).

To share state between tests, use `storageState`:

```typescript
// Save state
await page.context().storageState({ path: 'auth.json' });

// Load state
test.use({ storageState: 'auth.json' });
```

---

## Coverage & Metrics

### Test Coverage

Currently covered:
- ✅ Authentication (login, signup, logout)
- ✅ Dashboard (stats, campaigns list, navigation)
- ✅ Get Started wizard (persona, use case, editor, checkout)
- ✅ Responsive layout (mobile, tablet, desktop)

To add:
- ⏳ Campaign detail page interactions
- ⏳ Analytics page with charts
- ⏳ Feedback submissions
- ⏳ Settings page

### Test Metrics

Target metrics:
- **Coverage:** 80%+ of critical user flows
- **Pass Rate:** 95%+ on main branch
- **Duration:** < 5 minutes for full suite
- **Flakiness:** < 2% retry rate

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Guide](https://playwright.dev/docs/ci)

---

**For questions or issues, contact the QRConnect engineering team.**
