import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'scan-logs' },
      { name: 'print-jobs' },
      { name: 'emails' },
    ),
  ],
  // TODO: Implement workers
  //
  // 1. ScanLoggerWorker (scan-logs queue)
  //    - Parse user agent
  //    - GeoIP lookup
  //    - Write to scans table
  //    - Update Redis counters
  //
  // 2. PrintJobWorker (print-jobs queue)
  //    - Generate QR codes
  //    - Create PDF with variable data
  //    - Upload to S3
  //    - Update print job status
  //
  // 3. EmailWorker (emails queue)
  //    - Send transactional emails
  //    - Order confirmations
  //    - Password resets
  //
  // See IMPLEMENTATION_SUMMARY.md for detailed implementations
})
export class WorkersModule {}
