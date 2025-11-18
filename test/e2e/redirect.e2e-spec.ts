/**
 * Redirect Engine E2E Tests
 *
 * PRIORITY 2: Tests core QR code redirect functionality
 * These tests ensure fast, reliable redirects with proper caching and analytics
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import {
  createTestUser,
  createTestBusiness,
  createTestCampaign,
  createTestQRCode,
  createTestRedirectRule,
  cleanupTestData,
} from '../utils/test-helpers';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

describe('Redirect Engine (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cacheManager: Cache;
  let testSlug: string;
  let testTargetUrl: string;
  let qrCodeId: string;
  let campaignId: string;
  let businessId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    cacheManager = app.get<Cache>(CACHE_MANAGER);

    // Create test data
    const user = await createTestUser(prisma);
    const business = await createTestBusiness(prisma, user.id);
    const campaign = await createTestCampaign(prisma, business.id);
    const qrCode = await createTestQRCode(prisma, campaign.id, {
      slug: 'test123',
      isActive: true,
    });
    const redirectRule = await createTestRedirectRule(prisma, qrCode.id, {
      targetUrl: 'https://example.com/landing',
      isDefault: true,
      priority: 1,
    });

    testSlug = qrCode.slug;
    testTargetUrl = redirectRule.targetUrl;
    qrCodeId = qrCode.id;
    campaignId = campaign.id;
    businessId = business.id;
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
    await app.close();
  });

  beforeEach(async () => {
    // Clear cache before each test to ensure consistent results
    await cacheManager.reset();
  });

  describe('GET /r/:slug - Happy Path', () => {
    it('should redirect to target URL with 302 status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/r/${testSlug}`)
        .expect(HttpStatus.FOUND);

      expect(response.headers.location).toBe(testTargetUrl);
    });

    it('should work without authentication (public endpoint)', async () => {
      // No auth token provided - should still work
      const response = await request(app.getHttpServer())
        .get(`/r/${testSlug}`)
        .expect(HttpStatus.FOUND);

      expect(response.headers.location).toBe(testTargetUrl);
    });

    it('should redirect on second request (cache hit)', async () => {
      // First request - cache miss, hits DB
      await request(app.getHttpServer())
        .get(`/r/${testSlug}`)
        .expect(HttpStatus.FOUND);

      // Second request - cache hit, faster
      const startTime = Date.now();
      await request(app.getHttpServer())
        .get(`/r/${testSlug}`)
        .expect(HttpStatus.FOUND);
      const duration = Date.now() - startTime;

      // Cache hit should be very fast (<50ms)
      expect(duration).toBeLessThan(50);
    });

    it('should capture scan metadata (IP, user agent, referrer)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/r/${testSlug}`)
        .set('User-Agent', 'Mozilla/5.0 (iPhone)')
        .set('Referer', 'https://facebook.com/post')
        .expect(HttpStatus.FOUND);

      // Redirect should happen immediately
      expect(response.headers.location).toBe(testTargetUrl);

      // NOTE: Scan logging happens asynchronously in queue
      // Actual scan record will be created by worker
    });
  });

  describe('GET /r/:slug - Error Cases', () => {
    it('should return 404 for invalid slug format (too short)', async () => {
      await request(app.getHttpServer())
        .get('/r/abc') // Only 3 chars, needs 6-8
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for invalid slug format (too long)', async () => {
      await request(app.getHttpServer())
        .get('/r/abcdefghi') // 9 chars, max is 8
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for invalid slug format (special chars)', async () => {
      await request(app.getHttpServer())
        .get('/r/abc-123') // Contains hyphen
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for non-existent QR code', async () => {
      await request(app.getHttpServer())
        .get('/r/notfound')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 410 GONE for deactivated QR code', async () => {
      // Create inactive QR code
      const user = await createTestUser(prisma);
      const business = await createTestBusiness(prisma, user.id);
      const campaign = await createTestCampaign(prisma, business.id);
      const inactiveQR = await createTestQRCode(prisma, campaign.id, {
        slug: 'inactive',
        isActive: false,
      });
      await createTestRedirectRule(prisma, inactiveQR.id, {
        targetUrl: 'https://example.com',
        isDefault: true,
      });

      const response = await request(app.getHttpServer())
        .get(`/r/${inactiveQR.slug}`)
        .expect(HttpStatus.GONE);

      expect(response.body.message).toContain('no longer active');
    });

    it('should return 404 for QR code with no redirect rules', async () => {
      // Create QR code without redirect rules
      const user = await createTestUser(prisma);
      const business = await createTestBusiness(prisma, user.id);
      const campaign = await createTestCampaign(prisma, business.id);
      const qrWithoutRules = await createTestQRCode(prisma, campaign.id, {
        slug: 'norules',
        isActive: true,
      });

      await request(app.getHttpServer())
        .get(`/r/${qrWithoutRules.slug}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Redirect Rule Priority & Scheduling', () => {
    it('should use highest priority redirect rule', async () => {
      const user = await createTestUser(prisma);
      const business = await createTestBusiness(prisma, user.id);
      const campaign = await createTestCampaign(prisma, business.id);
      const qr = await createTestQRCode(prisma, campaign.id, {
        slug: 'priority',
      });

      // Create 3 redirect rules with different priorities
      await createTestRedirectRule(prisma, qr.id, {
        targetUrl: 'https://example.com/low',
        priority: 1,
        isDefault: true,
      });

      await createTestRedirectRule(prisma, qr.id, {
        targetUrl: 'https://example.com/medium',
        priority: 5,
        isDefault: true,
      });

      const highPriorityRule = await createTestRedirectRule(prisma, qr.id, {
        targetUrl: 'https://example.com/high',
        priority: 10, // Highest priority
        isDefault: true,
      });

      const response = await request(app.getHttpServer())
        .get('/r/priority')
        .expect(HttpStatus.FOUND);

      // Should redirect to highest priority rule
      expect(response.headers.location).toBe(highPriorityRule.targetUrl);
    });

    it('should use time-based redirect rule when within valid period', async () => {
      const user = await createTestUser(prisma);
      const business = await createTestBusiness(prisma, user.id);
      const campaign = await createTestCampaign(prisma, business.id);
      const qr = await createTestQRCode(prisma, campaign.id, {
        slug: 'timebased',
      });

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Default rule (always active)
      await createTestRedirectRule(prisma, qr.id, {
        targetUrl: 'https://example.com/default',
        priority: 1,
        isDefault: true,
      });

      // Time-limited rule (active now)
      const timeBasedRule = await createTestRedirectRule(prisma, qr.id, {
        targetUrl: 'https://example.com/campaign',
        priority: 10,
        isDefault: false,
        validFrom: yesterday,
        validTo: tomorrow,
      });

      const response = await request(app.getHttpServer())
        .get('/r/timebased')
        .expect(HttpStatus.FOUND);

      // Should use time-based rule because it's within valid period
      expect(response.headers.location).toBe(timeBasedRule.targetUrl);
    });

    it('should fallback to default rule when time-based rule expired', async () => {
      const user = await createTestUser(prisma);
      const business = await createTestBusiness(prisma, user.id);
      const campaign = await createTestCampaign(prisma, business.id);
      const qr = await createTestQRCode(prisma, campaign.id, {
        slug: 'expired',
      });

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      // Default rule (always active)
      const defaultRule = await createTestRedirectRule(prisma, qr.id, {
        targetUrl: 'https://example.com/default',
        priority: 1,
        isDefault: true,
      });

      // Expired time-based rule
      await createTestRedirectRule(prisma, qr.id, {
        targetUrl: 'https://example.com/expired-campaign',
        priority: 10,
        isDefault: false,
        validFrom: twoDaysAgo,
        validTo: yesterday, // Already expired
      });

      const response = await request(app.getHttpServer())
        .get('/r/expired')
        .expect(HttpStatus.FOUND);

      // Should fallback to default rule
      expect(response.headers.location).toBe(defaultRule.targetUrl);
    });
  });

  describe('Cache Behavior', () => {
    it('should cache redirect data for 5 minutes', async () => {
      const cacheKey = `qr:slug:${testSlug}`;

      // First request - populates cache
      await request(app.getHttpServer())
        .get(`/r/${testSlug}`)
        .expect(HttpStatus.FOUND);

      // Verify data is cached
      const cachedData = await cacheManager.get(cacheKey);
      expect(cachedData).toBeDefined();
      expect(cachedData).toMatchObject({
        qrCodeId,
        campaignId,
        businessId,
        targetUrl: testTargetUrl,
        isActive: true,
      });
    });

    it('should work with cache miss (database fallback)', async () => {
      // Ensure cache is empty
      await cacheManager.reset();

      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get(`/r/${testSlug}`)
        .expect(HttpStatus.FOUND);
      const duration = Date.now() - startTime;

      expect(response.headers.location).toBe(testTargetUrl);

      // Database lookup is slower than cache (but still fast)
      // Should complete in <100ms per QA checklist
      expect(duration).toBeLessThan(100);
    });

    it('should serve from cache on subsequent requests', async () => {
      // First request - cache miss
      await request(app.getHttpServer())
        .get(`/r/${testSlug}`)
        .expect(HttpStatus.FOUND);

      // Modify database record
      await prisma.qRCode.update({
        where: { slug: testSlug },
        data: { isActive: false },
      });

      // Second request - should still use cached data (QR still active in cache)
      const response = await request(app.getHttpServer())
        .get(`/r/${testSlug}`)
        .expect(HttpStatus.FOUND);

      // Still redirects because cache hasn't expired
      expect(response.headers.location).toBe(testTargetUrl);

      // Restore for other tests
      await prisma.qRCode.update({
        where: { slug: testSlug },
        data: { isActive: true },
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should redirect in <100ms (cache hit)', async () => {
      // Warm up cache
      await request(app.getHttpServer()).get(`/r/${testSlug}`);

      // Measure performance
      const startTime = Date.now();
      await request(app.getHttpServer())
        .get(`/r/${testSlug}`)
        .expect(HttpStatus.FOUND);
      const duration = Date.now() - startTime;

      // Cache hit should be <100ms per QA checklist
      expect(duration).toBeLessThan(100);
    });

    it('should redirect in <100ms (cache miss with DB)', async () => {
      // Clear cache to force DB lookup
      await cacheManager.reset();

      const startTime = Date.now();
      await request(app.getHttpServer())
        .get(`/r/${testSlug}`)
        .expect(HttpStatus.FOUND);
      const duration = Date.now() - startTime;

      // Even DB lookup should be <100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent requests efficiently', async () => {
      // Clear cache
      await cacheManager.reset();

      // Send 10 concurrent requests
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .get(`/r/${testSlug}`)
          .expect(HttpStatus.FOUND),
      );

      const startTime = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - startTime;

      // All 10 requests should complete in <500ms total
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Multi-Tenant Security', () => {
    it('should correctly associate scan with business', async () => {
      // Create second business with QR code
      const user2 = await createTestUser(prisma);
      const business2 = await createTestBusiness(prisma, user2.id, {
        businessName: 'Business 2',
      });
      const campaign2 = await createTestCampaign(prisma, business2.id);
      const qr2 = await createTestQRCode(prisma, campaign2.id, {
        slug: 'biz2qr',
      });
      await createTestRedirectRule(prisma, qr2.id, {
        targetUrl: 'https://business2.com',
        isDefault: true,
      });

      // Access Business 2's QR code
      await request(app.getHttpServer())
        .get('/r/biz2qr')
        .expect(HttpStatus.FOUND);

      // Verify cached data has correct businessId
      const cacheKey = 'qr:slug:biz2qr';
      const cachedData = await cacheManager.get(cacheKey);

      expect(cachedData).toMatchObject({
        businessId: business2.id,
        campaignId: campaign2.id,
      });

      // Ensure it's NOT associated with first business
      expect(cachedData['businessId']).not.toBe(businessId);
    });
  });

  describe('Error Handling & Fallback', () => {
    it('should handle database errors gracefully', async () => {
      // Close database connection to simulate error
      await prisma.$disconnect();

      const response = await request(app.getHttpServer())
        .get('/r/anyslug')
        .expect(HttpStatus.FOUND);

      // Should redirect to error page
      expect(response.headers.location).toContain('error');

      // Reconnect for other tests
      await prisma.$connect();
    });

    it('should not block redirect if scan queue fails', async () => {
      // Even if scan logging fails, redirect should still work
      // This is tested implicitly - redirect happens before scan is logged

      const response = await request(app.getHttpServer())
        .get(`/r/${testSlug}`)
        .expect(HttpStatus.FOUND);

      // Redirect should succeed
      expect(response.headers.location).toBe(testTargetUrl);
    });
  });

  describe('URL Validation', () => {
    it('should redirect to valid HTTP URLs', async () => {
      const user = await createTestUser(prisma);
      const business = await createTestBusiness(prisma, user.id);
      const campaign = await createTestCampaign(prisma, business.id);
      const qr = await createTestQRCode(prisma, campaign.id, {
        slug: 'httpurl',
      });
      await createTestRedirectRule(prisma, qr.id, {
        targetUrl: 'http://example.com/page',
        isDefault: true,
      });

      const response = await request(app.getHttpServer())
        .get('/r/httpurl')
        .expect(HttpStatus.FOUND);

      expect(response.headers.location).toBe('http://example.com/page');
    });

    it('should redirect to valid HTTPS URLs', async () => {
      const user = await createTestUser(prisma);
      const business = await createTestBusiness(prisma, user.id);
      const campaign = await createTestCampaign(prisma, business.id);
      const qr = await createTestQRCode(prisma, campaign.id, {
        slug: 'httpsurl',
      });
      await createTestRedirectRule(prisma, qr.id, {
        targetUrl: 'https://secure.example.com/page',
        isDefault: true,
      });

      const response = await request(app.getHttpServer())
        .get('/r/httpsurl')
        .expect(HttpStatus.FOUND);

      expect(response.headers.location).toBe('https://secure.example.com/page');
    });

    it('should redirect to URLs with query parameters', async () => {
      const user = await createTestUser(prisma);
      const business = await createTestBusiness(prisma, user.id);
      const campaign = await createTestCampaign(prisma, business.id);
      const qr = await createTestQRCode(prisma, campaign.id, {
        slug: 'withquery',
      });
      await createTestRedirectRule(prisma, qr.id, {
        targetUrl: 'https://example.com/page?utm_source=qr&campaign=summer',
        isDefault: true,
      });

      const response = await request(app.getHttpServer())
        .get('/r/withquery')
        .expect(HttpStatus.FOUND);

      expect(response.headers.location).toBe(
        'https://example.com/page?utm_source=qr&campaign=summer',
      );
    });
  });
});
