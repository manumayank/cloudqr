import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import Razorpay from 'razorpay';

@Injectable()
export class OrdersService {
  private razorpay: Razorpay;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });
  }

  /**
   * Create new order with Razorpay payment
   */
  async create(businessId: string, dto: CreateOrderDto) {
    // 1. Verify campaign belongs to business
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: dto.campaignId,
        businessId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // 2. Calculate price
    const pricing = this.getPricing();
    const unitPrice = pricing[dto.productType];

    if (!unitPrice) {
      throw new BadRequestException('Invalid product type');
    }

    const amount = unitPrice * dto.quantity * 100; // Convert to paise

    // 3. Generate order number
    const orderNumber = await this.generateOrderNumber();

    // 4. Create Razorpay order
    const razorpayOrder = await this.razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        businessId,
        campaignId: dto.campaignId,
        productType: dto.productType,
      },
    });

    // 5. Create order in database
    const order = await this.prisma.order.create({
      data: {
        businessId,
        campaignId: dto.campaignId,
        orderNumber,
        quantity: dto.quantity,
        productType: dto.productType,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        amount,
        currency: 'INR',
        paymentId: razorpayOrder.id,
        shippingAddress: dto.shippingAddress,
        shippingCity: dto.shippingCity,
        shippingState: dto.shippingState,
        shippingPincode: dto.shippingPincode,
        notes: dto.notes,
      },
      include: {
        campaign: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        campaignName: order.campaign.name,
        quantity: order.quantity,
        productType: order.productType,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
      },
      payment: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: this.configService.get('RAZORPAY_KEY_ID'),
      },
    };
  }

  /**
   * Get all orders for a business
   */
  async findAll(businessId: string, status?: string) {
    const where: any = { businessId };

    if (status) {
      where.status = status;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        campaign: {
          select: {
            name: true,
          },
        },
        printJobs: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      campaignName: order.campaign.name,
      quantity: order.quantity,
      productType: order.productType,
      amount: order.amount / 100, // Convert to rupees
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      printJob: order.printJobs[0] || null,
    }));
  }

  /**
   * Get order by ID
   */
  async findOne(businessId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        businessId,
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        printJobs: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      ...order,
      amount: order.amount / 100, // Convert to rupees
    };
  }

  /**
   * Get pricing for product types
   */
  private getPricing(): Record<string, number> {
    return {
      BUSINESS_CARD: 5, // ₹5 per card
      STICKER_SMALL: 3, // ₹3 per sticker
      STICKER_MEDIUM: 4,
      STICKER_LARGE: 6,
      CUSTOM: 5,
    };
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
        },
      },
    });

    return `ORD-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
