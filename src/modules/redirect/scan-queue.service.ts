import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface ScanEvent {
  qrCodeId: string;
  campaignId: string;
  businessId: string;
  slug: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  timestamp: Date;
}

@Injectable()
export class ScanQueueService {
  constructor(
    @InjectQueue('scan-logs') private scanQueue: Queue,
  ) {}

  /**
   * Queue scan event for background processing
   * Non-blocking - does not slow down redirect
   */
  async queueScan(event: ScanEvent): Promise<void> {
    // Add to Redis queue for background processing
    await this.scanQueue.add('log-scan', event, {
      attempts: 3, // Retry up to 3 times
      backoff: {
        type: 'exponential',
        delay: 2000, // 2s, 4s, 8s
      },
      removeOnComplete: true, // Clean up after processing
    });
  }
}
