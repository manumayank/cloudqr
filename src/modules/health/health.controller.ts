import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Basic health check
   * GET /health
   */
  @Public()
  @Get()
  check() {
    return this.healthService.check();
  }

  /**
   * Detailed health check with dependencies
   * GET /health/detailed
   */
  @Public()
  @Get('detailed')
  detailedCheck() {
    return this.healthService.detailedCheck();
  }

  /**
   * Readiness probe (for Kubernetes)
   * GET /health/ready
   */
  @Public()
  @Get('ready')
  ready() {
    return this.healthService.readinessCheck();
  }

  /**
   * Liveness probe (for Kubernetes)
   * GET /health/live
   */
  @Public()
  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
