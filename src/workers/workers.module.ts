import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScanLoggerWorker } from './scan-logger.worker';
// TODO: Add more workers:
// - PrintJobWorker (print-jobs queue)
// - EmailWorker (emails queue)

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'scan-logs' },
      { name: 'print-jobs' },
      { name: 'emails' },
    ),
  ],
  providers: [ScanLoggerWorker],
})
export class WorkersModule {}
