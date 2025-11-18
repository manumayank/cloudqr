import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import Redis from 'ioredis';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @InjectQueue('scan-logs') private scanLogsQueue: Queue,
    @InjectQueue('print-jobs') private printJobsQueue: Queue,
    @InjectQueue('emails') private emailsQueue: Queue,
  ) {
    // Initialize Redis client for health checks
    const redisHost = this.configService.get('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get('REDIS_PORT', 6379);
    const redisPassword = this.configService.get('REDIS_PASSWORD');

    this.redis = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      maxRetriesPerRequest: 3,
      retryStrategy: () => null, // Don't retry on health checks
    });
  }

  /**
   * Basic health check
   */
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('NODE_ENV', 'development'),
      version: '1.0.0',
    };
  }

  /**
   * Detailed health check with all dependencies
   */
  async detailedCheck() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueues(),
    ]);

    const [database, redis, queues] = checks.map((result) =>
      result.status === 'fulfilled' ? result.value : { status: 'error', error: result.reason?.message },
    );

    const allHealthy =
      database.status === 'healthy' &&
      redis.status === 'healthy' &&
      queues.status === 'healthy';

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('NODE_ENV', 'development'),
      version: '1.0.0',
      checks: {
        database,
        redis,
        queues,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    };
  }

  /**
   * Readiness check (ready to accept traffic)
   */
  async readinessCheck() {
    try {
      // Check if database is accessible
      await this.prisma.$queryRaw`SELECT 1`;

      // Check if Redis is accessible
      await this.redis.ping();

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Readiness check failed:', error);
      throw error;
    }
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase() {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      // Get some basic stats
      const [userCount, campaignCount, scanCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.campaign.count(),
        this.prisma.scan.count(),
      ]);

      return {
        status: 'healthy',
        latency: `${latency}ms`,
        stats: {
          users: userCount,
          campaigns: campaignCount,
          scans: scanCount,
        },
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  /**
   * Check Redis connectivity and performance
   */
  private async checkRedis() {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      // Get Redis info
      const info = await this.redis.info('stats');
      const lines = info.split('\r\n');
      const stats = {};

      lines.forEach((line) => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key) stats[key] = value;
        }
      });

      return {
        status: 'healthy',
        latency: `${latency}ms`,
        stats: {
          totalConnections: stats['total_connections_received'],
          totalCommands: stats['total_commands_processed'],
        },
      };
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  /**
   * Check queue health and job counts
   */
  private async checkQueues() {
    try {
      const [scanLogsStats, printJobsStats, emailsStats] = await Promise.all([
        this.getQueueStats(this.scanLogsQueue, 'scan-logs'),
        this.getQueueStats(this.printJobsQueue, 'print-jobs'),
        this.getQueueStats(this.emailsQueue, 'emails'),
      ]);

      const hasFailedJobs =
        scanLogsStats.failed > 100 ||
        printJobsStats.failed > 50 ||
        emailsStats.failed > 50;

      return {
        status: hasFailedJobs ? 'degraded' : 'healthy',
        queues: {
          scanLogs: scanLogsStats,
          printJobs: printJobsStats,
          emails: emailsStats,
        },
      };
    } catch (error) {
      this.logger.error('Queue health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  /**
   * Get stats for a specific queue
   */
  private async getQueueStats(queue: Queue, name: string) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      name,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
