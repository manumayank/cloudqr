import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdatePrintJobStatusDto } from './dto/update-print-job-status.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrintJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * List print jobs (filtered by business for business owners, all for admins)
   */
  async findAll(
    businessId: string | null, // null for admins
    filters?: {
      status?: string;
      orderId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Business owners can only see their own print jobs
    if (businessId) {
      // Get all campaigns for this business
      const campaigns = await this.prisma.campaign.findMany({
        where: { businessId },
        select: { id: true },
      });

      where.campaignId = {
        in: campaigns.map((c) => c.id),
      };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }

    const [printJobs, total] = await Promise.all([
      this.prisma.printJob.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              productType: true,
              quantity: true,
              amount: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
              businessId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.printJob.count({ where }),
    ]);

    return {
      data: printJobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get print job details
   */
  async findOne(printJobId: string, businessId: string | null) {
    const printJob = await this.prisma.printJob.findUnique({
      where: { id: printJobId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            productType: true,
            quantity: true,
            amount: true,
            shippingAddress: true,
            shippingCity: true,
            shippingState: true,
            shippingPincode: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
            businessId: true,
            business: {
              select: {
                businessName: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!printJob) {
      throw new NotFoundException('Print job not found');
    }

    // Business owners can only access their own print jobs
    if (businessId && printJob.campaign.businessId !== businessId) {
      throw new ForbiddenException(
        'You do not have access to this print job',
      );
    }

    return printJob;
  }

  /**
   * Update print job status (admin only)
   */
  async updateStatus(printJobId: string, dto: UpdatePrintJobStatusDto) {
    const printJob = await this.prisma.printJob.findUnique({
      where: { id: printJobId },
      include: {
        campaign: {
          select: {
            businessId: true,
          },
        },
      },
    });

    if (!printJob) {
      throw new NotFoundException('Print job not found');
    }

    const updated = await this.prisma.printJob.update({
      where: { id: printJobId },
      data: {
        status: dto.status as any,
        ...(dto.status === 'COMPLETED' && { completedAt: new Date() }),
        ...(dto.status === 'FAILED' && { failedAt: new Date() }),
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update order status if print job is completed
    if (dto.status === 'COMPLETED' && printJob.orderId) {
      await this.prisma.order.update({
        where: { id: printJob.orderId },
        data: { status: 'SHIPPED' },
      });
    }

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        businessId: printJob.campaign.businessId,
        action: 'PRINT_JOB_STATUS_UPDATED',
        entityType: 'print_job',
        entityId: printJobId,
        metadata: {
          previousStatus: printJob.status,
          newStatus: dto.status,
        },
      },
    });

    return updated;
  }

  /**
   * Get print job PDF download URL
   */
  async getDownloadUrl(printJobId: string, businessId: string | null) {
    const printJob = await this.prisma.printJob.findUnique({
      where: { id: printJobId },
      include: {
        campaign: {
          select: {
            businessId: true,
          },
        },
      },
    });

    if (!printJob) {
      throw new NotFoundException('Print job not found');
    }

    // Business owners can only access their own print jobs
    if (businessId && printJob.campaign.businessId !== businessId) {
      throw new ForbiddenException(
        'You do not have access to this print job',
      );
    }

    if (!printJob.impositionFileUrl) {
      throw new NotFoundException('Print file not yet generated');
    }

    return {
      printJobId: printJob.id,
      downloadUrl: printJob.impositionFileUrl,
      status: printJob.status,
      createdAt: printJob.createdAt,
    };
  }
}
