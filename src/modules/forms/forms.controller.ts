import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import { CurrentBusinessId } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Request } from 'express';
import * as geoip from 'geoip-lite';
import * as UAParser from 'ua-parser-js';

@Controller('api/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  /**
   * Create a new form
   * POST /api/forms
   */
  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() createFormDto: CreateFormDto,
  ) {
    return this.formsService.create(businessId, createFormDto);
  }

  /**
   * Get all forms for the business
   * GET /api/forms
   */
  @Get()
  findAll(
    @CurrentBusinessId() businessId: string,
    @Query('campaignId') campaignId?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.formsService.findAll(businessId, {
      campaignId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * Get a single form
   * GET /api/forms/:id
   */
  @Get(':id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.formsService.findOne(businessId, id);
  }

  /**
   * Get form by campaign ID (public, for rendering)
   * GET /api/forms/campaign/:campaignId
   */
  @Public()
  @Get('campaign/:campaignId')
  findByCampaign(@Param('campaignId') campaignId: string) {
    return this.formsService.findByCampaign(campaignId);
  }

  /**
   * Update a form
   * PATCH /api/forms/:id
   */
  @Patch(':id')
  update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() updateFormDto: UpdateFormDto,
  ) {
    return this.formsService.update(businessId, id, updateFormDto);
  }

  /**
   * Delete a form
   * DELETE /api/forms/:id
   */
  @Delete(':id')
  remove(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.formsService.remove(businessId, id);
  }

  /**
   * Submit a form (public endpoint)
   * POST /api/forms/:id/submit
   */
  @Public()
  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @Body() submitFormDto: SubmitFormDto,
    @Req() req: Request,
  ) {
    // Extract metadata from request
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // GeoIP lookup
    const geo = geoip.lookup(ipAddress);

    const enrichedDto: SubmitFormDto = {
      ...submitFormDto,
      ipAddress,
      userAgent,
      geoCity: geo?.city || null,
      geoState: geo?.region || null,
      geoCountry: geo?.country || 'IN',
    };

    return this.formsService.submitForm(id, enrichedDto);
  }

  /**
   * Get form submissions
   * GET /api/forms/:id/submissions
   */
  @Get(':id/submissions')
  getSubmissions(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.formsService.getSubmissions(businessId, id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }
}
