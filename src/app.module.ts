import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import * as redisStore from 'cache-manager-redis-store';

// Core modules
import { PrismaModule } from './common/prisma/prisma.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { QrCodesModule } from './modules/qr-codes/qr-codes.module';
import { RedirectModule } from './modules/redirect/redirect.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PrintJobsModule } from './modules/print-jobs/print-jobs.module';
import { FormsModule } from './modules/forms/forms.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';

// Workers
import { WorkersModule } from './workers/workers.module';

// Guards
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Redis Cache
    CacheModule.register({
      isGlobal: true,
      store: redisStore as any,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      ttl: parseInt(process.env.DEFAULT_CACHE_TTL) || 300,
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL) || 60000,
        limit: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
      },
    ]),

    // Bull Queue (Redis-based job queue)
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),

    // Core
    PrismaModule,

    // Features
    AuthModule,
    UsersModule,
    BusinessesModule,
    CampaignsModule,
    QrCodesModule,
    RedirectModule,
    AnalyticsModule,
    OrdersModule,
    PaymentsModule,
    PrintJobsModule,
    FormsModule,
    AdminModule,
    HealthModule,

    // Workers
    WorkersModule,
  ],
  providers: [
    // Global JWT authentication guard
    // Routes are protected by default, use @Public() decorator to make them public
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
