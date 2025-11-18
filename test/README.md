# QRConnect Backend - Test Suite

This directory contains the comprehensive test suite for QRConnect backend, including unit tests, E2E tests, and integration tests.

## 📁 Directory Structure

```
test/
├── unit/                       # Unit tests for services
│   ├── auth.service.spec.ts           # Auth service tests
│   ├── multi-tenant-security.spec.ts  # Multi-tenant isolation tests (CRITICAL)
│   └── payments-webhook.spec.ts       # Payment webhook security tests
├── e2e/                        # End-to-end tests (coming soon)
│   ├── auth.e2e-spec.ts
│   ├── redirect.e2e-spec.ts
│   └── campaigns.e2e-spec.ts
├── integration/                # Integration tests (coming soon)
│   ├── redis.integration.spec.ts
│   └── s3.integration.spec.ts
├── utils/                      # Test utilities
│   └── test-helpers.ts        # Factory functions for test data
├── jest-e2e.json              # Jest config for E2E tests
├── setup.ts                    # Global test setup
├── QA_CHECKLIST.md            # Comprehensive QA checklist
└── README.md                   # This file
```

## 🚀 Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### With Coverage Report
```bash
npm run test:cov
```

### E2E Tests Only
```bash
npm run test:e2e
```

### Specific Test File
```bash
npm test auth.service.spec.ts
```

### Specific Test Suite
```bash
npm test -- --testNamePattern="Multi-Tenant"
```

## 🎯 Test Priority & Critical Tests

### Priority 1: CRITICAL Security Tests ⚠️

These tests MUST pass before any deployment. They protect against data breaches and security vulnerabilities.

#### 1. Multi-Tenant Security Tests
**File:** `test/unit/multi-tenant-security.spec.ts`
**Why Critical:** Prevents Business A from accessing Business B's data

**Key Tests:**
- Cross-tenant campaign access blocked
- Cross-tenant QR code access blocked
- Cross-tenant form submission access blocked
- Cross-tenant order access blocked
- Business ownership verification
- Admin role bypass verification

**Run:**
```bash
npm test multi-tenant-security.spec.ts
```

#### 2. Payment Webhook Security Tests
**File:** `test/unit/payments-webhook.spec.ts`
**Why Critical:** Prevents payment fraud and ensures reliable payment processing

**Key Tests:**
- HMAC-SHA256 signature verification
- Invalid signature rejection
- Man-in-the-middle attack prevention
- Webhook replay attack prevention
- Idempotency verification
- Payment amount tampering prevention

**Run:**
```bash
npm test payments-webhook.spec.ts
```

#### 3. Auth Service Tests
**File:** `test/unit/auth.service.spec.ts`
**Why Critical:** Ensures secure authentication and authorization

**Key Tests:**
- Password hashing (bcrypt cost 12)
- Invalid credential rejection
- Inactive user blocking
- Refresh token rotation
- Email duplication prevention
- JWT payload correctness

**Run:**
```bash
npm test auth.service.spec.ts
```

### Priority 2: Important Functional Tests

Coming soon:
- Redirect engine tests
- Campaign management tests
- Form submission tests
- Order processing tests

## 📝 Test Utilities

### Test Helpers
**File:** `test/utils/test-helpers.ts`

Provides factory functions for creating test data with proper relationships:

```typescript
import { createTestUser, createTestBusiness, createTestCampaign } from '../utils/test-helpers';

// Create user
const user = await createTestUser(prisma, {
  email: 'test@example.com',
  password: 'Test123!',
});

// Create business for user
const business = await createTestBusiness(prisma, user.id, {
  businessName: 'Test Restaurant',
});

// Create complete environment (user, business, campaign, QR, rule)
const env = await createTestEnvironment(prisma);
```

### Cleanup Helper
```typescript
import { cleanupTestData } from '../utils/test-helpers';

afterAll(async () => {
  await cleanupTestData(prisma);
});
```

## 🔧 Test Configuration

### Jest Configuration
**File:** `jest.config.js` (root)

- Test environment: Node.js
- Test regex: `*.spec.ts`
- Coverage threshold: 70% (services)
- Timeout: 30 seconds for integration tests

### E2E Configuration
**File:** `test/jest-e2e.json`

- Test regex: `*.e2e-spec.ts`
- Requires test database

## 🗄️ Test Database Setup

### Create Test Database
```bash
# Create test database
createdb qrconnect_test

# Set up environment
cp .env .env.test

# Update .env.test with test database URL
DATABASE_URL="postgresql://user:password@localhost:5432/qrconnect_test"

# Run migrations
NODE_ENV=test npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Reset Test Database
```bash
# Drop and recreate
dropdb qrconnect_test && createdb qrconnect_test
NODE_ENV=test npx prisma migrate deploy
```

## 📊 Coverage Goals

**Target Coverage:**
- **Overall:** >70%
- **Services:** >80%
- **Controllers:** >70%
- **Critical paths:** 100% (auth, multi-tenant, payments)

**Check Coverage:**
```bash
npm run test:cov
```

Coverage report will be generated in `coverage/` directory. Open `coverage/lcov-report/index.html` in a browser to view detailed report.

## ✅ QA Checklist

**File:** `test/QA_CHECKLIST.md`

Comprehensive checklist for pre-deployment verification. Includes:
- Automated tests checklist
- Manual functional tests
- Performance tests
- Security tests
- Integration tests
- Post-deployment verification

**Use before every deployment!**

## 🐛 Debugging Tests

### Run Tests in Debug Mode
```bash
# Using VS Code debugger
# Add breakpoint in test file
# Run "Jest: Debug" from VS Code

# Or use Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Verbose Output
```bash
npm test -- --verbose
```

### Only Failed Tests
```bash
npm test -- --onlyFailures
```

### Clear Jest Cache
```bash
npm test -- --clearCache
```

## 📈 Test Metrics

### Current Status
- ✅ **Unit Tests:** 3 critical test files implemented
- ⏳ **E2E Tests:** Coming soon
- ⏳ **Integration Tests:** Coming soon

### Test Files Implemented
1. ✅ `multi-tenant-security.spec.ts` (46 test cases)
2. ✅ `auth.service.spec.ts` (20+ test cases)
3. ✅ `payments-webhook.spec.ts` (25+ test cases)

### Total Test Coverage
- **Test Files:** 3
- **Test Suites:** 15+
- **Test Cases:** 90+
- **Critical Security Tests:** 46

## 🚨 Common Issues & Solutions

### Issue: Prisma Client Not Generated
**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
npx prisma generate
npm test
```

### Issue: Database Connection Errors
**Error:** `Connection refused` or `Database not found`

**Solution:**
```bash
# Ensure PostgreSQL is running
pg_isready

# Check DATABASE_URL in .env.test
cat .env.test | grep DATABASE_URL

# Recreate test database
createdb qrconnect_test
NODE_ENV=test npx prisma migrate deploy
```

### Issue: Test Timeout
**Error:** `Timeout - Async callback was not invoked within the 5000ms timeout`

**Solution:**
```typescript
// Increase timeout for specific test
it('slow test', async () => {
  // test code
}, 30000); // 30 seconds

// Or globally in setup.ts
jest.setTimeout(30000);
```

### Issue: Module Resolution Errors
**Error:** `Cannot find module 'src/...'`

**Solution:**
```bash
# Clear Jest cache
npm test -- --clearCache

# Ensure moduleNameMapper is correct in jest.config.js
```

## 📖 Writing New Tests

### Unit Test Template
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from '../../src/modules/your/your.service';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        // Mock dependencies
      ],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('yourMethod', () => {
    it('should do something correctly', async () => {
      // Arrange
      const input = 'test-input';

      // Act
      const result = await service.yourMethod(input);

      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

### E2E Test Template
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('YourController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/your-endpoint (GET)', () => {
    return request(app.getHttpServer())
      .get('/your-endpoint')
      .expect(200)
      .expect('Content-Type', /json/);
  });
});
```

## 🔗 Related Documentation

- [API Reference](../API_REFERENCE.md) - Complete API documentation
- [Testing Plan](../MVP_TESTING_PLAN.md) - Comprehensive testing strategy
- [Deployment Checklist](../DEPLOYMENT_CHECKLIST.md) - Pre-deployment verification
- [Build Status](../BUILD_STATUS.md) - Current implementation status

## 👥 Contributing to Tests

### Before Adding Tests
1. Check if similar test exists
2. Follow existing naming conventions
3. Use test helpers for data creation
4. Clean up test data in `afterEach`/`afterAll`

### Test Naming Convention
```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // test code
    });

    it('should throw [ExceptionType] if [error condition]', () => {
      // test code
    });
  });
});
```

### Pull Request Requirements
- [ ] All new tests pass
- [ ] All existing tests still pass
- [ ] Coverage not decreased
- [ ] Critical paths tested
- [ ] Tests documented in PR description

## 📞 Support

For questions about tests or testing strategy:
- Review QA_CHECKLIST.md
- Check existing test examples
- Consult team lead

---

**Last Updated:** 2025-11-18
**Test Suite Version:** 1.0
**Compatible with:** QRConnect Backend v1.0.0+
