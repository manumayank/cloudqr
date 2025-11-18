import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { ScanEvent } from '../modules/redirect/scan-queue.service';
import * as UAParser from 'ua-parser-js';
import * as geoip from 'geoip-lite';
import { DeviceType } from '@prisma/client';

@Processor('scan-logs')
export class ScanLoggerWorker {
  private readonly logger = new Logger(ScanLoggerWorker.name);

  constructor(private prisma: PrismaService) {}

  @Process('log-scan')
  async handleScanLog(job: Job<ScanEvent>): Promise<void> {
    const { qrCodeId, campaignId, businessId, ipAddress, userAgent, referrer, timestamp } =
      job.data;

    try {
      // 1. Parse user agent
      const ua = UAParser(userAgent);
      const deviceType = this.getDeviceType(ua.device.type);
      const browser = ua.browser.name || 'Unknown';
      const os = ua.os.name || 'Unknown';

      // 2. GeoIP lookup
      const geo = geoip.lookup(ipAddress);
      const geoCity = geo?.city || null;
      const geoState = geo?.region || null;
      const geoCountry = geo?.country || 'IN'; // Default to India
      const latitude = geo?.ll?.[0] || null;
      const longitude = geo?.ll?.[1] || null;

      // 3. Write to database
      await this.prisma.scan.create({
        data: {
          qrCodeId,
          campaignId,
          businessId,
          scannedAt: timestamp,
          ipAddress,
          userAgent,
          deviceType,
          browser,
          os,
          geoCity,
          geoState,
          geoCountry,
          latitude,
          longitude,
          referrer,
        },
      });

      this.logger.log(`Logged scan for QR ${qrCodeId} from ${geoCity || 'Unknown'}`);
    } catch (error) {
      this.logger.error('Error logging scan:', error);
      throw error; // Will trigger retry
    }
  }

  /**
   * Map UA parser device type to our enum
   */
  private getDeviceType(uaDeviceType?: string): DeviceType {
    if (!uaDeviceType) return DeviceType.DESKTOP;
    if (uaDeviceType === 'mobile') return DeviceType.MOBILE;
    if (uaDeviceType === 'tablet') return DeviceType.TABLET;
    return DeviceType.OTHER;
  }
}
