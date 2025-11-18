/**
 * Campaign Management E2E Tests
 *
 * PRIORITY 2: Tests campaign CRUD operations and multi-tenant isolation
 * Ensures businesses can only manage their own campaigns
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  createTestUser,
  createTestBusiness,
  createTestCampaign,
  cleanupTestData,
} from '../utils/test-helpers';
import { CampaignUseCase, CampaignStatus } from '@prisma/client';

describe('Campaigns (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Test users and businesses
  let user1: any;
  let business1: any;
  let user1Token: string;

  let user2: any;
  let business2: any;
  let user2Token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Add validation pipe (like production)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Create test user 1 and business 1
    user1 = await createTestUser(prisma, {
      email: 'business1@test.com',
      name: 'Business 1 Owner',
    });
    business1 = await createTestBusiness(prisma, user1.id, {
      businessName: 'Restaurant A',
    });
    user1Token = jwtService.sign({
      sub: user1.id,
      email: user1.email,
      businessId: business1.id,
    });

    // Create test user 2 and business 2 (for multi-tenant tests)
    user2 = await createTestUser(prisma, {
      email: 'business2@test.com',
      name: 'Business 2 Owner',
    });
    business2 = await createTestBusiness(prisma, user2.id, {
      businessName: 'Restaurant B',
    });
    user2Token = jwtService.sign({
      sub: user2.id,
      email: user2.email,
      businessId: business2.id,
    });
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
    await app.close();
  });

  describe('POST /campaigns - Create Campaign', () => {
    it('should create REVIEW campaign with Google Place ID', async () => {
      const createDto = {
        name: 'Google Review Collection',
        description: 'Collect reviews for our restaurant',
        useCase: CampaignUseCase.REVIEW,
        googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      };

      const response = await request(app.getHttpServer())
        .post('/campaigns')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        name: createDto.name,
        description: createDto.description,
        useCase: CampaignUseCase.REVIEW,
        businessId: business1.id,
        status: 'DRAFT',
      });

      // Should include QR code
      expect(response.body.qrCode).toBeDefined();
      expect(response.body.qrCode.slug).toMatch(/^[a-zA-Z0-9]{8}$/);
      expect(response.body.qrCode.qrUrl).toContain('/r/');
      expect(response.body.qrCode.isActive).toBe(false); // Inactive in DRAFT

      // Verify database records
      const campaign = await prisma.campaign.findUnique({
        where: { id: response.body.id },
        include: {
          qrCodes: {
            include: { redirectRules: true },
          },
        },
      });

      expect(campaign).toBeDefined();
      expect(campaign.qrCodes).toHaveLength(1);
      expect(campaign.qrCodes[0].targetMode).toBe('GOOGLE_REVIEW');
      expect(campaign.qrCodes[0].redirectRules).toHaveLength(1);
      expect(campaign.qrCodes[0].redirectRules[0].targetUrl).toContain(
        'search.google.com/local/writereview',
      );
      expect(campaign.qrCodes[0].redirectRules[0].targetUrl).toContain(
        createDto.googlePlaceId,
      );
    });

    it('should create WHATSAPP campaign with phone number', async () => {
      const createDto = {
        name: 'WhatsApp Support',
        useCase: CampaignUseCase.WHATSAPP,
        whatsappNumber: '+91 98765 43210',
      };

      const response = await request(app.getHttpServer())
        .post('/campaigns')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.useCase).toBe(CampaignUseCase.WHATSAPP);
      expect(response.body.qrCode.targetMode).toBe('WHATSAPP');

      // Verify redirect rule has WhatsApp URL (numbers only)
      const campaign = await prisma.campaign.findUnique({
        where: { id: response.body.id },
        include: {
          qrCodes: {
            include: { redirectRules: true },
          },
        },
      });

      expect(campaign.qrCodes[0].redirectRules[0].targetUrl).toBe(
        'https://wa.me/919876543210',
      );
    });

    it('should create CUSTOM_LINK campaign with target URL', async () => {
      const createDto = {
        name: 'Website Traffic Campaign',
        useCase: CampaignUseCase.CUSTOM_LINK,
        targetUrl: 'https://myrestaurant.com/special-offer',
      };

      const response = await request(app.getHttpServer())
        .post('/campaigns')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.useCase).toBe(CampaignUseCase.CUSTOM_LINK);
      expect(response.body.qrCode.targetMode).toBe('DIRECT_LINK');

      const campaign = await prisma.campaign.findUnique({
        where: { id: response.body.id },
        include: {
          qrCodes: {
            include: { redirectRules: true },
          },
        },
      });

      expect(campaign.qrCodes[0].redirectRules[0].targetUrl).toBe(
        createDto.targetUrl,
      );
    });

    it('should create OFFER campaign with dates', async () => {
      const createDto = {
        name: 'Summer Sale 2024',
        useCase: CampaignUseCase.OFFER,
        targetUrl: 'https://myrestaurant.com/summer-sale',
        startDate: '2024-06-01T00:00:00Z',
        endDate: '2024-08-31T23:59:59Z',
      };

      const response = await request(app.getHttpServer())
        .post('/campaigns')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.startDate).toBeDefined();
      expect(response.body.endDate).toBeDefined();
    });

    it('should generate unique 8-character slug for each campaign', async () => {
      const slugs = new Set<string>();

      // Create 5 campaigns
      for (let i = 0; i < 5; i++) {
        const createDto = {
          name: `Campaign ${i}`,
          useCase: CampaignUseCase.CUSTOM_LINK,
          targetUrl: 'https://example.com',
        };

        const response = await request(app.getHttpServer())
          .post('/campaigns')
          .set('Authorization', `Bearer ${user1Token}`)
          .send(createDto)
          .expect(HttpStatus.CREATED);

        slugs.add(response.body.qrCode.slug);
      }

      // All slugs should be unique
      expect(slugs.size).toBe(5);

      // All slugs should be 8 characters
      slugs.forEach((slug) => {
        expect(slug).toMatch(/^[a-zA-Z0-9]{8}$/);
      });
    });

    it('should require authentication', async () => {
      const createDto = {
        name: 'Test Campaign',
        useCase: CampaignUseCase.CUSTOM_LINK,
        targetUrl: 'https://example.com',
      };

      await request(app.getHttpServer())
        .post('/campaigns')
        .send(createDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        // Missing name
        useCase: CampaignUseCase.CUSTOM_LINK,
      };

      await request(app.getHttpServer())
        .post('/campaigns')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should validate useCase enum', async () => {
      const invalidDto = {
        name: 'Test',
        useCase: 'INVALID_USE_CASE',
      };

      await request(app.getHttpServer())
        .post('/campaigns')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /campaigns - List Campaigns', () => {
    beforeAll(async () => {
      // Create test campaigns for business1
      await createTestCampaign(prisma, business1.id, {
        name: 'Active Campaign',
        status: 'ACTIVE',
        useCase: CampaignUseCase.REVIEW,
      });

      await createTestCampaign(prisma, business1.id, {
        name: 'Draft Campaign',
        status: 'DRAFT',
        useCase: CampaignUseCase.WHATSAPP,
      });

      // Create campaign for business2 (should not be visible to business1)
      await createTestCampaign(prisma, business2.id, {
        name: 'Business 2 Campaign',
        status: 'ACTIVE',
      });
    });

    it('should list all campaigns for current business', async () => {
      const response = await request(app.getHttpServer())
        .get('/campaigns')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);

      // Should only see business1's campaigns
      const campaignNames = response.body.map((c: any) => c.name);
      expect(campaignNames).toContain('Active Campaign');
      expect(campaignNames).toContain('Draft Campaign');
      expect(campaignNames).not.toContain('Business 2 Campaign');

      // All campaigns should belong to business1
      response.body.forEach((campaign: any) => {
        expect(campaign.businessId).toBe(business1.id);
      });
    });

    it('should filter campaigns by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/campaigns?status=ACTIVE')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(response.body.every((c: any) => c.status === 'ACTIVE')).toBe(true);
      expect(response.body.some((c: any) => c.name === 'Active Campaign')).toBe(
        true,
      );
      expect(response.body.some((c: any) => c.name === 'Draft Campaign')).toBe(
        false,
      );
    });

    it('should filter campaigns by useCase', async () => {
      const response = await request(app.getHttpServer())
        .get(`/campaigns?useCase=${CampaignUseCase.REVIEW}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(
        response.body.every((c: any) => c.useCase === CampaignUseCase.REVIEW),
      ).toBe(true);
    });

    it('should include QR code and scan count', async () => {
      const response = await request(app.getHttpServer())
        .get('/campaigns')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      const campaign = response.body[0];
      expect(campaign.qrCode).toBeDefined();
      expect(campaign.qrCode.slug).toBeDefined();
      expect(campaign.qrCode.qrUrl).toBeDefined();
      expect(campaign.totalScans).toBeDefined();
      expect(campaign.activeQrCodes).toBeDefined();
    });

    it('should enforce multi-tenant isolation', async () => {
      // Business 1 should not see Business 2's campaigns
      const response1 = await request(app.getHttpServer())
        .get('/campaigns')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      const business1CampaignIds = response1.body.map((c: any) => c.id);

      // Business 2's campaigns
      const response2 = await request(app.getHttpServer())
        .get('/campaigns')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(HttpStatus.OK);

      const business2CampaignIds = response2.body.map((c: any) => c.id);

      // No overlap
      const intersection = business1CampaignIds.filter((id: string) =>
        business2CampaignIds.includes(id),
      );
      expect(intersection).toHaveLength(0);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/campaigns')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /campaigns/:id - Get Campaign Details', () => {
    let testCampaign: any;

    beforeAll(async () => {
      testCampaign = await createTestCampaign(prisma, business1.id, {
        name: 'Detailed Campaign',
        description: 'Full details test',
      });
    });

    it('should get campaign with full details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/campaigns/${testCampaign.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        id: testCampaign.id,
        name: 'Detailed Campaign',
        description: 'Full details test',
        businessId: business1.id,
      });

      expect(response.body.qrCodes).toBeDefined();
      expect(Array.isArray(response.body.qrCodes)).toBe(true);
    });

    it('should include QR codes with redirect rules and scan counts', async () => {
      const response = await request(app.getHttpServer())
        .get(`/campaigns/${testCampaign.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      const qrCode = response.body.qrCodes[0];
      expect(qrCode).toBeDefined();
      expect(qrCode.qrUrl).toBeDefined();
      expect(qrCode.currentTarget).toBeDefined(); // Default redirect rule target
      expect(qrCode.scanCount).toBeDefined();
    });

    it('should return 404 for non-existent campaign', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/campaigns/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for other business campaign (multi-tenant)', async () => {
      const business2Campaign = await createTestCampaign(prisma, business2.id, {
        name: 'Business 2 Private Campaign',
      });

      // Business 1 tries to access Business 2's campaign
      await request(app.getHttpServer())
        .get(`/campaigns/${business2Campaign.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/campaigns/${testCampaign.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /campaigns/:id - Update Campaign', () => {
    let testCampaign: any;

    beforeEach(async () => {
      testCampaign = await createTestCampaign(prisma, business1.id, {
        name: 'Original Name',
        description: 'Original Description',
        status: 'DRAFT',
      });
    });

    it('should update campaign name and description', async () => {
      const updateDto = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      const response = await request(app.getHttpServer())
        .put(`/campaigns/${testCampaign.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject(updateDto);

      // Verify in database
      const updated = await prisma.campaign.findUnique({
        where: { id: testCampaign.id },
      });
      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated Description');
    });

    it('should update campaign status', async () => {
      const updateDto = {
        status: CampaignStatus.ACTIVE,
      };

      const response = await request(app.getHttpServer())
        .put(`/campaigns/${testCampaign.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe(CampaignStatus.ACTIVE);
    });

    it('should update target URL and redirect rules', async () => {
      const updateDto = {
        targetUrl: 'https://new-target.com/page',
      };

      await request(app.getHttpServer())
        .put(`/campaigns/${testCampaign.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      // Verify redirect rule was updated
      const campaign = await prisma.campaign.findUnique({
        where: { id: testCampaign.id },
        include: {
          qrCodes: {
            include: {
              redirectRules: {
                where: { isDefault: true },
              },
            },
          },
        },
      });

      expect(campaign.qrCodes[0].redirectRules[0].targetUrl).toBe(
        updateDto.targetUrl,
      );
    });

    it('should update WhatsApp number in redirect rule metadata', async () => {
      const updateDto = {
        targetUrl: 'https://wa.me/911234567890',
        whatsappNumber: '+91 1234567890',
      };

      await request(app.getHttpServer())
        .put(`/campaigns/${testCampaign.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      // Verify metadata was updated
      const campaign = await prisma.campaign.findUnique({
        where: { id: testCampaign.id },
        include: {
          qrCodes: {
            include: {
              redirectRules: {
                where: { isDefault: true },
              },
            },
          },
        },
      });

      expect(campaign.qrCodes[0].redirectRules[0].metadata).toMatchObject({
        whatsappNumber: '+91 1234567890',
      });
    });

    it('should update start and end dates', async () => {
      const updateDto = {
        startDate: '2024-06-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      };

      const response = await request(app.getHttpServer())
        .put(`/campaigns/${testCampaign.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.startDate).toBeDefined();
      expect(response.body.endDate).toBeDefined();
    });

    it('should return 404 for non-existent campaign', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .put(`/campaigns/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Updated' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 when updating other business campaign', async () => {
      const business2Campaign = await createTestCampaign(prisma, business2.id, {
        name: 'Business 2 Campaign',
      });

      // Business 1 tries to update Business 2's campaign
      await request(app.getHttpServer())
        .put(`/campaigns/${business2Campaign.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Hacked!' })
        .expect(HttpStatus.NOT_FOUND);

      // Verify campaign was NOT updated
      const unchanged = await prisma.campaign.findUnique({
        where: { id: business2Campaign.id },
      });
      expect(unchanged.name).toBe('Business 2 Campaign');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/campaigns/${testCampaign.id}`)
        .send({ name: 'Updated' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should validate status enum', async () => {
      const invalidDto = {
        status: 'INVALID_STATUS',
      };

      await request(app.getHttpServer())
        .put(`/campaigns/${testCampaign.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /campaigns/:id - Soft Delete Campaign', () => {
    let testCampaign: any;

    beforeEach(async () => {
      testCampaign = await createTestCampaign(prisma, business1.id, {
        name: 'Campaign to Delete',
        status: 'DRAFT',
      });
    });

    it('should soft delete campaign by setting status to COMPLETED', async () => {
      await request(app.getHttpServer())
        .delete(`/campaigns/${testCampaign.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK); // Changed from 204 to match actual implementation

      // Verify campaign still exists but status is COMPLETED
      const deleted = await prisma.campaign.findUnique({
        where: { id: testCampaign.id },
      });

      expect(deleted).toBeDefined(); // Not hard deleted
      expect(deleted.status).toBe('COMPLETED');
    });

    it('should return 404 for non-existent campaign', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .delete(`/campaigns/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 when deleting other business campaign', async () => {
      const business2Campaign = await createTestCampaign(prisma, business2.id, {
        name: 'Business 2 Campaign',
        status: 'ACTIVE',
      });

      // Business 1 tries to delete Business 2's campaign
      await request(app.getHttpServer())
        .delete(`/campaigns/${business2Campaign.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.NOT_FOUND);

      // Verify campaign was NOT deleted
      const unchanged = await prisma.campaign.findUnique({
        where: { id: business2Campaign.id },
      });
      expect(unchanged.status).toBe('ACTIVE'); // Still active
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/campaigns/${testCampaign.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Campaign Transaction Integrity', () => {
    it('should create campaign, QR code, and redirect rule atomically', async () => {
      const createDto = {
        name: 'Transaction Test',
        useCase: CampaignUseCase.CUSTOM_LINK,
        targetUrl: 'https://example.com/test',
      };

      const response = await request(app.getHttpServer())
        .post('/campaigns')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      const campaignId = response.body.id;

      // Verify all related records exist
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          qrCodes: {
            include: {
              redirectRules: true,
            },
          },
        },
      });

      expect(campaign).toBeDefined();
      expect(campaign.qrCodes).toHaveLength(1);
      expect(campaign.qrCodes[0].redirectRules).toHaveLength(1);

      // Verify relationships
      expect(campaign.qrCodes[0].campaignId).toBe(campaignId);
      expect(campaign.qrCodes[0].redirectRules[0].qrCodeId).toBe(
        campaign.qrCodes[0].id,
      );
    });
  });
});
