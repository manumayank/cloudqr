import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UpdateQRCodeDto } from './dto/update-qr-code.dto';
import * as QRCode from 'qrcode';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class QRCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get QR code details
   */
  async getQRCodeDetails(qrCodeId: string, businessId: string) {
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { id: qrCodeId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            businessId: true,
            status: true,
          },
        },
        redirectRules: {
          orderBy: { priority: 'desc' },
        },
        _count: {
          select: {
            scans: true,
          },
        },
      },
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }

    // Verify ownership
    if (qrCode.campaign.businessId !== businessId) {
      throw new ForbiddenException('You do not have access to this QR code');
    }

    // Construct full QR URL
    const qrUrl = `${this.configService.get('QR_BASE_URL')}/r/${qrCode.slug}`;

    return {
      ...qrCode,
      qrUrl,
      totalScans: qrCode._count.scans,
    };
  }

  /**
   * Update QR code settings
   */
  async updateQRCode(
    qrCodeId: string,
    businessId: string,
    dto: UpdateQRCodeDto,
  ) {
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { id: qrCodeId },
      include: {
        campaign: {
          select: {
            businessId: true,
          },
        },
      },
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }

    // Verify ownership
    if (qrCode.campaign.businessId !== businessId) {
      throw new ForbiddenException('You do not have access to this QR code');
    }

    const updated = await this.prisma.qRCode.update({
      where: { id: qrCodeId },
      data: {
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.invalidateQRCache(qrCode.slug);

    return updated;
  }

  /**
   * Activate QR code
   */
  async activateQRCode(qrCodeId: string, businessId: string) {
    return this.updateQRCode(qrCodeId, businessId, { isActive: true });
  }

  /**
   * Deactivate QR code
   */
  async deactivateQRCode(qrCodeId: string, businessId: string) {
    return this.updateQRCode(qrCodeId, businessId, { isActive: false });
  }

  /**
   * Get QR code image
   */
  async getQRCodeImage(
    qrCodeId: string,
    businessId: string,
    format: 'png' | 'svg' = 'png',
  ) {
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { id: qrCodeId },
      include: {
        campaign: {
          select: {
            businessId: true,
          },
        },
      },
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }

    // Verify ownership
    if (qrCode.campaign.businessId !== businessId) {
      throw new ForbiddenException('You do not have access to this QR code');
    }

    const qrUrl = `${this.configService.get('QR_BASE_URL')}/r/${qrCode.slug}`;

    if (format === 'svg') {
      const svg = await QRCode.toString(qrUrl, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 2,
      });
      return { format: 'svg', data: svg, contentType: 'image/svg+xml' };
    } else {
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 512,
      });
      return { format: 'png', data: dataUrl, contentType: 'image/png' };
    }
  }

  /**
   * Get QR code analytics summary
   */
  async getQRCodeAnalytics(qrCodeId: string, businessId: string) {
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { id: qrCodeId },
      include: {
        campaign: {
          select: {
            id: true,
            businessId: true,
            name: true,
          },
        },
      },
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }

    // Verify ownership
    if (qrCode.campaign.businessId !== businessId) {
      throw new ForbiddenException('You do not have access to this QR code');
    }

    const [totalScans, uniqueIps, deviceStats, recentScans] = await Promise.all(
      [
        this.prisma.scan.count({
          where: { qrCodeId },
        }),
        this.prisma.scan
          .findMany({
            where: { qrCodeId },
            select: { ipAddress: true },
            distinct: ['ipAddress'],
          })
          .then((r) => r.length),
        this.prisma.scan.groupBy({
          by: ['deviceType'],
          where: { qrCodeId },
          _count: { deviceType: true },
        }),
        this.prisma.scan.findMany({
          where: { qrCodeId },
          orderBy: { scannedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            scannedAt: true,
            deviceType: true,
            browser: true,
            geoCity: true,
            geoState: true,
            geoCountry: true,
          },
        }),
      ],
    );

    const deviceBreakdown = deviceStats.reduce(
      (acc, stat) => {
        acc[stat.deviceType] = stat._count.deviceType;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      qrCodeId: qrCode.id,
      slug: qrCode.slug,
      campaignName: qrCode.campaign.name,
      totalScans,
      uniqueIps,
      deviceBreakdown,
      recentScans,
    };
  }

  /**
   * Invalidate QR code cache
   */
  private async invalidateQRCache(slug: string): Promise<void> {
    const cacheKey = `qr:slug:${slug}`;
    await this.cacheManager.del(cacheKey);
  }
}
