/**
 * Order Processing E2E Tests
 *
 * PRIORITY 2: Tests order creation, Razorpay integration, and multi-tenant isolation
 * Ensures businesses can only access their own orders
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
  createTestOrder,
  cleanupTestData,
} from '../utils/test-helpers';
import { ProductType, OrderStatus, PaymentStatus } from '@prisma/client';

// Mock Razorpay
jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => {
    return {
      orders: {
        create: jest.fn().mockResolvedValue({
          id: 'order_MockRazorpayOrderId',
          entity: 'order',
          amount: 250000, // ₹2500 in paise
          currency: 'INR',
          receipt: 'ORD-2024-00001',
          status: 'created',
          created_at: Math.floor(Date.now() / 1000),
        }),
      },
    };
  });
});

describe('Orders (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let user1: any;
  let business1: any;
  let user1Token: string;
  let campaign1: any;

  let user2: any;
  let business2: any;
  let user2Token: string;
  let campaign2: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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

    // Setup test data
    user1 = await createTestUser(prisma, { email: 'order1@test.com' });
    business1 = await createTestBusiness(prisma, user1.id, {
      businessName: 'Business with Orders',
    });
    user1Token = jwtService.sign({
      sub: user1.id,
      email: user1.email,
      businessId: business1.id,
    });
    campaign1 = await createTestCampaign(prisma, business1.id, {
      name: 'Card Printing Campaign',
    });

    user2 = await createTestUser(prisma, { email: 'order2@test.com' });
    business2 = await createTestBusiness(prisma, user2.id, {
      businessName: 'Another Business',
    });
    user2Token = jwtService.sign({
      sub: user2.id,
      email: user2.email,
      businessId: business2.id,
    });
    campaign2 = await createTestCampaign(prisma, business2.id, {
      name: 'Business 2 Campaign',
    });
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
    await app.close();
  });

  describe('POST /orders - Create Order', () => {
    it('should create order for BUSINESS_CARD product', async () => {
      const createDto = {
        campaignId: campaign1.id,
        quantity: 500,
        productType: ProductType.BUSINESS_CARD,
        shippingAddress: '123 MG Road, Koramangala',
        shippingCity: 'Bangalore',
        shippingState: 'Karnataka',
        shippingPincode: '560034',
        notes: 'Please print with glossy finish',
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      // Should return order details
      expect(response.body.order).toBeDefined();
      expect(response.body.order).toMatchObject({
        campaignName: campaign1.name,
        quantity: 500,
        productType: ProductType.BUSINESS_CARD,
        currency: 'INR',
        status: 'PENDING',
      });

      // Should generate order number
      expect(response.body.order.orderNumber).toMatch(/^ORD-\d{4}-\d{5}$/);

      // Should calculate correct amount (₹5 per card * 500 = ₹2500 = 250000 paise)
      expect(response.body.order.amount).toBe(250000);

      // Should return Razorpay payment details
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.razorpayOrderId).toBeDefined();
      expect(response.body.payment.amount).toBe(250000);
      expect(response.body.payment.currency).toBe('INR');
      expect(response.body.payment.key).toBeDefined(); // Razorpay Key ID

      // Verify database record
      const order = await prisma.order.findUnique({
        where: { id: response.body.order.id },
      });

      expect(order).toBeDefined();
      expect(order.businessId).toBe(business1.id);
      expect(order.campaignId).toBe(campaign1.id);
      expect(order.status).toBe('PENDING');
      expect(order.paymentStatus).toBe('PENDING');
      expect(order.shippingAddress).toBe(createDto.shippingAddress);
    });

    it('should create order for STICKER_SMALL product', async () => {
      const createDto = {
        campaignId: campaign1.id,
        quantity: 1000,
        productType: ProductType.STICKER_SMALL,
        shippingAddress: '456 Brigade Road',
        shippingCity: 'Bangalore',
        shippingState: 'Karnataka',
        shippingPincode: '560001',
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      // Sticker small: ₹3 per sticker * 1000 = ₹3000 = 300000 paise
      expect(response.body.order.amount).toBe(300000);
      expect(response.body.order.productType).toBe(ProductType.STICKER_SMALL);
    });

    it('should create order for STICKER_MEDIUM product', async () => {
      const createDto = {
        campaignId: campaign1.id,
        quantity: 100,
        productType: ProductType.STICKER_MEDIUM,
        shippingAddress: 'Test Address',
        shippingCity: 'Bangalore',
        shippingState: 'Karnataka',
        shippingPincode: '560034',
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      // Sticker medium: ₹4 per sticker * 100 = ₹400 = 40000 paise
      expect(response.body.order.amount).toBe(40000);
    });

    it('should create order for STICKER_LARGE product', async () => {
      const createDto = {
        campaignId: campaign1.id,
        quantity: 50,
        productType: ProductType.STICKER_LARGE,
        shippingAddress: 'Test Address',
        shippingCity: 'Bangalore',
        shippingState: 'Karnataka',
        shippingPincode: '560034',
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      // Sticker large: ₹6 per sticker * 50 = ₹300 = 30000 paise
      expect(response.body.order.amount).toBe(30000);
    });

    it('should create order with optional notes', async () => {
      const createDto = {
        campaignId: campaign1.id,
        quantity: 200,
        productType: ProductType.BUSINESS_CARD,
        shippingAddress: 'Test Address',
        shippingCity: 'Mumbai',
        shippingState: 'Maharashtra',
        shippingPincode: '400001',
        notes: 'Rush order - please expedite',
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      const order = await prisma.order.findUnique({
        where: { id: response.body.order.id },
      });

      expect(order.notes).toBe('Rush order - please expedite');
    });

    it('should generate unique sequential order numbers', async () => {
      const orderNumbers = new Set<string>();

      for (let i = 0; i < 3; i++) {
        const createDto = {
          campaignId: campaign1.id,
          quantity: 100,
          productType: ProductType.BUSINESS_CARD,
          shippingAddress: 'Test Address',
          shippingCity: 'Test City',
          shippingState: 'Test State',
          shippingPincode: '123456',
        };

        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${user1Token}`)
          .send(createDto)
          .expect(HttpStatus.CREATED);

        orderNumbers.add(response.body.order.orderNumber);
      }

      // All order numbers should be unique
      expect(orderNumbers.size).toBe(3);

      // All should match format
      orderNumbers.forEach((orderNumber) => {
        expect(orderNumber).toMatch(/^ORD-\d{4}-\d{5}$/);
      });
    });

    it('should reject order for non-existent campaign', async () => {
      const createDto = {
        campaignId: '00000000-0000-0000-0000-000000000000',
        quantity: 100,
        productType: ProductType.BUSINESS_CARD,
        shippingAddress: 'Test Address',
        shippingCity: 'Test City',
        shippingState: 'Test State',
        shippingPincode: '123456',
      };

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should reject order for other business campaign', async () => {
      // User1 tries to create order for User2's campaign
      const createDto = {
        campaignId: campaign2.id, // Belongs to business2
        quantity: 100,
        productType: ProductType.BUSINESS_CARD,
        shippingAddress: 'Test Address',
        shippingCity: 'Test City',
        shippingState: 'Test State',
        shippingPincode: '123456',
      };

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate minimum quantity (50)', async () => {
      const createDto = {
        campaignId: campaign1.id,
        quantity: 49, // Below minimum
        productType: ProductType.BUSINESS_CARD,
        shippingAddress: 'Test Address',
        shippingCity: 'Test City',
        shippingState: 'Test State',
        shippingPincode: '123456',
      };

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should validate maximum quantity (10000)', async () => {
      const createDto = {
        campaignId: campaign1.id,
        quantity: 10001, // Above maximum
        productType: ProductType.BUSINESS_CARD,
        shippingAddress: 'Test Address',
        shippingCity: 'Test City',
        shippingState: 'Test State',
        shippingPincode: '123456',
      };

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should validate product type enum', async () => {
      const createDto = {
        campaignId: campaign1.id,
        quantity: 100,
        productType: 'INVALID_PRODUCT',
        shippingAddress: 'Test Address',
        shippingCity: 'Test City',
        shippingState: 'Test State',
        shippingPincode: '123456',
      };

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should require all shipping fields', async () => {
      const createDto = {
        campaignId: campaign1.id,
        quantity: 100,
        productType: ProductType.BUSINESS_CARD,
        // Missing shipping fields
      };

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should require authentication', async () => {
      const createDto = {
        campaignId: campaign1.id,
        quantity: 100,
        productType: ProductType.BUSINESS_CARD,
        shippingAddress: 'Test Address',
        shippingCity: 'Test City',
        shippingState: 'Test State',
        shippingPincode: '123456',
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(createDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /orders - List Orders', () => {
    let pendingOrder: any;
    let paidOrder: any;

    beforeAll(async () => {
      pendingOrder = await createTestOrder(prisma, business1.id, campaign1.id, {
        quantity: 100,
        productType: 'BUSINESS_CARD',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        amount: 50000,
      });

      paidOrder = await createTestOrder(prisma, business1.id, campaign1.id, {
        quantity: 200,
        productType: 'STICKER_SMALL',
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        amount: 60000,
      });

      // Create order for business2 (should not be visible to business1)
      await createTestOrder(prisma, business2.id, campaign2.id, {
        quantity: 50,
        productType: 'BUSINESS_CARD',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        amount: 25000,
      });
    });

    it('should list all orders for business', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      // All orders should belong to business1
      response.body.forEach((order: any) => {
        expect(order.campaignName).toBeDefined();
        expect(order.orderNumber).toBeDefined();
        expect(order.status).toBeDefined();
        expect(order.paymentStatus).toBeDefined();
      });

      // Amount should be converted to rupees (divided by 100)
      const order = response.body.find((o: any) => o.id === pendingOrder.id);
      expect(order.amount).toBe(500); // 50000 paise = ₹500
    });

    it('should filter orders by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders?status=PENDING')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(response.body.every((o: any) => o.status === 'PENDING')).toBe(true);
    });

    it('should include campaign name and print job info', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      const order = response.body[0];
      expect(order.campaignName).toBe(campaign1.name);
      expect(order.printJob !== undefined).toBe(true); // null or object
    });

    it('should enforce multi-tenant isolation', async () => {
      // Business 1 orders
      const response1 = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      // Business 2 orders
      const response2 = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(HttpStatus.OK);

      const business1OrderIds = response1.body.map((o: any) => o.id);
      const business2OrderIds = response2.body.map((o: any) => o.id);

      // No overlap
      const intersection = business1OrderIds.filter((id: string) =>
        business2OrderIds.includes(id),
      );
      expect(intersection).toHaveLength(0);
    });

    it('should order by creation date (newest first)', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      // Verify descending order
      for (let i = 0; i < response.body.length - 1; i++) {
        const current = new Date(response.body[i].createdAt);
        const next = new Date(response.body[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/orders')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /orders/:id - Get Order Details', () => {
    let testOrder: any;

    beforeAll(async () => {
      testOrder = await createTestOrder(prisma, business1.id, campaign1.id, {
        quantity: 500,
        productType: 'BUSINESS_CARD',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        amount: 250000,
        shippingAddress: '123 Test Street',
        shippingCity: 'Bangalore',
        shippingState: 'Karnataka',
        shippingPincode: '560034',
        notes: 'Test order notes',
      });
    });

    it('should get order by ID with full details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        id: testOrder.id,
        orderNumber: testOrder.orderNumber,
        quantity: 500,
        productType: 'BUSINESS_CARD',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        shippingAddress: '123 Test Street',
        shippingCity: 'Bangalore',
        shippingState: 'Karnataka',
        shippingPincode: '560034',
        notes: 'Test order notes',
      });

      // Amount converted to rupees
      expect(response.body.amount).toBe(2500); // 250000 paise = ₹2500

      // Includes campaign info
      expect(response.body.campaign).toBeDefined();
      expect(response.body.campaign.id).toBe(campaign1.id);
      expect(response.body.campaign.name).toBe(campaign1.name);

      // Includes print jobs
      expect(response.body.printJobs).toBeDefined();
      expect(Array.isArray(response.body.printJobs)).toBe(true);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/orders/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for other business order', async () => {
      const business2Order = await createTestOrder(
        prisma,
        business2.id,
        campaign2.id,
        {
          quantity: 100,
          productType: 'BUSINESS_CARD',
          status: 'PENDING',
          paymentStatus: 'PENDING',
          amount: 50000,
        },
      );

      // Business 1 tries to access Business 2's order
      await request(app.getHttpServer())
        .get(`/orders/${business2Order.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/orders/${testOrder.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Order Pricing Calculations', () => {
    it('should calculate correct price for BUSINESS_CARD', async () => {
      const createDto = {
        campaignId: campaign1.id,
        quantity: 100,
        productType: ProductType.BUSINESS_CARD,
        shippingAddress: 'Test',
        shippingCity: 'Test',
        shippingState: 'Test',
        shippingPincode: '123456',
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      // ₹5 per card * 100 = ₹500 = 50000 paise
      expect(response.body.order.amount).toBe(50000);
    });

    it('should calculate correct price for CUSTOM product', async () => {
      const createDto = {
        campaignId: campaign1.id,
        quantity: 200,
        productType: ProductType.CUSTOM,
        shippingAddress: 'Test',
        shippingCity: 'Test',
        shippingState: 'Test',
        shippingPincode: '123456',
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      // ₹5 per item * 200 = ₹1000 = 100000 paise
      expect(response.body.order.amount).toBe(100000);
    });

    it('should handle large quantity orders', async () => {
      const createDto = {
        campaignId: campaign1.id,
        quantity: 10000, // Maximum
        productType: ProductType.STICKER_SMALL,
        shippingAddress: 'Test',
        shippingCity: 'Test',
        shippingState: 'Test',
        shippingPincode: '123456',
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      // ₹3 per sticker * 10000 = ₹30000 = 3000000 paise
      expect(response.body.order.amount).toBe(3000000);
    });
  });
});
