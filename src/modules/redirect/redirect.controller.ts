import { Controller, Get, Param, Res, Req, HttpStatus, NotFoundException, GoneException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { RedirectService } from './redirect.service';
import { ScanQueueService } from './scan-queue.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('QR Redirect')
@Controller()
export class RedirectController {
  constructor(
    private readonly redirectService: RedirectService,
    private readonly scanQueueService: ScanQueueService,
  ) {}

  @Public()
  @Get('r/:slug')
  @ApiOperation({ summary: 'QR code redirect (public endpoint)' })
  @ApiResponse({ status: 302, description: 'Redirect to target URL' })
  @ApiResponse({ status: 404, description: 'QR code not found' })
  @ApiResponse({ status: 410, description: 'QR code deactivated' })
  async redirect(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // 1. Validate slug format (alphanumeric, 6-8 chars)
    if (!/^[a-zA-Z0-9]{6,8}$/.test(slug)) {
      throw new NotFoundException('Invalid QR code');
    }

    try {
      // 2. Get redirect target (checks cache first, then DB)
      const redirectData = await this.redirectService.getRedirectTarget(slug);

      if (!redirectData) {
        throw new NotFoundException('QR code not found');
      }

      if (!redirectData.isActive) {
        throw new GoneException('This QR code is no longer active');
      }

      // 3. Queue scan event (non-blocking - fire and forget)
      this.scanQueueService
        .queueScan({
          qrCodeId: redirectData.qrCodeId,
          campaignId: redirectData.campaignId,
          businessId: redirectData.businessId,
          slug,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          referrer: req.headers['referer'],
          timestamp: new Date(),
        })
        .catch((err) => {
          // Log error but don't block redirect
          console.error('Failed to queue scan:', err);
        });

      // 4. Redirect user IMMEDIATELY
      return res.redirect(HttpStatus.FOUND, redirectData.targetUrl);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof GoneException) {
        throw error;
      }

      console.error('Redirect error:', error);
      // Fallback: redirect to homepage or error page
      return res.redirect(HttpStatus.FOUND, 'https://qrconnect.in/error');
    }
  }
}
