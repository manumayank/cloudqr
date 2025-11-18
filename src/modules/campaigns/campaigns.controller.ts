import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentBusinessId } from '../../common/decorators/current-user.decorator';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new campaign with QR code' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  async create(@CurrentBusinessId() businessId: string, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns for current business' })
  @ApiResponse({ status: 200, description: 'List of campaigns' })
  async findAll(
    @CurrentBusinessId() businessId: string,
    @Query('status') status?: string,
    @Query('useCase') useCase?: string,
  ) {
    return this.campaignsService.findAll(businessId, { status, useCase });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiResponse({ status: 200, description: 'Campaign details' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.campaignsService.findOne(businessId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(businessId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete campaign' })
  @ApiResponse({ status: 204, description: 'Campaign deleted' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async remove(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    await this.campaignsService.remove(businessId, id);
  }
}
