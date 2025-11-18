import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentBusinessId } from '../../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('campaigns/:id/summary')
  @ApiOperation({ summary: 'Get campaign analytics summary' })
  @ApiResponse({ status: 200, description: 'Campaign analytics summary' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO 8601)' })
  async getCampaignSummary(
    @CurrentBusinessId() businessId: string,
    @Param('id') campaignId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    return this.analyticsService.getCampaignSummary(businessId, campaignId, fromDate, toDate);
  }

  @Get('campaigns/:id/scans')
  @ApiOperation({ summary: 'Get time-series scan data for charts' })
  @ApiResponse({ status: 200, description: 'Time-series scan data' })
  @ApiQuery({ name: 'from', required: true, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'to', required: true, description: 'End date (ISO 8601)' })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['hour', 'day', 'week', 'month'],
    description: 'Group by interval',
  })
  async getScansTimeSeries(
    @CurrentBusinessId() businessId: string,
    @Param('id') campaignId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('groupBy') groupBy?: 'hour' | 'day' | 'week' | 'month',
  ) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    return this.analyticsService.getScansTimeSeries(
      businessId,
      campaignId,
      fromDate,
      toDate,
      groupBy || 'day',
    );
  }

  @Get('qr/:id')
  @ApiOperation({ summary: 'Get QR code specific analytics' })
  @ApiResponse({ status: 200, description: 'QR code analytics' })
  async getQRCodeAnalytics(
    @CurrentBusinessId() businessId: string,
    @Param('id') qrCodeId: string,
  ) {
    return this.analyticsService.getQRCodeAnalytics(businessId, qrCodeId);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get collected customer data' })
  @ApiResponse({ status: 200, description: 'List of customers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getCustomers(
    @CurrentBusinessId() businessId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
  ) {
    return this.analyticsService.getCustomers(businessId, page || 1, limit || 20, search);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get overall business statistics' })
  @ApiResponse({ status: 200, description: 'Business stats' })
  async getBusinessStats(@CurrentBusinessId() businessId: string) {
    return this.analyticsService.getBusinessStats(businessId);
  }
}
