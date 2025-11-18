import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'print-jobs',
      },
      {
        name: 'emails',
      },
    ),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
