import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BusinessesService {
  private s3Client: S3Client;
  private bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = this.configService.get('S3_BUCKET');
  }

  /**
   * Get business details
   */
  async getBusinessDetails(businessId: string, currentUserId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
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

    // Only owner can access their business details
    if (business.ownerId !== currentUserId) {
      throw new ForbiddenException('You do not have access to this business');
    }

    return business;
  }

  /**
   * Update business details
   */
  async updateBusiness(
    businessId: string,
    currentUserId: string,
    dto: UpdateBusinessDto,
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Only owner can update their business
    if (business.ownerId !== currentUserId) {
      throw new ForbiddenException('You do not have access to this business');
    }

    const updated = await this.prisma.business.update({
      where: { id: businessId },
      data: {
        ...(dto.businessName && { businessName: dto.businessName }),
        ...(dto.category && { category: dto.category as any }),
        ...(dto.contactEmail && { contactEmail: dto.contactEmail }),
        ...(dto.contactPhone && { contactPhone: dto.contactPhone }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode }),
      },
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

    return updated;
  }

  /**
   * Upload business logo to S3
   */
  async uploadLogo(
    businessId: string,
    currentUserId: string,
    file: Express.Multer.File,
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Only owner can upload logo
    if (business.ownerId !== currentUserId) {
      throw new ForbiddenException('You do not have access to this business');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG and PNG are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `logos/${businessId}/${uuidv4()}.${fileExtension}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Make logo publicly accessible
    });

    await this.s3Client.send(command);

    // Construct logo URL
    const logoUrl = `https://${this.bucket}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${fileName}`;

    // Update business with new logo URL
    const updated = await this.prisma.business.update({
      where: { id: businessId },
      data: { logoUrl },
      select: {
        id: true,
        businessName: true,
        logoUrl: true,
      },
    });

    return updated;
  }

  /**
   * Delete logo
   */
  async deleteLogo(businessId: string, currentUserId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Only owner can delete logo
    if (business.ownerId !== currentUserId) {
      throw new ForbiddenException('You do not have access to this business');
    }

    if (!business.logoUrl) {
      throw new NotFoundException('No logo to delete');
    }

    // Update business to remove logo URL
    const updated = await this.prisma.business.update({
      where: { id: businessId },
      data: { logoUrl: null },
      select: {
        id: true,
        businessName: true,
        logoUrl: true,
      },
    });

    // Note: Optionally, you could also delete the file from S3
    // But keeping old files for now for data retention

    return updated;
  }

  /**
   * Get business statistics
   */
  async getBusinessStats(businessId: string, currentUserId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Only owner can access business stats
    if (business.ownerId !== currentUserId) {
      throw new ForbiddenException('You do not have access to this business');
    }

    const [
      totalCampaigns,
      activeCampaigns,
      totalScans,
      totalOrders,
      totalRevenue,
      totalForms,
      totalCustomers,
    ] = await Promise.all([
      this.prisma.campaign.count({ where: { businessId } }),
      this.prisma.campaign.count({
        where: { businessId, status: 'ACTIVE' },
      }),
      this.prisma.scan.count({ where: { businessId } }),
      this.prisma.order.count({ where: { businessId } }),
      this.prisma.order.aggregate({
        _sum: { amount: true },
        where: { businessId, paymentStatus: 'COMPLETED' },
      }),
      this.prisma.form.count({ where: { businessId } }),
      this.prisma.customer.count({ where: { businessId } }),
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentScans, recentOrders, recentCustomers] = await Promise.all([
      this.prisma.scan.count({
        where: { businessId, scannedAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.order.count({
        where: { businessId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.customer.count({
        where: { businessId, createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return {
      overview: {
        totalCampaigns,
        activeCampaigns,
        totalScans,
        totalOrders,
        totalRevenue: (totalRevenue._sum.amount || 0) / 100,
        totalForms,
        totalCustomers,
      },
      recentActivity: {
        scansLast30Days: recentScans,
        ordersLast30Days: recentOrders,
        newCustomersLast30Days: recentCustomers,
      },
    };
  }
}
