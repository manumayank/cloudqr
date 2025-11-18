import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scan-logs',
    }),
  ],
  // TODO: Implement redirect module (HIGHEST PRIORITY)
  //
  // Controller:
  // - GET /r/:slug - Public QR redirect endpoint
  //
  // Service:
  // - getRedirectTarget(slug) - Check cache, fallback to DB
  // - invalidateQRCache(campaignId) - Clear cache on update
  //
  // Queue Service:
  // - queueScan(event) - Add scan event to Redis queue
  //
  // Performance requirements:
  // - P50: <30ms (cache hit)
  // - P95: <100ms (cache miss)
  // - Throughput: 10K+ req/sec
  //
  // See IMPLEMENTATION_SUMMARY.md → Section 5 for detailed implementation
})
export class RedirectModule {}
