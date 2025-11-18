import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedirectController } from './redirect.controller';
import { RedirectService } from './redirect.service';
import { ScanQueueService } from './scan-queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scan-logs',
    }),
  ],
  controllers: [RedirectController],
  providers: [RedirectService, ScanQueueService],
  exports: [RedirectService, ScanQueueService],
})
export class RedirectModule {}
