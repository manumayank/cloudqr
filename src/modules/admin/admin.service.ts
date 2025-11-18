import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AdminBusinessFiltersDto } from './dto/admin-business-filters.dto';
import { UpdateBusinessStatusDto } from './dto/update-business-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get system-wide statistics
   */
  async getSystemStats() {
    const [
      totalUsers,
      totalBusinesses,
      activeBusinesses,
      totalCampaigns,
      activeCampaigns,
      totalQRCodes,
      totalScans,
      totalOrders,
      totalRevenue,
      pendingPrintJobs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.business.count(),
      this.prisma.business.count({ where: { isActive: true } }),
      this.prisma.campaign.count(),
      this.prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      this.prisma.qRCode.count(),
      this.prisma.scan.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { amount: true },
        where: { paymentStatus: 'COMPLETED' },
      }),
      this.prisma.printJob.count({
        where: { status: { in: ['PENDING', 'QUEUED', 'PROCESSING'] } },
      }),
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentUsers, recentScans, recentOrders] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.scan.count({
        where: { scannedAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    // Top performing campaigns
    const topCampaigns = await this.prisma.campaign.findMany({
      select: {
        id: true,
        name: true,
        businessId: true,
        business: {
          select: {
            businessName: true,
          },
        },
        _count: {
          select: {
            scans: true,
          },
        },
      },
      orderBy: {
        scans: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    return {
      overview: {
        totalUsers,
        totalBusinesses,
        activeBusinesses,
        totalCampaigns,
        activeCampaigns,
        totalQRCodes,
        totalScans,
        totalOrders,
        totalRevenue: (totalRevenue._sum.amount || 0) / 100, // Convert from paise to rupees
        pendingPrintJobs,
      },
      recentActivity: {
        newUsers: recentUsers,
        scansLast30Days: recentScans,
        ordersLast30Days: recentOrders,
      },
      topCampaigns: topCampaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        businessName: campaign.business.businessName,
        totalScans: campaign._count.scans,
      })),
    };
  }

  /**
   * List all businesses with filters and pagination
   */
  async listBusinesses(filters: AdminBusinessFiltersDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter
    if (filters.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { contactEmail: { contains: filters.search, mode: 'insensitive' } },
        { contactPhone: { contains: filters.search } },
      ];
    }

    // Category filter
    if (filters.category) {
      where.category = filters.category;
    }

    // Active status filter
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === 'true';
    }

    const [businesses, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              campaigns: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.business.count({ where }),
    ]);

    return {
      data: businesses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get business details with full info
   */
  async getBusinessDetails(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: {
            campaigns: true,
            orders: true,
            forms: true,
            customers: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Get business statistics
    const [totalScans, totalRevenue, recentOrders] = await Promise.all([
      this.prisma.scan.count({
        where: { businessId },
      }),
      this.prisma.order.aggregate({
        _sum: { amount: true },
        where: { businessId, paymentStatus: 'COMPLETED' },
      }),
      this.prisma.order.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          amount: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      ...business,
      statistics: {
        totalScans,
        totalRevenue: (totalRevenue._sum.amount || 0) / 100,
        totalCampaigns: business._count.campaigns,
        totalOrders: business._count.orders,
        totalForms: business._count.forms,
        totalCustomers: business._count.customers,
      },
      recentOrders,
    };
  }

  /**
   * Update business status (activate/deactivate)
   */
  async updateBusinessStatus(
    businessId: string,
    dto: UpdateBusinessStatusDto,
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const updated = await this.prisma.business.update({
      where: { id: businessId },
      data: { isActive: dto.isActive },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        businessId,
        action: dto.isActive ? 'BUSINESS_ACTIVATED' : 'BUSINESS_DEACTIVATED',
        entityType: 'business',
        entityId: businessId,
        metadata: {
          previousStatus: business.isActive,
          newStatus: dto.isActive,
        },
      },
    });

    return updated;
  }

  /**
   * List all orders with filters
   */
  async listAllOrders(filters: {
    status?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              businessName: true,
              contactEmail: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List all print jobs with filters
   */
  async listAllPrintJobs(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
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
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
              business: {
                select: {
                  businessName: true,
                },
              },
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
   * List all users
   */
  async listUsers(filters: {
    role?: string;
    isActive?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === 'true';
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          phone: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              businesses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user (activate/deactivate, change role)
   */
  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.role && { role: dto.role as any }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Create audit log for all user changes (if they have businesses)
    const userBusiness = await this.prisma.business.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (userBusiness) {
      await this.prisma.auditLog.create({
        data: {
          businessId: userBusiness.id,
          action: 'USER_UPDATED',
          entityType: 'user',
          entityId: userId,
          metadata: {
            changes: dto,
            previousRole: user.role,
            previousActive: user.isActive,
          },
        },
      });
    }

    return updated;
  }
}
