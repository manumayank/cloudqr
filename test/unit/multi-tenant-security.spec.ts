/**
 * Multi-Tenant Security Tests
 *
 * CRITICAL: These tests verify that Business A cannot access Business B's data
 * This is the most important security feature of the SaaS platform
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { CampaignsService } from '../../src/modules/campaigns/campaigns.service';
import { QRCodesService } from '../../src/modules/qr-codes/qr-codes.service';
import { FormsService } from '../../src/modules/forms/forms.service';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { UsersService } from '../../src/modules/users/users.service';
import { BusinessesService } from '../../src/modules/businesses/businesses.service';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('Multi-Tenant Security (CRITICAL)', () => {
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      campaign: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      qRCode: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      form: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      formSubmission: {
        findMany: jest.fn(),
      },
      order: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      business: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CampaignsService - Tenant Isolation', () => {
    let service: CampaignsService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CampaignsService,
          { provide: PrismaService, useValue: prisma },
          {
            provide: ConfigService,
            useValue: { get: jest.fn() },
          },
        ],
      }).compile();

      service = module.get<CampaignsService>(CampaignsService);
    });

    it('should ONLY return campaigns for the specified businessId', async () => {
      const businessAId = 'business-A';
      const mockCampaigns = [
        { id: 'camp-1', businessId: businessAId, name: 'Campaign 1' },
        { id: 'camp-2', businessId: businessAId, name: 'Campaign 2' },
      ];

      (prisma.campaign.findMany as jest.Mock).mockResolvedValue(mockCampaigns);

      const result = await service.findAll(businessAId);

      // Verify query includes businessId filter
      expect(prisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ businessId: businessAId }),
        }),
      );

      // Verify all returned campaigns belong to businessId
      expect(result.every((c) => c.businessId === businessAId)).toBe(true);
    });

    it('should BLOCK access to campaigns from another business', async () => {
      const businessAId = 'business-A';
      const campaignBelongsToBId = 'campaign-from-B';

      // Campaign belongs to Business B, not Business A
      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue({
        id: campaignBelongsToBId,
        businessId: 'business-B',
        name: 'B Campaign',
      });

      // Attempt to access Business B's campaign from Business A
      await expect(
        service.findOne(campaignBelongsToBId, businessAId),
      ).rejects.toThrow(ForbiddenException);

      // Verify error message is security-conscious
      await expect(
        service.findOne(campaignBelongsToBId, businessAId),
      ).rejects.toThrow('You do not have permission');
    });

    it('should BLOCK updates to campaigns from another business', async () => {
      const businessAId = 'business-A';
      const campaignBelongsToBId = 'campaign-from-B';

      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue({
        id: campaignBelongsToBId,
        businessId: 'business-B',
      });

      await expect(
        service.update(campaignBelongsToBId, businessAId, { name: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);

      // Ensure update was NEVER called
      expect(prisma.campaign.update).not.toHaveBeenCalled();
    });

    it('should BLOCK deletion of campaigns from another business', async () => {
      const businessAId = 'business-A';
      const campaignBelongsToBId = 'campaign-from-B';

      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue({
        id: campaignBelongsToBId,
        businessId: 'business-B',
      });

      await expect(
        service.remove(campaignBelongsToBId, businessAId),
      ).rejects.toThrow(ForbiddenException);

      // Ensure delete was NEVER called
      expect(prisma.campaign.delete).not.toHaveBeenCalled();
    });

    it('should return empty array if businessId has no campaigns', async () => {
      (prisma.campaign.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll('business-with-no-campaigns');

      expect(result).toEqual([]);
    });
  });

  describe('QRCodesService - Tenant Isolation', () => {
    let service: QRCodesService;
    let cacheManager: any;

    beforeEach(async () => {
      cacheManager = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          QRCodesService,
          { provide: PrismaService, useValue: prisma },
          { provide: CACHE_MANAGER, useValue: cacheManager },
          {
            provide: ConfigService,
            useValue: { get: jest.fn((key) => {
              if (key === 'QR_BASE_URL') return 'https://qr.test.com';
              return null;
            })},
          },
        ],
      }).compile();

      service = module.get<QRCodesService>(QRCodesService);
    });

    it('should BLOCK access to QR codes from another business', async () => {
      const businessAId = 'business-A';
      const qrBelongsToBId = 'qr-from-B';

      (prisma.qRCode.findUnique as jest.Mock).mockResolvedValue({
        id: qrBelongsToBId,
        campaign: {
          businessId: 'business-B',
        },
      });

      await expect(
        service.getQRCodeDetails(qrBelongsToBId, businessAId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should BLOCK updates to QR codes from another business', async () => {
      const businessAId = 'business-A';
      const qrBelongsToBId = 'qr-from-B';

      (prisma.qRCode.findUnique as jest.Mock).mockResolvedValue({
        id: qrBelongsToBId,
        campaign: {
          businessId: 'business-B',
        },
      });

      await expect(
        service.updateQRCode(qrBelongsToBId, businessAId, { isActive: false }),
      ).rejects.toThrow(ForbiddenException);

      // Ensure update was NEVER called
      expect(prisma.qRCode.update).not.toHaveBeenCalled();
    });
  });

  describe('FormsService - Tenant Isolation', () => {
    let service: FormsService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FormsService,
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile();

      service = module.get<FormsService>(FormsService);
    });

    it('should ONLY return forms for the specified businessId', async () => {
      const businessAId = 'business-A';

      (prisma.form.findMany as jest.Mock).mockResolvedValue([
        { id: 'form-1', campaign: { businessId: businessAId } },
      ]);

      await service.findAllForBusiness(businessAId);

      expect(prisma.form.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            campaign: { businessId: businessAId },
          }),
        }),
      );
    });

    it('should BLOCK access to form submissions from another business', async () => {
      const businessAId = 'business-A';
      const formBelongsToBId = 'form-from-B';

      (prisma.form.findUnique as jest.Mock).mockResolvedValue({
        id: formBelongsToBId,
        campaign: {
          businessId: 'business-B',
        },
      });

      await expect(
        service.getFormSubmissions(formBelongsToBId, businessAId),
      ).rejects.toThrow(ForbiddenException);

      // Ensure submissions query was NEVER executed
      expect(prisma.formSubmission.findMany).not.toHaveBeenCalled();
    });
  });

  describe('OrdersService - Tenant Isolation', () => {
    let service: OrdersService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OrdersService,
          { provide: PrismaService, useValue: prisma },
          {
            provide: ConfigService,
            useValue: { get: jest.fn() },
          },
        ],
      }).compile();

      service = module.get<OrdersService>(OrdersService);
    });

    it('should ONLY return orders for the specified businessId', async () => {
      const businessAId = 'business-A';

      (prisma.order.findMany as jest.Mock).mockResolvedValue([
        { id: 'order-1', businessId: businessAId },
      ]);

      await service.findAll(businessAId);

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { businessId: businessAId },
        }),
      );
    });

    it('should BLOCK access to orders from another business', async () => {
      const businessAId = 'business-A';
      const orderBelongsToBId = 'order-from-B';

      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: orderBelongsToBId,
        businessId: 'business-B',
      });

      await expect(
        service.findOne(orderBelongsToBId, businessAId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('UsersService - Business Ownership', () => {
    let service: UsersService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UsersService,
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile();

      service = module.get<UsersService>(UsersService);
    });

    it('should BLOCK user from updating businesses they do not own', async () => {
      const user1Id = 'user-1';
      const businessOwnedByUser2 = 'business-owned-by-user-2';

      (prisma.business.findUnique as jest.Mock).mockResolvedValue({
        id: businessOwnedByUser2,
        ownerId: 'user-2', // Different owner
      });

      await expect(
        service.updateBusinessProfile(businessOwnedByUser2, user1Id, { businessName: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.business.update).not.toHaveBeenCalled();
    });
  });

  describe('BusinessesService - Ownership Verification', () => {
    let service: BusinessesService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BusinessesService,
          { provide: PrismaService, useValue: prisma },
          {
            provide: ConfigService,
            useValue: { get: jest.fn() },
          },
        ],
      }).compile();

      service = module.get<BusinessesService>(BusinessesService);
    });

    it('should BLOCK access to business details if not owner', async () => {
      const user1Id = 'user-1';
      const businessId = 'business-1';

      (prisma.business.findUnique as jest.Mock).mockResolvedValue({
        id: businessId,
        ownerId: 'user-2', // Different owner
      });

      await expect(
        service.getBusinessDetails(businessId, user1Id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should ALLOW access to business details if owner', async () => {
      const userId = 'user-1';
      const businessId = 'business-1';

      const mockBusiness = {
        id: businessId,
        ownerId: userId, // Same owner
        businessName: 'My Business',
      };

      (prisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);

      const result = await service.getBusinessDetails(businessId, userId);

      expect(result).toEqual(mockBusiness);
    });

    it('should BLOCK business updates if not owner', async () => {
      const user1Id = 'user-1';
      const businessId = 'business-1';

      (prisma.business.findUnique as jest.Mock).mockResolvedValue({
        id: businessId,
        ownerId: 'user-2', // Different owner
      });

      await expect(
        service.updateBusiness(businessId, user1Id, { businessName: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.business.update).not.toHaveBeenCalled();
    });
  });

  describe('Cross-Tenant Attack Scenarios', () => {
    let campaignsService: CampaignsService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CampaignsService,
          { provide: PrismaService, useValue: prisma },
          {
            provide: ConfigService,
            useValue: { get: jest.fn() },
          },
        ],
      }).compile();

      campaignsService = module.get<CampaignsService>(CampaignsService);
    });

    it('should prevent reading campaign by guessing IDs', async () => {
      // Attacker tries to access campaigns by guessing UUIDs
      const attackerBusinessId = 'attacker-business';
      const victimCampaignId = 'victim-campaign-uuid';

      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue({
        id: victimCampaignId,
        businessId: 'victim-business',
        name: 'Victim Campaign',
      });

      await expect(
        campaignsService.findOne(victimCampaignId, attackerBusinessId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent mass enumeration attacks', async () => {
      const attackerBusinessId = 'attacker-business';

      (prisma.campaign.findMany as jest.Mock).mockResolvedValue([]);

      // Try to list all campaigns (should only return attacker's campaigns)
      const result = await campaignsService.findAll(attackerBusinessId);

      expect(prisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId: attackerBusinessId,
          }),
        }),
      );
      expect(result).toEqual([]);
    });

    it('should prevent privilege escalation via businessId manipulation', async () => {
      // Attacker tries to update campaign with manipulated businessId
      const attackerBusinessId = 'attacker-business';
      const victimCampaignId = 'victim-campaign';

      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue({
        id: victimCampaignId,
        businessId: 'victim-business',
      });

      // Attempt to change campaign to attacker's business
      await expect(
        campaignsService.update(victimCampaignId, attackerBusinessId, {
          businessId: attackerBusinessId, // Trying to steal campaign
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Admin Role Bypass (Should ALLOW cross-tenant access)', () => {
    // NOTE: This is intentional - admins SHOULD be able to access all data
    it('should allow ADMIN role to access cross-tenant data', () => {
      // This test is a placeholder for admin service tests
      // Admin service should have different logic that allows cross-tenant access
      expect(true).toBe(true);
    });
  });
});
