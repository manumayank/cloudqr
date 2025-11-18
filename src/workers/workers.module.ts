import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScanLoggerWorker } from './scan-logger.worker';
import { PrintJobWorker } from './print-job.worker';
import { EmailWorker } from './email.worker';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'scan-logs' },
      { name: 'print-jobs' },
      { name: 'emails' },
    ),
    PrismaModule,
  ],
  providers: [ScanLoggerWorker, PrintJobWorker, EmailWorker],
})
export class WorkersModule {}
