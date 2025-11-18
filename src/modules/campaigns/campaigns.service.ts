import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignUseCase, TargetMode } from '@prisma/client';
import { nanoid } from 'nanoid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Create new campaign with QR code
   */
  async create(businessId: string, dto: CreateCampaignDto) {
    // Build target URL based on use case
    const targetUrl = this.buildTargetUrl(dto);
    const targetMode = this.getTargetMode(dto.useCase);

    // Create campaign and QR code in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create campaign
      const campaign = await tx.campaign.create({
        data: {
          businessId,
          name: dto.name,
          description: dto.description,
          useCase: dto.useCase,
          status: 'DRAFT',
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
        },
      });

      // 2. Generate unique slug for QR code
      const slug = await this.generateUniqueSlug(tx);

      // 3. Create QR code
      const qrCode = await tx.qRCode.create({
        data: {
          campaignId: campaign.id,
          slug,
          codeType: 'SINGLE_DYNAMIC',
          targetMode,
          isActive: false, // Inactive until campaign is activated
        },
      });

      // 4. Create default redirect rule
      await tx.redirectRule.create({
        data: {
          qrCodeId: qrCode.id,
          targetUrl,
          isDefault: true,
          priority: 0,
          metadata: this.buildRuleMetadata(dto),
        },
      });

      return { campaign, qrCode };
    });

    return {
      ...result.campaign,
      qrCode: {
        ...result.qrCode,
        qrUrl: this.buildQRUrl(result.qrCode.slug),
      },
    };
  }

  /**
   * Get all campaigns for a business
   */
  async findAll(businessId: string, filters?: { status?: string; useCase?: string }) {
    const where: any = { businessId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.useCase) {
      where.useCase = filters.useCase;
    }

    const campaigns = await this.prisma.campaign.findMany({
      where,
      include: {
        qrCodes: {
          take: 1,
          select: {
            id: true,
            slug: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            scans: true,
            qrCodes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return campaigns.map((campaign) => ({
      ...campaign,
      totalScans: campaign._count.scans,
      activeQrCodes: campaign._count.qrCodes,
      qrCode: campaign.qrCodes[0]
        ? {
            ...campaign.qrCodes[0],
            qrUrl: this.buildQRUrl(campaign.qrCodes[0].slug),
          }
        : null,
    }));
  }

  /**
   * Get campaign by ID with details
   */
  async findOne(businessId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        businessId, // Multi-tenant isolation
      },
      include: {
        qrCodes: {
          include: {
            redirectRules: {
              where: { isDefault: true },
              take: 1,
            },
            _count: {
              select: {
                scans: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return {
      ...campaign,
      qrCodes: campaign.qrCodes.map((qr) => ({
        ...qr,
        qrUrl: this.buildQRUrl(qr.slug),
        currentTarget: qr.redirectRules[0]?.targetUrl,
        scanCount: qr._count.scans,
      })),
    };
  }

  /**
   * Update campaign (including redirect target)
   */
  async update(businessId: string, campaignId: string, dto: UpdateCampaignDto) {
    // Verify ownership
    const existing = await this.prisma.campaign.findFirst({
      where: { id: campaignId, businessId },
      include: { qrCodes: true },
    });

    if (!existing) {
      throw new NotFoundException('Campaign not found');
    }

    // Update campaign
    const campaign = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });

    // If target URL changed, update redirect rules
    if (dto.targetUrl && existing.qrCodes.length > 0) {
      for (const qr of existing.qrCodes) {
        await this.prisma.redirectRule.updateMany({
          where: {
            qrCodeId: qr.id,
            isDefault: true,
          },
          data: {
            targetUrl: dto.targetUrl,
            metadata: dto.whatsappNumber
              ? { whatsappNumber: dto.whatsappNumber }
              : undefined,
          },
        });
      }

      // Invalidate cache (implementation depends on RedirectService)
      // await this.redirectService.invalidateQRCache(campaignId);
    }

    return campaign;
  }

  /**
   * Soft delete campaign
   */
  async remove(businessId: string, campaignId: string) {
    // Verify ownership
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, businessId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Soft delete by setting status to COMPLETED
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED' },
    });
  }

  /**
   * Generate unique QR code slug
   */
  private async generateUniqueSlug(tx: any): Promise<string> {
    let slug: string;
    let exists: boolean;

    do {
      slug = nanoid(8);
      const existing = await tx.qRCode.findUnique({ where: { slug } });
      exists = !!existing;
    } while (exists);

    return slug;
  }

  /**
   * Build target URL based on campaign use case
   */
  private buildTargetUrl(dto: CreateCampaignDto): string {
    switch (dto.useCase) {
      case CampaignUseCase.REVIEW:
        return dto.googlePlaceId
          ? `https://search.google.com/local/writereview?placeid=${dto.googlePlaceId}`
          : '';
      case CampaignUseCase.WHATSAPP:
        return dto.whatsappNumber
          ? `https://wa.me/${dto.whatsappNumber.replace(/[^0-9]/g, '')}`
          : '';
      case CampaignUseCase.CUSTOM_LINK:
      case CampaignUseCase.OFFER:
        return dto.targetUrl || '';
      case CampaignUseCase.FEEDBACK:
        return dto.formId ? `/forms/${dto.formId}` : '';
      default:
        return dto.targetUrl || '';
    }
  }

  /**
   * Get target mode from use case
   */
  private getTargetMode(useCase: CampaignUseCase): TargetMode {
    const mapping = {
      [CampaignUseCase.REVIEW]: TargetMode.GOOGLE_REVIEW,
      [CampaignUseCase.WHATSAPP]: TargetMode.WHATSAPP,
      [CampaignUseCase.FEEDBACK]: TargetMode.FORM,
      [CampaignUseCase.CUSTOM_LINK]: TargetMode.DIRECT_LINK,
      [CampaignUseCase.OFFER]: TargetMode.DIRECT_LINK,
      [CampaignUseCase.MENU]: TargetMode.DIRECT_LINK,
    };

    return mapping[useCase] || TargetMode.DIRECT_LINK;
  }

  /**
   * Build metadata for redirect rule
   */
  private buildRuleMetadata(dto: CreateCampaignDto): any {
    const metadata: any = {};

    if (dto.whatsappNumber) {
      metadata.whatsappNumber = dto.whatsappNumber;
    }

    if (dto.googlePlaceId) {
      metadata.googlePlaceId = dto.googlePlaceId;
    }

    if (dto.formId) {
      metadata.formId = dto.formId;
    }

    return Object.keys(metadata).length > 0 ? metadata : null;
  }

  /**
   * Build public QR URL
   */
  private buildQRUrl(slug: string): string {
    const baseUrl = this.configService.get('QR_BASE_URL') || 'https://qr.co';
    return `${baseUrl}/r/${slug}`;
  }
}
