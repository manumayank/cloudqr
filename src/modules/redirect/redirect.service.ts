import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../common/prisma/prisma.service';

interface RedirectData {
  qrCodeId: string;
  campaignId: string;
  businessId: string;
  targetUrl: string;
  targetMode: string;
  isActive: boolean;
}

@Injectable()
export class RedirectService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) {}

  /**
   * Get redirect target for a QR code slug
   * Uses Redis cache for fast lookups (5-10ms), falls back to DB (20-50ms)
   */
  async getRedirectTarget(slug: string): Promise<RedirectData | null> {
    // 1. Try Redis cache first (90%+ hit rate expected)
    const cacheKey = `qr:slug:${slug}`;
    const cached = await this.cacheManager.get<RedirectData>(cacheKey);

    if (cached) {
      return cached;
    }

    // 2. Cache miss - query database
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { slug },
      include: {
        campaign: {
          select: {
            id: true,
            businessId: true,
          },
        },
        redirectRules: {
          where: {
            OR: [
              { isDefault: true },
              {
                AND: [
                  {
                    validFrom: {
                      lte: new Date(),
                    },
                  },
                  {
                    validTo: {
                      gte: new Date(),
                    },
                  },
                ],
              },
            ],
          },
          orderBy: {
            priority: 'desc', // Higher priority first
          },
          take: 1,
        },
      },
    });

    if (!qrCode || qrCode.redirectRules.length === 0) {
      return null;
    }

    const redirectRule = qrCode.redirectRules[0];

    const redirectData: RedirectData = {
      qrCodeId: qrCode.id,
      campaignId: qrCode.campaign.id,
      businessId: qrCode.campaign.businessId,
      targetUrl: redirectRule.targetUrl,
      targetMode: qrCode.targetMode,
      isActive: qrCode.isActive,
    };

    // 3. Cache for 5 minutes (300 seconds)
    await this.cacheManager.set(cacheKey, redirectData, 300000);

    return redirectData;
  }

  /**
   * Invalidate QR code cache when campaign is updated
   */
  async invalidateQRCache(campaignId: string): Promise<void> {
    const qrCodes = await this.prisma.qRCode.findMany({
      where: { campaignId },
      select: { slug: true },
    });

    for (const qr of qrCodes) {
      await this.cacheManager.del(`qr:slug:${qr.slug}`);
    }
  }

  /**
   * Invalidate specific QR code cache
   */
  async invalidateSpecificQR(slug: string): Promise<void> {
    await this.cacheManager.del(`qr:slug:${slug}`);
  }
}
