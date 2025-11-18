# QRConnect Production Deployment Checklist

## Pre-Deployment Checklist

### 1. Code & Dependencies ✅
- [x] All code committed to repository
- [x] No TODO comments in critical paths
- [x] Dependencies up to date (`npm audit`)
- [ ] Build succeeds (`npm run build`)
  - **Note:** Requires `npx prisma generate` first
- [ ] No high-severity security vulnerabilities
- [ ] Package-lock.json committed

### 2. Environment Configuration 🔧

#### Required Environment Variables
Create `.env.production` file with the following:

```bash
# Node Environment
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@hostname:5432/qrconnect_prod?schema=public&sslmode=require"

# Redis (for caching & queues)
REDIS_HOST="your-redis-hostname"
REDIS_PORT=6379
REDIS_PASSWORD="your-redis-password"

# JWT Authentication
JWT_SECRET="CHANGE_THIS_TO_STRONG_RANDOM_STRING_64_CHARS_MIN"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="CHANGE_THIS_TO_ANOTHER_STRONG_RANDOM_STRING"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Razorpay (Production Keys)
RAZORPAY_KEY_ID="rzp_live_your_key_id"
RAZORPAY_KEY_SECRET="your_live_key_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# AWS S3
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="your_access_key_id"
AWS_SECRET_ACCESS_KEY="your_secret_access_key"
S3_BUCKET="qrconnect-production"

# Email (SMTP)
SMTP_HOST="smtp.sendgrid.net"  # or smtp.gmail.com, etc.
SMTP_PORT=587
SMTP_USER="your_smtp_username"
SMTP_PASS="your_smtp_password"
FROM_EMAIL="noreply@qrconnect.in"
FROM_NAME="QRConnect"

# Application
APP_URL="https://app.qrconnect.in"
FRONTEND_URL="https://qrconnect.in"
QR_BASE_URL="https://qr.qrconnect.in"  # or app.qrconnect.in

# Caching & Rate Limiting
DEFAULT_CACHE_TTL=300
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=1000
```

#### Generate Secure Secrets
```bash
# Generate JWT secret (64 characters)
openssl rand -base64 48

# Generate Refresh Token secret
openssl rand -base64 48

# Generate Webhook secret (for Razorpay)
openssl rand -hex 32
```

### 3. Database Setup 💾

#### A. Create Production Database
```bash
# Connect to PostgreSQL
psql -h your-db-hostname -U admin -d postgres

# Create database and user
CREATE DATABASE qrconnect_prod;
CREATE USER qrconnect_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE qrconnect_prod TO qrconnect_user;

# Enable UUID extension
\c qrconnect_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### B. Run Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify migrations
npx prisma migrate status
```

#### C. Create Admin User
```sql
-- Connect to production database
\c qrconnect_prod

-- Insert admin user (replace with actual values)
INSERT INTO users (id, email, password_hash, name, role, is_active, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@qrconnect.in',
  -- Generate bcrypt hash for password using: bcrypt.hash('YourSecurePassword', 12)
  '$2b$12$your_bcrypt_hash_here',
  'Admin User',
  'ADMIN',
  true,
  true,
  NOW(),
  NOW()
);
```

#### D. Database Indexes (verify)
```sql
-- Check all indexes are created
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Expected indexes:
-- users: email, role
-- businesses: owner_id, category
-- campaigns: business_id, status
-- qr_codes: slug, campaign_id
-- scans: campaign_id + scanned_at, qr_code_id
-- orders: business_id, status, payment_status
-- etc.
```

### 4. Redis Setup 🔴

#### A. Configure Redis
```bash
# If using Redis Cloud/ElastiCache
# Update REDIS_HOST, REDIS_PORT, REDIS_PASSWORD in .env

# Test connection
redis-cli -h your-redis-host -p 6379 -a your-password ping
# Expected: PONG
```

#### B. Configure Redis Persistence (recommended)
```bash
# Edit redis.conf (if self-hosted)
save 900 1      # Save if 1 key changed in 15 minutes
save 300 10     # Save if 10 keys changed in 5 minutes
save 60 10000   # Save if 10000 keys changed in 1 minute

appendonly yes  # Enable AOF persistence
appendfsync everysec
```

#### C. Set Memory Limits
```bash
# Prevent Redis from using all memory
maxmemory 2gb
maxmemory-policy allkeys-lru  # Evict least recently used keys
```

### 5. AWS S3 Setup ☁️

#### A. Create S3 Bucket
```bash
# Using AWS CLI
aws s3 mb s3://qrconnect-production --region ap-south-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket qrconnect-production \
  --versioning-configuration Status=Enabled
```

#### B. Configure Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/qrconnect-app"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::qrconnect-production/*"
    }
  ]
}
```

#### C. Configure CORS
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://qrconnect.in", "https://app.qrconnect.in"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

#### D. Create IAM User
```bash
# Create user for app
aws iam create-user --user-name qrconnect-app

# Attach policy
aws iam attach-user-policy \
  --user-name qrconnect-app \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create access keys
aws iam create-access-key --user-name qrconnect-app
# Save ACCESS_KEY_ID and SECRET_ACCESS_KEY
```

### 6. Razorpay Setup 💳

#### A. Get Production API Keys
1. Login to Razorpay Dashboard
2. Go to Settings → API Keys
3. Generate Production Keys
4. Copy Key ID and Key Secret
5. Update `.env.production`

#### B. Configure Webhooks
1. Go to Settings → Webhooks
2. Add webhook URL: `https://app.qrconnect.in/api/payments/webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `refund.created`
4. Copy webhook secret
5. Update `RAZORPAY_WEBHOOK_SECRET` in `.env.production`

#### C. Test Webhook
```bash
# Test webhook endpoint (from Razorpay dashboard)
# Should return 200 OK
```

### 7. SMTP / Email Setup 📧

#### Option A: SendGrid
```bash
# Create SendGrid account
# Generate API key
# Update .env.production:
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your_sendgrid_api_key"
```

#### Option B: Gmail (for testing only)
```bash
# Enable 2FA on Gmail account
# Create App Password
# Update .env.production:
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your_app_password"
```

#### Option C: AWS SES
```bash
# Verify domain in AWS SES
# Get SMTP credentials
# Update .env.production:
SMTP_HOST="email-smtp.ap-south-1.amazonaws.com"
SMTP_PORT=587
SMTP_USER="your_ses_smtp_username"
SMTP_PASS="your_ses_smtp_password"
```

### 8. Build & Deploy 🚀

#### A. Build Application
```bash
# Install dependencies
npm ci --production

# Generate Prisma Client
npx prisma generate

# Build TypeScript
npm run build

# Verify dist folder
ls -la dist/
```

#### B. Docker Deployment (Recommended)
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

```bash
# Build image
docker build -t qrconnect-backend:latest .

# Run container
docker run -d \
  --name qrconnect-backend \
  --env-file .env.production \
  -p 3000:3000 \
  qrconnect-backend:latest
```

#### C. Direct Deployment
```bash
# Start with PM2 (process manager)
npm install -g pm2

# Start application
pm2 start dist/main.js --name qrconnect-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 9. Nginx Reverse Proxy 🔐

```nginx
# /etc/nginx/sites-available/qrconnect

# API Server
server {
    listen 80;
    listen 443 ssl http2;
    server_name app.qrconnect.in;

    ssl_certificate /etc/letsencrypt/live/app.qrconnect.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.qrconnect.in/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # QR redirect endpoint (no /api prefix)
    location /r/ {
        proxy_pass http://localhost:3000/r/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Cache QR redirects
        proxy_cache qr_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_key "$scheme$request_method$host$request_uri";
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/qrconnect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 10. SSL Certificates 🔒

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d app.qrconnect.in

# Test auto-renewal
sudo certbot renew --dry-run

# Certificate auto-renews via cron
```

### 11. Monitoring & Logging 📊

#### A. Application Logs
```bash
# PM2 logs
pm2 logs qrconnect-backend

# Docker logs
docker logs -f qrconnect-backend

# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
```

#### B. Error Tracking (Sentry)
```bash
# Install Sentry SDK
npm install @sentry/node

# Add to main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

#### C. Uptime Monitoring
- Set up monitoring with UptimeRobot, Pingdom, or StatusCake
- Monitor: `https://app.qrconnect.in/health`
- Alert email/SMS if health check fails

#### D. Performance Monitoring
- New Relic, Datadog, or AppDynamics
- Track:
  - API response times
  - Database query performance
  - QR redirect latency
  - Queue processing times
  - Error rates

### 12. Security Hardening 🛡️

#### A. Firewall Rules
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable

# Database & Redis should NOT be publicly accessible
# Use private network or VPN
```

#### B. Database Security
```sql
-- Remove default admin users
DROP USER IF EXISTS postgres;

-- Create read-only user for reporting
CREATE USER qrconnect_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE qrconnect_prod TO qrconnect_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO qrconnect_readonly;
```

#### C. Environment Variables
```bash
# Never commit .env files
echo ".env*" >> .gitignore

# Use secrets management in production
# AWS Secrets Manager, HashiCorp Vault, etc.
```

#### D. Rate Limiting
```nginx
# Nginx rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=qr:10m rate=1000r/m;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://localhost:3000;
}

location /r/ {
    limit_req zone=qr burst=50 nodelay;
    proxy_pass http://localhost:3000;
}
```

### 13. Backup Strategy 💾

#### A. Database Backups
```bash
# Daily automated backups
0 2 * * * pg_dump -h db-host -U user qrconnect_prod | gzip > /backups/qrconnect-$(date +\%Y\%m\%d).sql.gz

# Retention: Keep 30 days
find /backups -name "qrconnect-*.sql.gz" -mtime +30 -delete

# Backup to S3
aws s3 sync /backups s3://qrconnect-backups/database/
```

#### B. Redis Backups
```bash
# RDB snapshots
redis-cli BGSAVE

# Copy RDB file to backup location
cp /var/lib/redis/dump.rdb /backups/redis-$(date +%Y%m%d).rdb
```

#### C. S3 Versioning
- Enable S3 versioning (already configured)
- Configure lifecycle policy to delete old versions after 30 days

### 14. Load Testing 🏋️

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test QR redirect performance
ab -n 10000 -c 100 https://app.qrconnect.in/r/test-slug

# Expected Results:
# - Requests per second: >1000
# - Mean time: <50ms
# - 95th percentile: <100ms
# - Failed requests: 0%

# Test API endpoints
ab -n 1000 -c 50 -H "Authorization: Bearer TOKEN" \
  https://app.qrconnect.in/api/campaigns
```

### 15. Post-Deployment Verification ✅

#### A. Health Checks
```bash
# Basic health
curl https://app.qrconnect.in/health
# Expected: {"status":"ok","uptime":..., "version":"1.0.0"}

# Detailed health
curl https://app.qrconnect.in/health/detailed
# Expected: database, redis, queues all "healthy"

# Readiness
curl https://app.qrconnect.in/health/ready
# Expected: 200 OK

# Liveness
curl https://app.qrconnect.in/health/live
# Expected: 200 OK
```

#### B. Smoke Tests
```bash
# Test authentication
curl -X POST https://app.qrconnect.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@qrconnect.in","password":"your_password"}'
# Expected: 200 OK with tokens

# Test QR redirect
curl -I https://app.qrconnect.in/r/test-slug
# Expected: 302 Found

# Test admin stats (with admin token)
curl -X GET https://app.qrconnect.in/api/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Expected: 200 OK with system stats
```

#### C. Performance Baseline
```bash
# QR Redirect Latency
time curl -w "%{time_total}\n" -o /dev/null -s https://app.qrconnect.in/r/test-slug
# Expected: <0.100 seconds

# API Response Time
time curl -w "%{time_total}\n" -o /dev/null -s -H "Authorization: Bearer TOKEN" \
  https://app.qrconnect.in/api/campaigns
# Expected: <0.200 seconds
```

### 16. Rollback Plan 🔄

#### A. Database Rollback
```bash
# Revert to previous migration
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Restore from backup
psql -h db-host -U user qrconnect_prod < backup.sql
```

#### B. Application Rollback
```bash
# Docker
docker stop qrconnect-backend
docker rm qrconnect-backend
docker run -d --name qrconnect-backend qrconnect-backend:previous-tag

# PM2
pm2 stop qrconnect-backend
# Deploy previous version
pm2 restart qrconnect-backend
```

#### C. Rollback Checklist
- [ ] Stop current version
- [ ] Restore database from backup (if schema changed)
- [ ] Deploy previous version
- [ ] Verify health checks
- [ ] Test critical flows
- [ ] Notify team and users

---

## Final Pre-Launch Checklist

### Critical (Must Complete Before Launch)
- [ ] Environment variables configured
- [ ] Database migrated and admin user created
- [ ] Redis connected and accessible
- [ ] S3 bucket created and configured
- [ ] Razorpay production keys configured
- [ ] Razorpay webhooks configured
- [ ] SMTP configured (or graceful fallback verified)
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Health checks passing
- [ ] Load testing completed
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Error tracking configured

### Important (Should Complete Before Launch)
- [ ] Nginx reverse proxy configured
- [ ] Firewall rules configured
- [ ] Log rotation configured
- [ ] Performance monitoring setup
- [ ] Uptime monitoring configured
- [ ] Documentation complete
- [ ] Runbook created
- [ ] Team trained on deployment process

### Nice to Have (Can Be Done Post-Launch)
- [ ] CI/CD pipeline configured
- [ ] Staging environment setup
- [ ] Automated tests
- [ ] A/B testing framework
- [ ] Feature flags
- [ ] CDN configured (CloudFront)
- [ ] DDoS protection (Cloudflare)

---

## Launch Day Checklist 🚀

### T-minus 24 hours
- [ ] Final backup of current system
- [ ] Notify users of maintenance window
- [ ] Prepare rollback plan
- [ ] Verify team availability

### T-minus 2 hours
- [ ] Database backup
- [ ] Redis backup
- [ ] Final code review
- [ ] Staging deployment test

### T-minus 30 minutes
- [ ] Deploy to production
- [ ] Run migrations
- [ ] Start application
- [ ] Verify health checks

### T-minus 15 minutes
- [ ] Smoke tests
- [ ] Performance tests
- [ ] Monitor logs for errors
- [ ] Check all critical flows

### Launch! (T=0)
- [ ] Announce launch
- [ ] Monitor dashboards
- [ ] Watch error rates
- [ ] Track performance metrics
- [ ] Be ready to rollback if needed

### Post-Launch (First Hour)
- [ ] Monitor all metrics closely
- [ ] Check for any errors in logs
- [ ] Verify all background workers running
- [ ] Test critical user flows
- [ ] Gather initial user feedback

### Post-Launch (First Day)
- [ ] Review performance metrics
- [ ] Check error rates and fix critical issues
- [ ] Monitor database and Redis performance
- [ ] Review queue processing times
- [ ] Document any issues and resolutions

### Post-Launch (First Week)
- [ ] Daily metrics review
- [ ] User feedback analysis
- [ ] Performance optimization
- [ ] Bug fixes and patches
- [ ] Documentation updates

---

## Support & Escalation

### On-Call Schedule
- **Week 1:** 24/7 monitoring by core team
- **Week 2-4:** Business hours monitoring with on-call rotation
- **After Month 1:** Standard on-call rotation

### Escalation Path
1. **Level 1:** Application errors, performance issues
   - Contact: DevOps team
   - Response: 15 minutes

2. **Level 2:** Database/Infrastructure issues
   - Contact: Senior DevOps + DBA
   - Response: 30 minutes

3. **Level 3:** Critical system outage
   - Contact: CTO + All hands
   - Response: Immediate

### Emergency Contacts
- **DevOps Lead:** +91-XXXX-XXXXXX
- **Backend Lead:** +91-XXXX-XXXXXX
- **CTO:** +91-XXXX-XXXXXX

---

**Document Version:** 1.0
**Last Updated:** 2024-01-15
**Status:** Ready for Production Deployment
