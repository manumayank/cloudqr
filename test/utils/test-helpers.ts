/**
 * Test Helper Utilities
 *
 * Provides factory functions for creating test data
 * with proper relationships and valid data
 */

import { PrismaService } from '../../src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

/**
 * Generate unique email for testing
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${randomBytes(4).toString('hex')}@example.com`;
}

/**
 * Generate unique slug
 */
export function generateTestSlug(): string {
  return randomBytes(4).toString('hex').substring(0, 6);
}

/**
 * Create test user
 */
export async function createTestUser(
  prisma: PrismaService,
  overrides: Partial<{
    email: string;
    name: string;
    password: string;
    role: string;
    isActive: boolean;
  }> = {},
) {
  const email = overrides.email || generateTestEmail();
  const passwordHash = await bcrypt.hash(overrides.password || 'Test123!@#', 12);

  return prisma.user.create({
    data: {
      email,
      name: overrides.name || 'Test User',
      passwordHash,
      role: (overrides.role as any) || 'BUSINESS_OWNER',
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    },
  });
}

/**
 * Create test business
 */
export async function createTestBusiness(
  prisma: PrismaService,
  ownerId: string,
  overrides: Partial<{
    businessName: string;
    category: string;
    contactEmail: string;
  }> = {},
) {
  return prisma.business.create({
    data: {
      ownerId,
      businessName: overrides.businessName || 'Test Business',
      category: (overrides.category as any) || 'RESTAURANT',
      contactEmail: overrides.contactEmail || generateTestEmail(),
    },
  });
}

/**
 * Create test campaign
 */
export async function createTestCampaign(
  prisma: PrismaService,
  businessId: string,
  overrides: Partial<{
    name: string;
    description: string;
    useCase: string;
    status: string;
  }> = {},
) {
  return prisma.campaign.create({
    data: {
      businessId,
      name: overrides.name || 'Test Campaign',
      description: overrides.description || 'Test campaign description',
      useCase: (overrides.useCase as any) || 'WEBSITE',
      status: (overrides.status as any) || 'ACTIVE',
    },
  });
}

/**
 * Create test QR code
 */
export async function createTestQRCode(
  prisma: PrismaService,
  campaignId: string,
  overrides: Partial<{
    slug: string;
    qrUrl: string;
    type: string;
    isActive: boolean;
  }> = {},
) {
  const slug = overrides.slug || generateTestSlug();

  return prisma.qRCode.create({
    data: {
      campaignId,
      slug,
      qrUrl: overrides.qrUrl || `https://qr.test.com/r/${slug}`,
      type: (overrides.type as any) || 'DYNAMIC',
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    },
  });
}

/**
 * Create test redirect rule
 */
export async function createTestRedirectRule(
  prisma: PrismaService,
  qrCodeId: string,
  overrides: Partial<{
    targetUrl: string;
    priority: number;
    mode: string;
  }> = {},
) {
  return prisma.redirectRule.create({
    data: {
      qrCodeId,
      targetUrl: overrides.targetUrl || 'https://example.com/landing',
      priority: overrides.priority || 1,
      mode: (overrides.mode as any) || 'ALWAYS',
    },
  });
}

/**
 * Create test form
 */
export async function createTestForm(
  prisma: PrismaService,
  campaignId: string,
  overrides: Partial<{
    title: string;
    description: string;
    fields: any;
  }> = {},
) {
  return prisma.form.create({
    data: {
      campaignId,
      title: overrides.title || 'Test Form',
      description: overrides.description || 'Test form description',
      fields: overrides.fields || [
        { type: 'TEXT', label: 'Name', required: true, order: 1 },
        { type: 'EMAIL', label: 'Email', required: true, order: 2 },
      ],
    },
  });
}

/**
 * Create test order
 */
export async function createTestOrder(
  prisma: PrismaService,
  businessId: string,
  overrides: Partial<{
    orderNumber: string;
    productType: string;
    quantity: number;
    amount: number;
    status: string;
  }> = {},
) {
  return prisma.order.create({
    data: {
      businessId,
      orderNumber: overrides.orderNumber || `ORD-${Date.now()}`,
      productType: (overrides.productType as any) || 'STICKERS',
      quantity: overrides.quantity || 100,
      amount: overrides.amount || 50000,
      status: (overrides.status as any) || 'PENDING',
    },
  });
}

/**
 * Create complete test environment for a business
 * Returns user, business, campaign, qrCode, redirectRule
 */
export async function createTestEnvironment(prisma: PrismaService) {
  const user = await createTestUser(prisma);
  const business = await createTestBusiness(prisma, user.id);
  const campaign = await createTestCampaign(prisma, business.id);
  const qrCode = await createTestQRCode(prisma, campaign.id);
  const redirectRule = await createTestRedirectRule(prisma, qrCode.id);

  return {
    user,
    business,
    campaign,
    qrCode,
    redirectRule,
  };
}

/**
 * Clean up test data
 */
export async function cleanupTestData(prisma: PrismaService) {
  // Delete in reverse order of dependencies
  await prisma.scan.deleteMany();
  await prisma.formSubmission.deleteMany();
  await prisma.form.deleteMany();
  await prisma.redirectRule.deleteMany();
  await prisma.qRCode.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.order.deleteMany();
  await prisma.printJob.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Wait for async operations to complete
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
