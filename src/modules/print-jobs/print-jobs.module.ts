import { Module } from '@nestjs/common';
import { PrintJobsController } from './print-jobs.controller';
import { PrintJobsService } from './print-jobs.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PrintJobsController],
  providers: [PrintJobsService],
  exports: [PrintJobsService],
})
export class PrintJobsModule {}
