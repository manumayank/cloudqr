import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new form for a campaign
   */
  async create(businessId: string, dto: CreateFormDto) {
    // Verify campaign belongs to business
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: dto.campaignId, businessId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Check if campaign already has a form
    const existingForm = await this.prisma.form.findFirst({
      where: { campaignId: dto.campaignId },
    });

    if (existingForm) {
      throw new BadRequestException(
        'Campaign already has a form. Update it or delete the existing one.',
      );
    }

    const form = await this.prisma.form.create({
      data: {
        businessId,
        campaignId: dto.campaignId,
        title: dto.title,
        description: dto.description,
        fields: dto.fields as any,
        submitButtonText: dto.submitButtonText || 'Submit',
        successMessage:
          dto.successMessage || 'Thank you! Your response has been recorded.',
        redirectUrl: dto.redirectUrl,
        isActive: true,
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return form;
  }

  /**
   * Get all forms for a business
   */
  async findAll(
    businessId: string,
    options?: {
      campaignId?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.FormWhereInput = {
      businessId,
      ...(options?.campaignId && { campaignId: options.campaignId }),
      ...(options?.isActive !== undefined && { isActive: options.isActive }),
    };

    const [forms, total] = await Promise.all([
      this.prisma.form.findMany({
        where,
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.form.count({ where }),
    ]);

    return {
      data: forms,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single form by ID
   */
  async findOne(businessId: string, formId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, businessId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    return form;
  }

  /**
   * Get form by campaign ID (public, for form rendering)
   */
  async findByCampaign(campaignId: string) {
    const form = await this.prisma.form.findFirst({
      where: { campaignId, isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        fields: true,
        submitButtonText: true,
        successMessage: true,
        redirectUrl: true,
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found or inactive');
    }

    return form;
  }

  /**
   * Update a form
   */
  async update(businessId: string, formId: string, dto: UpdateFormDto) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, businessId },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // If updating campaign, verify it belongs to business
    if (dto.campaignId && dto.campaignId !== form.campaignId) {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id: dto.campaignId, businessId },
      });

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }
    }

    const updated = await this.prisma.form.update({
      where: { id: formId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.campaignId && { campaignId: dto.campaignId }),
        ...(dto.fields && { fields: dto.fields as any }),
        ...(dto.submitButtonText && { submitButtonText: dto.submitButtonText }),
        ...(dto.successMessage && { successMessage: dto.successMessage }),
        ...(dto.redirectUrl !== undefined && { redirectUrl: dto.redirectUrl }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a form
   */
  async remove(businessId: string, formId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, businessId },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    await this.prisma.form.delete({
      where: { id: formId },
    });

    return { message: 'Form deleted successfully' };
  }

  /**
   * Submit a form (public endpoint)
   */
  async submitForm(formId: string, dto: SubmitFormDto) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: {
        campaign: true,
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    if (!form.isActive) {
      throw new BadRequestException('Form is not accepting submissions');
    }

    // Validate required fields
    const fields = form.fields as any[];
    for (const field of fields) {
      if (field.required && !dto.data[field.label]) {
        throw new BadRequestException(`Field "${field.label}" is required`);
      }
    }

    // Extract customer info from submission
    const customerData = this.extractCustomerData(dto.data);

    // Create or update customer
    let customer = null;
    if (customerData.email || customerData.phone) {
      customer = await this.prisma.customer.upsert({
        where: {
          businessId_email: {
            businessId: form.businessId,
            email: customerData.email || '',
          },
        },
        create: {
          businessId: form.businessId,
          ...customerData,
          source: 'FORM',
        },
        update: {
          ...customerData,
          lastInteraction: new Date(),
        },
      });
    }

    // Create form submission
    const submission = await this.prisma.formSubmission.create({
      data: {
        formId: form.id,
        campaignId: form.campaignId,
        businessId: form.businessId,
        customerId: customer?.id,
        data: dto.data,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        geoCity: dto.geoCity,
        geoState: dto.geoState,
        geoCountry: dto.geoCountry || 'IN',
      },
    });

    return {
      success: true,
      message: form.successMessage,
      redirectUrl: form.redirectUrl,
      submissionId: submission.id,
    };
  }

  /**
   * Get form submissions
   */
  async getSubmissions(
    businessId: string,
    formId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
    },
  ) {
    // Verify form belongs to business
    const form = await this.prisma.form.findFirst({
      where: { id: formId, businessId },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.FormSubmissionWhereInput = {
      formId,
      businessId,
    };

    const [submissions, total] = await Promise.all([
      this.prisma.formSubmission.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.formSubmission.count({ where }),
    ]);

    return {
      data: submissions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Extract customer data from form submission
   */
  private extractCustomerData(data: Record<string, any>): {
    name?: string;
    email?: string;
    phone?: string;
  } {
    const customerData: any = {};

    // Common field name patterns
    const nameFields = ['name', 'full name', 'your name', 'customer name'];
    const emailFields = ['email', 'email address', 'your email'];
    const phoneFields = ['phone', 'phone number', 'mobile', 'contact'];

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      if (nameFields.some((field) => lowerKey.includes(field))) {
        customerData.name = String(value);
      } else if (emailFields.some((field) => lowerKey.includes(field))) {
        customerData.email = String(value);
      } else if (phoneFields.some((field) => lowerKey.includes(field))) {
        customerData.phone = String(value);
      }
    }

    return customerData;
  }
}
