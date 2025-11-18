import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { QRCodesService } from './qr-codes.service';
import { UpdateQRCodeDto } from './dto/update-qr-code.dto';
import { CurrentBusinessId } from '../../common/decorators/current-user.decorator';

@Controller('api/qr-codes')
export class QRCodesController {
  constructor(private readonly qrCodesService: QRCodesService) {}

  /**
   * Get QR code details
   * GET /api/qr-codes/:id
   */
  @Get(':id')
  getQRCodeDetails(
    @Param('id') id: string,
    @CurrentBusinessId() businessId: string,
  ) {
    return this.qrCodesService.getQRCodeDetails(id, businessId);
  }

  /**
   * Update QR code settings
   * PUT /api/qr-codes/:id
   */
  @Put(':id')
  updateQRCode(
    @Param('id') id: string,
    @CurrentBusinessId() businessId: string,
    @Body() updateQRCodeDto: UpdateQRCodeDto,
  ) {
    return this.qrCodesService.updateQRCode(id, businessId, updateQRCodeDto);
  }

  /**
   * Activate QR code
   * POST /api/qr-codes/:id/activate
   */
  @Post(':id/activate')
  activateQRCode(
    @Param('id') id: string,
    @CurrentBusinessId() businessId: string,
  ) {
    return this.qrCodesService.activateQRCode(id, businessId);
  }

  /**
   * Deactivate QR code
   * POST /api/qr-codes/:id/deactivate
   */
  @Post(':id/deactivate')
  deactivateQRCode(
    @Param('id') id: string,
    @CurrentBusinessId() businessId: string,
  ) {
    return this.qrCodesService.deactivateQRCode(id, businessId);
  }

  /**
   * Get QR code image
   * GET /api/qr-codes/:id/image
   */
  @Get(':id/image')
  async getQRCodeImage(
    @Param('id') id: string,
    @CurrentBusinessId() businessId: string,
    @Query('format') format: 'png' | 'svg' = 'png',
    @Res() res: Response,
  ) {
    const result = await this.qrCodesService.getQRCodeImage(
      id,
      businessId,
      format,
    );

    res.setHeader('Content-Type', result.contentType);

    if (result.format === 'svg') {
      res.send(result.data);
    } else {
      // Convert data URL to buffer
      const base64Data = result.data.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      res.send(buffer);
    }
  }

  /**
   * Get QR code analytics
   * GET /api/qr-codes/:id/analytics
   */
  @Get(':id/analytics')
  getQRCodeAnalytics(
    @Param('id') id: string,
    @CurrentBusinessId() businessId: string,
  ) {
    return this.qrCodesService.getQRCodeAnalytics(id, businessId);
  }
}
