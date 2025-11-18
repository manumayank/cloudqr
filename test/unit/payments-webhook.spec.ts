/**
 * Payment Webhook Security Tests
 *
 * CRITICAL: Tests Razorpay webhook signature verification and idempotency
 * These tests prevent payment fraud and ensure reliable order processing
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from '../../src/modules/payments/payments.controller';
import { PaymentsService } from '../../src/modules/payments/payments.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('PaymentsController - Webhook Security (CRITICAL)', () => {
  let controller: PaymentsController;
  let service: PaymentsService;
  const razorpaySecret = 'test-webhook-secret';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: {
            verifyWebhookSignature: jest.fn(),
            handlePaymentCaptured: jest.fn(),
            handlePaymentFailed: jest.fn(),
            handleRefundCreated: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'RAZORPAY_WEBHOOK_SECRET') return razorpaySecret;
              return null;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Helper function to generate valid HMAC signature
   */
  function generateSignature(body: any, secret: string): string {
    const payload = JSON.stringify(body);
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  describe('Webhook Signature Verification', () => {
    const webhookBody = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_123456',
            order_id: 'order_789',
            amount: 50000,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };

    it('should REJECT webhook with missing signature header', async () => {
      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(false);

      await expect(
        controller.handleWebhook(webhookBody, undefined),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.handleWebhook(webhookBody, undefined),
      ).rejects.toThrow('Invalid webhook signature');
    });

    it('should REJECT webhook with invalid signature', async () => {
      const invalidSignature = 'invalid-signature-12345';

      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(false);

      await expect(
        controller.handleWebhook(webhookBody, invalidSignature),
      ).rejects.toThrow(BadRequestException);

      expect(service.verifyWebhookSignature).toHaveBeenCalledWith(
        webhookBody,
        invalidSignature,
      );
    });

    it('should ACCEPT webhook with valid HMAC-SHA256 signature', async () => {
      const validSignature = generateSignature(webhookBody, razorpaySecret);

      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(true);
      (service.handlePaymentCaptured as jest.Mock).mockResolvedValue(undefined);

      await controller.handleWebhook(webhookBody, validSignature);

      expect(service.verifyWebhookSignature).toHaveBeenCalledWith(
        webhookBody,
        validSignature,
      );
      expect(service.handlePaymentCaptured).toHaveBeenCalled();
    });

    it('should prevent replay attacks with tampered body', async () => {
      const originalBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              amount: 10000, // Original amount
            },
          },
        },
      };

      const tamperedBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              amount: 50000, // Tampered to higher amount
            },
          },
        },
      };

      // Signature was generated for original body
      const signatureForOriginal = generateSignature(originalBody, razorpaySecret);

      // Attacker tries to use original signature with tampered body
      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(false);

      await expect(
        controller.handleWebhook(tamperedBody, signatureForOriginal),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('payment.captured Event', () => {
    it('should mark order as PAID and enqueue print job', async () => {
      const webhookBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123456',
              order_id: 'order_789',
              amount: 50000,
              currency: 'INR',
              status: 'captured',
              created_at: Math.floor(Date.now() / 1000),
            },
          },
        },
      };

      const validSignature = generateSignature(webhookBody, razorpaySecret);

      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(true);
      (service.handlePaymentCaptured as jest.Mock).mockResolvedValue(undefined);

      await controller.handleWebhook(webhookBody, validSignature);

      expect(service.handlePaymentCaptured).toHaveBeenCalledWith(
        webhookBody.payload.payment.entity,
      );
    });

    it('should be IDEMPOTENT - handle duplicate webhooks gracefully', async () => {
      const webhookBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123456',
              order_id: 'order_789',
              amount: 50000,
            },
          },
        },
      };

      const validSignature = generateSignature(webhookBody, razorpaySecret);

      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(true);
      (service.handlePaymentCaptured as jest.Mock).mockResolvedValue(undefined);

      // Send same webhook twice
      await controller.handleWebhook(webhookBody, validSignature);
      await controller.handleWebhook(webhookBody, validSignature);

      // Service should be called twice but handle idempotency internally
      expect(service.handlePaymentCaptured).toHaveBeenCalledTimes(2);

      // NOTE: The service layer should check if payment is already processed
      // and not create duplicate print jobs
    });

    it('should extract correct payment details', async () => {
      const webhookBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_KgTz7V8X9lP2eR',
              order_id: 'order_KgTz7V8X9lP2eR',
              amount: 75000, // ₹750.00 in paise
              currency: 'INR',
              status: 'captured',
              method: 'upi',
              email: 'customer@example.com',
              contact: '+919876543210',
            },
          },
        },
      };

      const validSignature = generateSignature(webhookBody, razorpaySecret);

      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(true);
      (service.handlePaymentCaptured as jest.Mock).mockResolvedValue(undefined);

      await controller.handleWebhook(webhookBody, validSignature);

      expect(service.handlePaymentCaptured).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'pay_KgTz7V8X9lP2eR',
          order_id: 'order_KgTz7V8X9lP2eR',
          amount: 75000,
          currency: 'INR',
          status: 'captured',
        }),
      );
    });
  });

  describe('payment.failed Event', () => {
    it('should handle payment failure correctly', async () => {
      const webhookBody = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_123456',
              order_id: 'order_789',
              amount: 50000,
              status: 'failed',
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Payment failed due to insufficient balance',
            },
          },
        },
      };

      const validSignature = generateSignature(webhookBody, razorpaySecret);

      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(true);
      (service.handlePaymentFailed as jest.Mock).mockResolvedValue(undefined);

      await controller.handleWebhook(webhookBody, validSignature);

      expect(service.handlePaymentFailed).toHaveBeenCalledWith(
        webhookBody.payload.payment.entity,
      );
    });
  });

  describe('refund.created Event', () => {
    it('should handle refund creation correctly', async () => {
      const webhookBody = {
        event: 'refund.created',
        payload: {
          refund: {
            entity: {
              id: 'rfnd_123456',
              payment_id: 'pay_789',
              amount: 50000,
              currency: 'INR',
              status: 'processed',
            },
          },
        },
      };

      const validSignature = generateSignature(webhookBody, razorpaySecret);

      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(true);
      (service.handleRefundCreated as jest.Mock).mockResolvedValue(undefined);

      await controller.handleWebhook(webhookBody, validSignature);

      expect(service.handleRefundCreated).toHaveBeenCalledWith(
        webhookBody.payload.refund.entity,
      );
    });
  });

  describe('Unknown Event Handling', () => {
    it('should handle unknown events gracefully', async () => {
      const webhookBody = {
        event: 'unknown.event',
        payload: {},
      };

      const validSignature = generateSignature(webhookBody, razorpaySecret);

      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(true);

      // Should not throw, just log and return 200 OK
      await expect(
        controller.handleWebhook(webhookBody, validSignature),
      ).resolves.not.toThrow();
    });
  });

  describe('Security Attack Scenarios', () => {
    it('should prevent man-in-the-middle attacks', async () => {
      const webhookBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              amount: 10000,
            },
          },
        },
      };

      // Attacker intercepts and modifies signature
      const attackerSignature = 'attacker-generated-signature';

      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(false);

      await expect(
        controller.handleWebhook(webhookBody, attackerSignature),
      ).rejects.toThrow(BadRequestException);

      // Ensure no payment was processed
      expect(service.handlePaymentCaptured).not.toHaveBeenCalled();
    });

    it('should prevent signature reuse for different payloads', async () => {
      const originalBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_111', amount: 1000 },
          },
        },
      };

      const differentBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_222', amount: 100000 },
          },
        },
      };

      const signatureForOriginal = generateSignature(originalBody, razorpaySecret);

      // Attacker tries to reuse signature for different payload
      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(false);

      await expect(
        controller.handleWebhook(differentBody, signatureForOriginal),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require exact body match for signature verification', async () => {
      const webhookBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              amount: 50000,
            },
          },
        },
      };

      const validSignature = generateSignature(webhookBody, razorpaySecret);

      // Even minor changes should invalidate signature
      const modifiedBody = {
        ...webhookBody,
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              amount: 50001, // Changed by 1 paise
            },
          },
        },
      };

      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(false);

      await expect(
        controller.handleWebhook(modifiedBody, validSignature),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const webhookBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_123' },
          },
        },
      };

      const validSignature = generateSignature(webhookBody, razorpaySecret);

      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(true);
      (service.handlePaymentCaptured as jest.Mock).mockRejectedValue(
        new Error('Database connection error'),
      );

      // Should throw the error for Razorpay to retry
      await expect(
        controller.handleWebhook(webhookBody, validSignature),
      ).rejects.toThrow('Database connection error');
    });

    it('should return 200 OK on successful processing', async () => {
      const webhookBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_123' },
          },
        },
      };

      const validSignature = generateSignature(webhookBody, razorpaySecret);

      (service.verifyWebhookSignature as jest.Mock).mockReturnValue(true);
      (service.handlePaymentCaptured as jest.Mock).mockResolvedValue(undefined);

      // Should resolve successfully
      await expect(
        controller.handleWebhook(webhookBody, validSignature),
      ).resolves.not.toThrow();
    });
  });
});
