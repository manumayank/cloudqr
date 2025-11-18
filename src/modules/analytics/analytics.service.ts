import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get campaign analytics summary
   */
  async getCampaignSummary(businessId: string, campaignId: string, from?: Date, to?: Date) {
    // Verify campaign belongs to business
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, businessId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Default to last 30 days if not specified
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to || new Date();

    const [totalScans, uniqueIps, deviceStats, cityStats, browserStats, peakHourData] =
      await Promise.all([
        // Total scans
        this.prisma.scan.count({
          where: {
            campaignId,
            scannedAt: { gte: fromDate, lte: toDate },
          },
        }),

        // Unique IPs (approximation of unique users)
        this.prisma.scan
          .findMany({
            where: {
              campaignId,
              scannedAt: { gte: fromDate, lte: toDate },
            },
            select: { ipAddress: true },
            distinct: ['ipAddress'],
          })
          .then((results) => results.length),

        // Device breakdown
        this.prisma.scan.groupBy({
          by: ['deviceType'],
          where: {
            campaignId,
            scannedAt: { gte: fromDate, lte: toDate },
          },
          _count: { deviceType: true },
        }),

        // Top cities
        this.prisma.scan.groupBy({
          by: ['geoCity', 'geoState'],
          where: {
            campaignId,
            scannedAt: { gte: fromDate, lte: toDate },
            geoCity: { not: null },
          },
          _count: { geoCity: true },
          orderBy: { _count: { geoCity: 'desc' } },
          take: 10,
        }),

        // Top browsers
        this.prisma.scan.groupBy({
          by: ['browser'],
          where: {
            campaignId,
            scannedAt: { gte: fromDate, lte: toDate },
          },
          _count: { browser: true },
          orderBy: { _count: { browser: 'desc' } },
          take: 5,
        }),

        // Peak scan hour
        this.prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
          SELECT
            EXTRACT(HOUR FROM scanned_at) as hour,
            COUNT(*) as count
          FROM scans
          WHERE campaign_id = ${campaignId}
            AND scanned_at BETWEEN ${fromDate} AND ${toDate}
          GROUP BY hour
          ORDER BY count DESC
          LIMIT 1
        `,
      ]);

    // Calculate average scans per day
    const daysDiff = Math.max(
      1,
      Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const avgScansPerDay = Math.round(totalScans / daysDiff);

    // Format device breakdown
    const deviceBreakdown = {
      mobile: 0,
      tablet: 0,
      desktop: 0,
      other: 0,
    };

    deviceStats.forEach((stat) => {
      if (stat.deviceType) {
        const type = stat.deviceType.toLowerCase();
        deviceBreakdown[type] = stat._count.deviceType;
      }
    });

    // Format top cities
    const topCities = cityStats.map((stat) => ({
      city: stat.geoCity || 'Unknown',
      state: stat.geoState || '',
      count: stat._count.geoCity,
      percentage: totalScans > 0 ? Math.round((stat._count.geoCity / totalScans) * 100) : 0,
    }));

    // Format top browsers
    const topBrowsers = browserStats.map((stat) => ({
      browser: stat.browser || 'Unknown',
      count: stat._count.browser,
    }));

    return {
      totalScans,
      uniqueIps,
      avgScansPerDay,
      peakScanTime: peakHourData[0] ? `${peakHourData[0].hour}:00` : 'N/A',
      deviceBreakdown,
      topCities,
      topBrowsers,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
    };
  }

  /**
   * Get time-series scan data for charts
   */
  async getScansTimeSeries(
    businessId: string,
    campaignId: string,
    from: Date,
    to: Date,
    groupBy: 'hour' | 'day' | 'week' | 'month' = 'day',
  ) {
    // Verify campaign belongs to business
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, businessId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Different SQL for different group intervals
    const groupBySQL = {
      hour: `DATE_TRUNC('hour', scanned_at)`,
      day: `DATE_TRUNC('day', scanned_at)`,
      week: `DATE_TRUNC('week', scanned_at)`,
      month: `DATE_TRUNC('month', scanned_at)`,
    };

    const results = await this.prisma.$queryRaw<Array<{ time_bucket: Date; count: bigint }>>`
      SELECT
        ${groupBySQL[groupBy]} as time_bucket,
        COUNT(*) as count
      FROM scans
      WHERE campaign_id = ${campaignId}
        AND scanned_at BETWEEN ${from} AND ${to}
      GROUP BY time_bucket
      ORDER BY time_bucket ASC
    `;

    return results.map((row) => ({
      timestamp: row.time_bucket.toISOString(),
      count: Number(row.count),
    }));
  }

  /**
   * Get analytics for a specific QR code
   */
  async getQRCodeAnalytics(businessId: string, qrCodeId: string) {
    // Verify QR code belongs to business
    const qrCode = await this.prisma.qRCode.findFirst({
      where: {
        id: qrCodeId,
        campaign: { businessId },
      },
      include: {
        campaign: {
          select: { name: true, businessId: true },
        },
      },
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }

    const [totalScans, lastScan, recentScans] = await Promise.all([
      // Total scans
      this.prisma.scan.count({
        where: { qrCodeId },
      }),

      // Last scan time
      this.prisma.scan.findFirst({
        where: { qrCodeId },
        orderBy: { scannedAt: 'desc' },
        select: { scannedAt: true },
      }),

      // Recent scans (last 50)
      this.prisma.scan.findMany({
        where: { qrCodeId },
        orderBy: { scannedAt: 'desc' },
        take: 50,
        select: {
          scannedAt: true,
          deviceType: true,
          geoCity: true,
          geoState: true,
          browser: true,
          os: true,
        },
      }),
    ]);

    return {
      qrCodeId,
      slug: qrCode.slug,
      campaignName: qrCode.campaign.name,
      totalScans,
      lastScannedAt: lastScan?.scannedAt || null,
      recentScans: recentScans.map((scan) => ({
        scannedAt: scan.scannedAt,
        deviceType: scan.deviceType,
        location: scan.geoCity
          ? `${scan.geoCity}${scan.geoState ? ', ' + scan.geoState : ''}`
          : null,
        browser: scan.browser,
        os: scan.os,
      })),
    };
  }

  /**
   * Get customers collected from forms/scans
   */
  async getCustomers(
    businessId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = { businessId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.customer.count({ where }),
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get overall business statistics
   */
  async getBusinessStats(businessId: string) {
    const [totalCampaigns, totalQrCodes, totalScans, totalCustomers, recentScans] =
      await Promise.all([
        this.prisma.campaign.count({ where: { businessId } }),

        this.prisma.qRCode.count({
          where: { campaign: { businessId } },
        }),

        this.prisma.scan.count({
          where: { businessId },
        }),

        this.prisma.customer.count({ where: { businessId } }),

        this.prisma.scan.count({
          where: {
            businessId,
            scannedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

    return {
      totalCampaigns,
      totalQrCodes,
      totalScans,
      totalCustomers,
      scansLast24Hours: recentScans,
    };
  }
}
