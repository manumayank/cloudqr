import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../common/prisma/prisma.service';

interface WelcomeEmailData {
  userId: string;
  email: string;
  name: string;
  businessName: string;
}

interface OrderConfirmationEmailData {
  orderId: string;
  email: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  productType: string;
  quantity: number;
}

interface PaymentSuccessEmailData {
  orderId: string;
  email: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  paidAt: Date;
}

interface FormSubmissionNotificationData {
  formId: string;
  businessEmail: string;
  businessName: string;
  formTitle: string;
  submissionData: Record<string, any>;
  submittedAt: Date;
}

@Injectable()
@Processor('emails')
export class EmailWorker {
  private readonly logger = new Logger(EmailWorker.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpPort = this.configService.get('SMTP_PORT', 587);
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');
    const fromEmail = this.configService.get('FROM_EMAIL', 'noreply@qrconnect.in');

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn(
        'SMTP credentials not configured. Email notifications will be logged but not sent.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    this.logger.log('Email transporter initialized');
  }

  /**
   * Send welcome email to new users
   */
  @Process('send-welcome-email')
  async handleWelcomeEmail(job: Job<WelcomeEmailData>): Promise<void> {
    const { email, name, businessName } = job.data;

    this.logger.log(`Sending welcome email to ${email}`);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to QRConnect! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Welcome to QRConnect! We're excited to have ${businessName} on board.</p>
            <p>You can now:</p>
            <ul>
              <li>Create dynamic QR code campaigns</li>
              <li>Track scans and analytics in real-time</li>
              <li>Collect customer feedback with forms</li>
              <li>Order professional QR code prints</li>
            </ul>
            <p>Ready to create your first campaign?</p>
            <a href="${this.configService.get('APP_URL', 'https://qrconnect.in')}/dashboard" class="button">Go to Dashboard</a>
            <p>If you have any questions, our support team is here to help at <a href="mailto:support@qrconnect.in">support@qrconnect.in</a>.</p>
            <p>Best regards,<br>The QRConnect Team</p>
          </div>
          <div class="footer">
            <p>© 2024 QRConnect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to QRConnect - Let\'s Get Started! 🚀',
      html,
    });

    this.logger.log(`Welcome email sent to ${email}`);
  }

  /**
   * Send order confirmation email
   */
  @Process('send-order-confirmation')
  async handleOrderConfirmation(
    job: Job<OrderConfirmationEmailData>,
  ): Promise<void> {
    const { email, customerName, orderNumber, amount, productType, quantity } =
      job.data;

    this.logger.log(`Sending order confirmation to ${email}`);

    const formattedAmount = (amount / 100).toFixed(2);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; color: #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation ✓</h1>
          </div>
          <div class="content">
            <h2>Hi ${customerName},</h2>
            <p>Thank you for your order! We've received your payment and are processing your order.</p>
            <div class="order-details">
              <h3>Order Details</h3>
              <div class="detail-row">
                <span>Order Number:</span>
                <span><strong>${orderNumber}</strong></span>
              </div>
              <div class="detail-row">
                <span>Product:</span>
                <span>${this.formatProductType(productType)}</span>
              </div>
              <div class="detail-row">
                <span>Quantity:</span>
                <span>${quantity} units</span>
              </div>
              <div class="detail-row total">
                <span>Total Amount:</span>
                <span>₹${formattedAmount}</span>
              </div>
            </div>
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Your order is being prepared for print</li>
              <li>We'll send you a confirmation once it's shipped</li>
              <li>Expected delivery: 5-7 business days</li>
            </ul>
            <p>Track your order status in your dashboard.</p>
            <p>Questions? Contact us at <a href="mailto:orders@qrconnect.in">orders@qrconnect.in</a></p>
            <p>Best regards,<br>The QRConnect Team</p>
          </div>
          <div class="footer">
            <p>© 2024 QRConnect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Order Confirmation - ${orderNumber}`,
      html,
    });

    this.logger.log(`Order confirmation sent to ${email}`);
  }

  /**
   * Send payment success notification
   */
  @Process('send-payment-success')
  async handlePaymentSuccess(
    job: Job<PaymentSuccessEmailData>,
  ): Promise<void> {
    const { email, customerName, orderNumber, amount, paidAt } = job.data;

    this.logger.log(`Sending payment success notification to ${email}`);

    const formattedAmount = (amount / 100).toFixed(2);
    const formattedDate = new Date(paidAt).toLocaleString('en-IN', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-icon { font-size: 48px; }
          .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✓</div>
            <h1>Payment Successful!</h1>
          </div>
          <div class="content">
            <h2>Hi ${customerName},</h2>
            <p>Your payment has been successfully processed.</p>
            <div class="amount">₹${formattedAmount}</div>
            <p><strong>Transaction Details:</strong></p>
            <ul>
              <li>Order Number: ${orderNumber}</li>
              <li>Payment Date: ${formattedDate}</li>
              <li>Amount Paid: ₹${formattedAmount}</li>
            </ul>
            <p>Your order is now in production and will be shipped soon.</p>
            <p>Thank you for choosing QRConnect!</p>
            <p>Best regards,<br>The QRConnect Team</p>
          </div>
          <div class="footer">
            <p>© 2024 QRConnect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Payment Successful - ₹${formattedAmount} - ${orderNumber}`,
      html,
    });

    this.logger.log(`Payment success email sent to ${email}`);
  }

  /**
   * Send form submission notification to business owner
   */
  @Process('send-form-submission-notification')
  async handleFormSubmissionNotification(
    job: Job<FormSubmissionNotificationData>,
  ): Promise<void> {
    const { businessEmail, businessName, formTitle, submissionData, submittedAt } =
      job.data;

    this.logger.log(`Sending form submission notification to ${businessEmail}`);

    const formattedDate = new Date(submittedAt).toLocaleString('en-IN', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    // Format submission data as HTML table
    const dataRows = Object.entries(submissionData)
      .map(
        ([key, value]) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${key}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${value}</td>
      </tr>
    `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .data-table { width: 100%; background: white; border-radius: 5px; overflow: hidden; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Form Submission 📝</h1>
          </div>
          <div class="content">
            <h2>Hi ${businessName},</h2>
            <p>You have a new submission for <strong>"${formTitle}"</strong>.</p>
            <p><small>Submitted on ${formattedDate}</small></p>
            <table class="data-table">
              <tbody>
                ${dataRows}
              </tbody>
            </table>
            <p>View all submissions in your <a href="${this.configService.get('APP_URL', 'https://qrconnect.in')}/dashboard/forms">dashboard</a>.</p>
            <p>Best regards,<br>The QRConnect Team</p>
          </div>
          <div class="footer">
            <p>© 2024 QRConnect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: businessEmail,
      subject: `New Form Submission - ${formTitle}`,
      html,
    });

    this.logger.log(`Form submission notification sent to ${businessEmail}`);
  }

  /**
   * Send email using configured transporter
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const fromEmail = this.configService.get('FROM_EMAIL', 'noreply@qrconnect.in');
    const fromName = this.configService.get('FROM_NAME', 'QRConnect');

    if (!this.transporter) {
      this.logger.warn(
        `Email would be sent to ${options.to}: ${options.subject}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  /**
   * Format product type for display
   */
  private formatProductType(productType: string): string {
    const types = {
      BUSINESS_CARD: 'Business Cards',
      STICKER_SMALL: 'Small Stickers',
      STICKER_MEDIUM: 'Medium Stickers',
      STICKER_LARGE: 'Large Stickers',
      CUSTOM: 'Custom Print',
    };

    return types[productType] || productType;
  }
}
