import { Controller, Post, Body, Headers, UnauthorizedException, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay payment webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async handleWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // 1. Verify webhook signature
    const payload = JSON.stringify(body);
    const isValid = this.paymentsService.verifyWebhookSignature(payload, signature);

    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // 2. Parse event
    const event = body.event;

    // 3. Handle different event types
    try {
      switch (event) {
        case 'payment.captured':
          await this.paymentsService.handlePaymentCaptured(body.payload.payment.entity);
          break;

        case 'payment.failed':
          await this.paymentsService.handlePaymentFailed(body.payload.payment.entity);
          break;

        case 'refund.created':
          await this.paymentsService.handleRefundCreated(body.payload.refund.entity);
          break;

        default:
          console.log('Unhandled webhook event:', event);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      // Don't throw error - return 200 to Razorpay to avoid retries
    }

    return { status: 'ok' };
  }
}
