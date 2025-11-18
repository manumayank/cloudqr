import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrintJobsService } from './print-jobs.service';
import { UpdatePrintJobStatusDto } from './dto/update-print-job-status.dto';
import { CurrentBusinessId } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/print-jobs')
export class PrintJobsController {
  constructor(private readonly printJobsService: PrintJobsService) {}

  /**
   * List print jobs
   * GET /api/print-jobs
   * Business owners see only their print jobs, admins see all
   */
  @Get()
  findAll(
    @CurrentBusinessId() businessId: string,
    @Query('status') status?: string,
    @Query('orderId') orderId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.printJobsService.findAll(businessId, {
      status,
      orderId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * Get print job details
   * GET /api/print-jobs/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentBusinessId() businessId: string) {
    return this.printJobsService.findOne(id, businessId);
  }

  /**
   * Update print job status (admin only)
   * PATCH /api/print-jobs/:id/status
   */
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePrintJobStatusDto) {
    return this.printJobsService.updateStatus(id, dto);
  }

  /**
   * Get print job PDF download URL
   * GET /api/print-jobs/:id/download
   */
  @Get(':id/download')
  getDownloadUrl(
    @Param('id') id: string,
    @CurrentBusinessId() businessId: string,
  ) {
    return this.printJobsService.getDownloadUrl(id, businessId);
  }
}
