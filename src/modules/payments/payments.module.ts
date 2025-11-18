import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'print-jobs',
    }),
  ],
  // TODO: Implement payments module
  //
  // Endpoints:
  // - POST /payments/webhook - Razorpay webhook handler
  //
  // Webhook events to handle:
  // - payment.captured → Update order, queue print job
  // - payment.failed → Update order status
  // - refund.created → Update order, notify user
  //
  // Critical security:
  // - Verify webhook signature (HMAC-SHA256)
  // - Never trust webhook data without verification
  //
  // See IMPLEMENTATION_SUMMARY.md → Section 9 for implementation
})
export class PaymentsModule {}
