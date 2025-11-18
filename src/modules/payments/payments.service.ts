import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @InjectQueue('print-jobs') private printJobQueue: Queue,
    @InjectQueue('emails') private emailQueue: Queue,
  ) {}

  /**
   * Verify Razorpay webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.warn('Razorpay webhook secret not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Handle payment captured event
   */
  async handlePaymentCaptured(payment: any) {
    this.logger.log(`Processing payment captured: ${payment.id}`);

    // 1. Find order by Razorpay order_id
    const order = await this.prisma.order.findFirst({
      where: { paymentId: payment.order_id },
      include: { campaign: true },
    });

    if (!order) {
      this.logger.error(`Order not found for payment: ${payment.id}`);
      return;
    }

    // 2. Update order status
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paymentStatus: 'COMPLETED',
        paymentMethod: payment.method,
        paidAt: new Date(payment.created_at * 1000),
      },
    });

    this.logger.log(`Order ${order.orderNumber} marked as PAID`);

    // 3. Queue print job creation
    await this.printJobQueue.add('create-print-job', {
      orderId: order.id,
      campaignId: order.campaignId,
    });

    this.logger.log(`Print job queued for order ${order.orderNumber}`);

    // 4. Log audit event
    await this.prisma.auditLog.create({
      data: {
        businessId: order.businessId,
        action: 'ORDER_PAID',
        entityType: 'order',
        entityId: order.id,
        metadata: {
          paymentId: payment.id,
          method: payment.method,
          amount: payment.amount,
        },
      },
    });

    // Send payment success email
    const business = await this.prisma.business.findUnique({
      where: { id: order.businessId },
      select: { contactEmail: true, businessName: true },
    });

    if (business?.contactEmail) {
      await this.emailQueue.add('send-payment-success', {
        orderId: order.id,
        email: business.contactEmail,
        customerName: business.businessName,
        orderNumber: order.orderNumber,
        amount: order.amount,
        paidAt: new Date(payment.created_at * 1000),
      });

      this.logger.log(`Payment success email queued for ${business.contactEmail}`);
    }
  }

  /**
   * Handle payment failed event
   */
  async handlePaymentFailed(payment: any) {
    this.logger.warn(`Processing payment failed: ${payment.id}`);

    const order = await this.prisma.order.findFirst({
      where: { paymentId: payment.order_id },
      include: {
        business: {
          select: { contactEmail: true, businessName: true },
        },
      },
    });

    if (order) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
        },
      });

      // Log payment failure (optionally send email based on business requirements)
      this.logger.warn(
        `Payment failed for order ${order.orderNumber}, business: ${order.business.businessName}`,
      );

      // Note: You can uncomment the following to send failure notification emails
      // if (order.business.contactEmail) {
      //   await this.emailQueue.add('send-payment-failed', {
      //     orderId: order.id,
      //     email: order.business.contactEmail,
      //     customerName: order.business.businessName,
      //     orderNumber: order.orderNumber,
      //   });
      // }
    }
  }

  /**
   * Handle refund created event
   */
  async handleRefundCreated(refund: any) {
    this.logger.log(`Processing refund: ${refund.id}`);

    // Find order by payment_id
    const order = await this.prisma.order.findFirst({
      where: { paymentId: refund.payment_id },
    });

    if (!order) {
      this.logger.error(`Order not found for refund: ${refund.id}`);
      return;
    }

    // Update order status
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED',
      },
    });

    this.logger.log(`Order ${order.orderNumber} marked as REFUNDED`);

    // Cancel any pending print jobs
    await this.prisma.printJob.updateMany({
      where: {
        orderId: order.id,
        status: { in: ['PENDING', 'QUEUED'] },
      },
      data: {
        status: 'CANCELLED',
        notes: 'Cancelled due to refund',
      },
    });

    // Send refund confirmation email
    const business = await this.prisma.business.findUnique({
      where: { id: order.businessId },
      select: { contactEmail: true, businessName: true },
    });

    if (business?.contactEmail) {
      // Note: You may want to create a specific 'send-refund-confirmation' email job
      // For now, we'll log the refund completion
      this.logger.log(
        `Refund completed for order ${order.orderNumber}, business: ${business.businessName}`,
      );

      // Optional: Send refund notification email
      // await this.emailQueue.add('send-refund-confirmation', {
      //   orderId: order.id,
      //   email: business.contactEmail,
      //   customerName: business.businessName,
      //   orderNumber: order.orderNumber,
      //   refundAmount: order.amount,
      // });
    }
  }
}
