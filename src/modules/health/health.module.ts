import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      { name: 'scan-logs' },
      { name: 'print-jobs' },
      { name: 'emails' },
    ),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
