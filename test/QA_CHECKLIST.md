# QRConnect Backend – QA Checklist

**Version:** 2.0
**Last Updated:** 2025-11-18
**Status:** Production-Ready

This checklist defines the **minimum quality bar** before deploying any new version of the QRConnect backend to production. All items must be checked and passing before deployment.

---

## 1. Automated Tests

### 1.1 Unit Tests (14 Services)
- [ ] `npm run test` passes with **zero errors**
- [ ] Test coverage >70% for service layer
- [ ] All service tests include:
  - [ ] Happy path (success) test cases
  - [ ] Validation error test cases
  - [ ] Authorization error test cases (ForbiddenException)
  - [ ] Edge cases and boundary conditions

### 1.2 Critical Security Tests ⚠️

#### Auth Tests (CRITICAL)
- [ ] Valid registration creates user + business
- [ ] Duplicate email throws ConflictException
- [ ] Login with valid credentials returns tokens
- [ ] Login with invalid email throws UnauthorizedException
- [ ] Login with invalid password throws UnauthorizedException
- [ ] Inactive users cannot login (ForbiddenException)
- [ ] Refresh token rotation works correctly
- [ ] Logout revokes refresh tokens
- [ ] Password is hashed with bcrypt cost 12
- [ ] JWT tokens include correct payload (sub, email, role, businessId)
- [ ] lastLoginAt timestamp updated on each login

#### Multi-Tenant Tests (CRITICAL) 🔐
- [ ] Business A cannot read Business B's campaigns
- [ ] Business A cannot read Business B's QR codes
- [ ] Business A cannot read Business B's forms
- [ ] Business A cannot read Business B's form submissions
- [ ] Business A cannot read Business B's orders
- [ ] Business A cannot update Business B's campaigns
- [ ] Business A cannot update Business B's QR codes
- [ ] Business A cannot delete Business B's campaigns
- [ ] User 1 cannot update businesses owned by User 2
- [ ] All queries filter by businessId or verify ownership
- [ ] ForbiddenException thrown for cross-tenant access attempts
- [ ] ADMIN role CAN access cross-tenant data (verified)

#### Payment Webhook Tests (CRITICAL) 💳
- [ ] Invalid webhook signature is REJECTED
- [ ] Valid HMAC-SHA256 signature is ACCEPTED
- [ ] Missing signature header throws BadRequestException
- [ ] Tampered webhook body is REJECTED
- [ ] `payment.captured` event marks order as PAID
- [ ] `payment.captured` enqueues exactly one print job
- [ ] Duplicate webhooks are idempotent (no duplicate jobs)
- [ ] `payment.failed` event handled correctly
- [ ] `refund.created` event processed correctly
- [ ] Unknown events handled gracefully (no errors)
- [ ] Man-in-the-middle attacks prevented
- [ ] Signature reuse attacks prevented
- [ ] Service errors allow webhook retry

### 1.3 Module-Specific Tests

#### Users Module Tests
- [ ] User can view profile
- [ ] User can update profile (name, email, phone)
- [ ] Email uniqueness enforced
- [ ] User can change password with correct validation
- [ ] All refresh tokens revoked after password change
- [ ] User can list active sessions
- [ ] User can revoke specific session
- [ ] User can revoke all sessions (logout everywhere)
- [ ] User statistics aggregated correctly
- [ ] Account deletion soft-deletes user + businesses

#### Businesses Module Tests
- [ ] Business owner can view business details
- [ ] Non-owner CANNOT view business details
- [ ] Business owner can update business profile
- [ ] Non-owner CANNOT update business
- [ ] Logo upload validates file type (JPEG/PNG only)
- [ ] Logo upload validates file size (max 5MB)
- [ ] Logo uploads to S3 with public-read ACL
- [ ] Public URL generated correctly for logos
- [ ] Logo deletion works
- [ ] Business statistics calculated correctly

#### QR Codes Module Tests
- [ ] QR code image generation (PNG format)
- [ ] QR code image generation (SVG format)
- [ ] QR code activation/deactivation
- [ ] QR analytics include scans, devices, IPs
- [ ] Cache invalidation on QR update
- [ ] Non-owner CANNOT access QR codes

#### Campaigns Module Tests
- [ ] Campaign CRUD operations
- [ ] Automatic QR code generation on campaign create
- [ ] Campaign status transitions
- [ ] Multi-tenant filtering enforced

#### Forms Module Tests
- [ ] Form creation with 8 field types
- [ ] Public form submission (no auth required)
- [ ] Customer data extraction from submissions
- [ ] Form submissions filtered by business

#### Orders Module Tests
- [ ] Order creation with Razorpay integration
- [ ] Pricing calculation by product type
- [ ] Order number generation (ORD-YYYYMMDD-XXXX)
- [ ] Orders filtered by businessId

#### Print Jobs Module Tests
- [ ] List print jobs (multi-tenant filtered)
- [ ] Admin can update print job status
- [ ] Non-admin CANNOT update status
- [ ] PDF download URLs generated

#### Admin Module Tests
- [ ] System-wide statistics (ADMIN only)
- [ ] Cross-tenant business access (ADMIN only)
- [ ] User management (ADMIN only)
- [ ] Non-admin users BLOCKED from admin endpoints

#### Redirect Module Tests
- [ ] Valid slug redirects with 302
- [ ] Unknown slug returns 404
- [ ] Inactive QR returns 404/410
- [ ] Scan events queued asynchronously
- [ ] Cache hit returns in <30ms
- [ ] Cache miss returns in <100ms

#### Analytics Module Tests
- [ ] Campaign summary statistics
- [ ] Time-series data aggregation
- [ ] Device breakdown (mobile/desktop/tablet)
- [ ] Geographic analytics

#### Health Module Tests
- [ ] /health returns 200 OK
- [ ] /health/detailed includes DB, Redis, queues
- [ ] /health/ready returns 200 when ready
- [ ] /health/live returns 200 when alive

---

## 2. Manual Functional Checks (Staging)

Use a clean staging environment with test database.

### 2.1 Onboarding & Auth
- [ ] Register new user:
  - [ ] User + business created in database
  - [ ] User can login immediately
  - [ ] Access + refresh tokens returned
  - [ ] Dashboard accessible
- [ ] Login with existing user:
  - [ ] Correct email/password works
  - [ ] Wrong password rejected
  - [ ] Inactive account blocked
- [ ] Token refresh:
  - [ ] Old token revoked
  - [ ] New tokens generated
- [ ] Logout:
  - [ ] Refresh token revoked
  - [ ] Cannot use revoked token

### 2.2 User & Business Management
- [ ] User profile:
  - [ ] View profile with businesses
  - [ ] Update name, email, phone
  - [ ] Email duplication prevented
- [ ] Password change:
  - [ ] Current password verified
  - [ ] New password validated (8+ chars, complexity)
  - [ ] All sessions revoked
  - [ ] Must re-login
- [ ] Session management:
  - [ ] List shows active sessions
  - [ ] Can revoke specific session
  - [ ] Can logout from all devices
- [ ] Business profile:
  - [ ] View business details
  - [ ] Update business info
  - [ ] Upload logo (JPEG/PNG, <5MB)
  - [ ] Logo displays correctly
  - [ ] Delete logo works
  - [ ] Statistics show correct data

### 2.3 Campaign & QR Flow
- [ ] Create campaign:
  - [ ] Campaign created
  - [ ] QR code auto-generated
  - [ ] Unique slug assigned
  - [ ] Redirect rule created
- [ ] Update campaign:
  - [ ] Name and description updated
  - [ ] Status changes work
  - [ ] Cache invalidated
- [ ] QR code management:
  - [ ] Download QR as PNG
  - [ ] Download QR as SVG
  - [ ] Activate/deactivate QR
  - [ ] View QR analytics
- [ ] Scan QR from phone:
  - [ ] Redirects to correct URL (302)
  - [ ] Redirect happens in <100ms
  - [ ] Scan appears in analytics (within 5 seconds)
  - [ ] Device type detected correctly
  - [ ] Location detected (if available)

### 2.4 Forms & Data Collection
- [ ] Create feedback form:
  - [ ] All 8 field types supported
  - [ ] Required fields enforced
  - [ ] Field ordering works
- [ ] Submit form (public):
  - [ ] Form accessible without login
  - [ ] Validation works
  - [ ] Submission stored
  - [ ] Customer data extracted
- [ ] View submissions:
  - [ ] All submissions visible
  - [ ] Pagination works
  - [ ] Customer list updated

### 2.5 Orders & Payments
- [ ] Create print order:
  - [ ] Order created with pending status
  - [ ] Razorpay order created
  - [ ] Correct pricing calculated
  - [ ] Order number generated
- [ ] Complete payment (Razorpay test mode):
  - [ ] Redirect to Razorpay
  - [ ] Complete test payment
  - [ ] Webhook received
  - [ ] Order status → PROCESSING
  - [ ] Print job created
  - [ ] Payment success email sent
- [ ] Webhook replay test:
  - [ ] Send same webhook again
  - [ ] No duplicate print jobs created
  - [ ] No duplicate emails sent
- [ ] Payment failure:
  - [ ] Failed payment handled
  - [ ] Order status updated
  - [ ] Failure notification sent

### 2.6 Print Job Workflow
- [ ] Print job creation:
  - [ ] Job appears in queue
  - [ ] Status: PENDING initially
- [ ] Worker processing:
  - [ ] PDF generated correctly
  - [ ] PDF uploaded to S3
  - [ ] Download URL accessible
  - [ ] Order status updated to COMPLETED
- [ ] Admin operations:
  - [ ] Admin can view all print jobs
  - [ ] Admin can update job status
  - [ ] Non-admin blocked from status updates

### 2.7 Admin Dashboard
Requires ADMIN role user.

- [ ] System statistics:
  - [ ] Total users count correct
  - [ ] Total businesses count correct
  - [ ] Total revenue calculated
  - [ ] Growth metrics displayed
- [ ] Business management:
  - [ ] List all businesses (cross-tenant)
  - [ ] View any business details
  - [ ] Activate/deactivate business
- [ ] User management:
  - [ ] List all users
  - [ ] Update user roles
  - [ ] Activate/deactivate users
- [ ] Order oversight:
  - [ ] View all orders (cross-tenant)
  - [ ] Filter by status, date
- [ ] Print job management:
  - [ ] View all print jobs
  - [ ] Update job status
- [ ] Audit logs:
  - [ ] Admin actions logged
  - [ ] Logs include user, action, timestamp

### 2.8 Multi-Tenant Security Validation
**CRITICAL: Manual security audit**

- [ ] Create 2 test businesses (A & B)
- [ ] Login as Business A user
- [ ] Attempt to access Business B's campaign (should FAIL with 403)
- [ ] Attempt to update Business B's QR code (should FAIL with 403)
- [ ] Attempt to view Business B's orders (should FAIL with 403)
- [ ] Attempt to read Business B's form submissions (should FAIL with 403)
- [ ] Login as ADMIN user
- [ ] Verify ADMIN can access both businesses (should SUCCEED)
- [ ] Verify audit log created for admin actions

---

## 3. Non-Functional Checks

### 3.1 Performance ⚡

#### QR Redirect Performance (CRITICAL)
- [ ] Run load test: `ab -n 1000 -c 10 http://staging.qrconnect.in/r/test-slug`
- [ ] Cache hit latency <30ms (p95)
- [ ] Cache miss latency <100ms (p95)
- [ ] Handle 1000+ requests/second
- [ ] Zero failed requests
- [ ] Redis cache hit rate >90%

#### API Response Times
- [ ] GET /api/campaigns - <200ms p95
- [ ] POST /api/campaigns - <300ms p95
- [ ] GET /api/analytics/* - <500ms p95
- [ ] POST /api/orders - <1000ms p95 (includes Razorpay call)

#### Database Performance
- [ ] QR code lookup by slug: <5ms
- [ ] Campaign list query: <20ms
- [ ] Scan aggregation query: <50ms
- [ ] Connection pool configured (20-50 connections)

#### Worker Performance
- [ ] Scan logger: Process 1000+ jobs/minute
- [ ] Print job worker: Complete job in <30 seconds
- [ ] Email worker: Send email in <10 seconds
- [ ] Failed job rate <1%

### 3.2 Resilience 🛡️

#### Redis Failure
- [ ] Stop Redis: `docker stop redis`
- [ ] QR redirects still work (DB fallback)
- [ ] Scan logging fails gracefully (errors logged)
- [ ] Queue jobs fail gracefully
- [ ] Health check returns degraded status
- [ ] Restart Redis: `docker start redis`
- [ ] Service recovers automatically

#### Database Failure
- [ ] Stop PostgreSQL temporarily
- [ ] Health check returns 503 Service Unavailable
- [ ] API endpoints return 500 with clear error messages
- [ ] No data corruption
- [ ] Restart PostgreSQL
- [ ] Service recovers within 30 seconds

#### S3 Failure (Simulated)
- [ ] Disable S3 credentials
- [ ] Logo upload fails with clear error message
- [ ] PDF generation fails gracefully
- [ ] No impact on other features
- [ ] Restore credentials
- [ ] Uploads resume working

### 3.3 Scalability 📈
- [ ] Database connection pooling active
- [ ] Redis connection pooling active
- [ ] No memory leaks (monitor over 1 hour)
- [ ] Graceful handling of concurrent requests
- [ ] Worker queue processing stable under load

---

## 4. Security & Configuration 🔐

### 4.1 Environment Variables
- [ ] `NODE_ENV=production` set
- [ ] `JWT_SECRET` is strong (64+ characters)
- [ ] `REFRESH_TOKEN_SECRET` is strong (64+ characters)
- [ ] `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
- [ ] `AWS_ACCESS_KEY_ID` configured
- [ ] `AWS_SECRET_ACCESS_KEY` configured
- [ ] `SMTP` credentials configured
- [ ] `DATABASE_URL` uses SSL mode (`sslmode=require`)
- [ ] No secrets in git repository
- [ ] `.env` file in `.gitignore`

### 4.2 Security Headers
- [ ] CORS restricted to frontend domains (no `*` wildcard)
- [ ] Helmet middleware enabled
- [ ] Rate limiting active (1000 req/min default)
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block

### 4.3 Authentication & Authorization
- [ ] JWT access tokens expire in 15 minutes
- [ ] Refresh tokens expire in 7 days
- [ ] Refresh tokens rotate on use
- [ ] Password hashing uses bcrypt cost 12
- [ ] Password strength enforced (8+ chars, complexity)
- [ ] Admin endpoints require ADMIN role
- [ ] Protected endpoints require valid JWT
- [ ] Public endpoints work without auth
- [ ] Expired tokens rejected with 401

### 4.4 Multi-Tenant Security (CRITICAL)
- [ ] All service methods filter by businessId
- [ ] ForbiddenException thrown for cross-tenant access
- [ ] Admin role bypass tested and working
- [ ] No SQL injection possible (Prisma ORM parameterized)
- [ ] No NoSQL injection possible
- [ ] Ownership verified before updates/deletes

### 4.5 Input Validation
- [ ] All DTOs use class-validator decorators
- [ ] File uploads validated:
  - [ ] Type validation (JPEG/PNG for logos)
  - [ ] Size validation (max 5MB)
  - [ ] File extension checked
- [ ] Email format validated
- [ ] Phone format validated (E.164 format)
- [ ] URL format validated
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevented (no raw HTML rendering)
- [ ] CSRF protection (helmet)

### 4.6 Payment Security
- [ ] Razorpay webhook signature verified (HMAC-SHA256)
- [ ] Invalid signatures rejected immediately
- [ ] Payment amount not modifiable via API
- [ ] Order amounts match payment amounts
- [ ] Idempotency prevents duplicate charges
- [ ] Refunds tracked and audited

---

## 5. Integration Checks

### 5.1 Redis Integration
- [ ] Connection string correct
- [ ] Authentication working
- [ ] QR cache working (5min TTL)
- [ ] Job queues functional:
  - [ ] scan-logger queue
  - [ ] print-jobs queue
  - [ ] emails queue
- [ ] Cache invalidation working
- [ ] Persistence enabled (RDB + AOF)
- [ ] Memory limits configured (2GB)
- [ ] Eviction policy: allkeys-lru

### 5.2 PostgreSQL Integration
- [ ] Connection string correct (with SSL)
- [ ] All migrations applied: `npx prisma migrate status`
- [ ] Indexes created (verify with `\di` in psql)
- [ ] Connection pooling configured
- [ ] Backup strategy in place (daily backups)
- [ ] No missing foreign keys
- [ ] Constraints enforced (unique, not null)

### 5.3 AWS S3 Integration
- [ ] Bucket exists and accessible
- [ ] Logo uploads work
- [ ] PDF uploads work (print jobs)
- [ ] Public URLs accessible
- [ ] Bucket policy correct (public-read for logos)
- [ ] Versioning enabled
- [ ] Lifecycle policy configured (optional)

### 5.4 Razorpay Integration
- [ ] Production API keys configured
- [ ] Order creation works
- [ ] Webhook URL configured in Razorpay dashboard
- [ ] Webhook secret matches environment variable
- [ ] Test payment in staging completes successfully
- [ ] Payment captured event received
- [ ] Signature verification passes

### 5.5 Email Integration (SMTP)
- [ ] SMTP credentials correct
- [ ] Welcome emails sent on registration
- [ ] Payment success emails sent
- [ ] Order confirmation emails sent
- [ ] Form submission notifications sent
- [ ] Email templates render correctly (HTML)
- [ ] Unsubscribe links working (if applicable)
- [ ] SMTP fallback handling (graceful failures)

---

## 6. Worker & Queue Checks

### 6.1 Scan Logger Worker
- [ ] Worker running (`pm2 list` or `docker ps`)
- [ ] Processes scan events from queue
- [ ] Extracts device type correctly (mobile/desktop/tablet)
- [ ] Parses user agent correctly
- [ ] Extracts browser information
- [ ] GeoIP lookup working (city, country)
- [ ] Scans written to database
- [ ] No memory leaks under load
- [ ] Failed jobs retried (max 3 attempts)

### 6.2 Print Job Worker
- [ ] Worker running
- [ ] Generates QR code images
- [ ] Creates PDF with PDFKit
- [ ] Uploads PDF to S3
- [ ] Updates order status to COMPLETED
- [ ] Sends email notification
- [ ] Job completes in <30 seconds
- [ ] Handles failures gracefully

### 6.3 Email Worker
- [ ] Worker running
- [ ] Sends emails via SMTP
- [ ] Template rendering works
- [ ] Retries on SMTP failure (exponential backoff)
- [ ] Logs delivery status
- [ ] Failed emails logged for manual review
- [ ] Queue not backing up (processed faster than added)

---

## 7. Monitoring & Observability

### 7.1 Health Endpoints
- [ ] `GET /health` returns 200 OK
- [ ] `GET /health/detailed` includes:
  - [ ] Database status (connected/disconnected)
  - [ ] Redis status (connected/disconnected)
  - [ ] Queue statuses (waiting, active, completed, failed counts)
  - [ ] Memory usage
  - [ ] Uptime
- [ ] `GET /health/ready` returns 200 when ready (Kubernetes)
- [ ] `GET /health/live` returns 200 when alive (Kubernetes)

### 7.2 Logging
- [ ] Application logs configured (Winston/Pino)
- [ ] Log level appropriate (info in production, debug in staging)
- [ ] Errors logged with stack traces
- [ ] Sensitive data not logged (passwords, tokens)
- [ ] Request logs include:
  - [ ] Method, URL, status code
  - [ ] Response time
  - [ ] User ID (if authenticated)
- [ ] Log rotation configured (max 100MB, retain 7 days)

### 7.3 Error Tracking
- [ ] Sentry/Rollbar configured (DSN set)
- [ ] Error reporting working (test with throw new Error())
- [ ] Source maps uploaded for stack traces
- [ ] User context included (user ID, email)
- [ ] Environment tagged (production, staging)
- [ ] Release version tagged

### 7.4 Performance Monitoring
- [ ] APM tool configured (New Relic/DataDog)
- [ ] Transaction tracing enabled
- [ ] Database query performance tracked
- [ ] External API calls tracked (Razorpay, S3)
- [ ] Custom metrics tracked:
  - [ ] QR redirect latency
  - [ ] Cache hit rate
  - [ ] Worker processing times
  - [ ] Payment success rate

### 7.5 Uptime Monitoring
- [ ] External monitoring configured (UptimeRobot/Pingdom)
- [ ] Monitor URL: `https://app.qrconnect.in/health`
- [ ] Check frequency: 5 minutes
- [ ] Alert channels configured:
  - [ ] Email
  - [ ] Slack
  - [ ] SMS (for critical)
- [ ] Expected uptime: 99.9%

---

## 8. Documentation

- [ ] API documentation complete (`API_REFERENCE.md`)
- [ ] All 70+ endpoints documented
- [ ] Request/response examples provided
- [ ] Error codes documented
- [ ] Authentication flow documented
- [ ] Deployment checklist reviewed (`DEPLOYMENT_CHECKLIST.md`)
- [ ] Architecture documented (`IMPLEMENTATION_SUMMARY.md`)
- [ ] Environment variables documented (`.env.example`)
- [ ] Rollback procedures documented
- [ ] Incident response plan documented

---

## 9. Release Notes & Rollback

### 9.1 Release Notes
- [ ] Release notes prepared:
  - [ ] Version number (semantic versioning)
  - [ ] New features listed with endpoints
  - [ ] Bug fixes documented
  - [ ] Breaking changes highlighted (if any)
  - [ ] Migration steps included (if any)
  - [ ] Performance improvements noted
- [ ] CHANGELOG.md updated

### 9.2 Database Migrations
- [ ] Migrations tested on staging first
- [ ] Migration rollback tested
- [ ] Backup taken before migration
- [ ] Data loss risk assessed (zero for new features)
- [ ] Migration time estimated (<5 minutes expected)

### 9.3 Rollback Plan
- [ ] Previous version tagged in git
- [ ] Rollback procedure documented:
  - [ ] Stop current application
  - [ ] Revert database migration (if applicable)
  - [ ] Deploy previous version
  - [ ] Clear Redis cache
  - [ ] Verify health checks
  - [ ] Test critical flows
- [ ] Rollback tested in staging
- [ ] Team trained on rollback procedure
- [ ] On-call engineer briefed

### 9.4 Communication
- [ ] Team notified of deployment window
- [ ] Users notified if maintenance required
- [ ] Status page updated (if applicable)
- [ ] Support team briefed on changes
- [ ] Rollback decision maker identified

---

## 10. Post-Deployment Verification

### 10.1 Immediate (First 15 Minutes)
- [ ] All health checks green
- [ ] Smoke tests pass (see Section 2)
- [ ] QR redirect working
- [ ] User login working
- [ ] No error spikes in logs (check last 15 min)
- [ ] Background workers processing
- [ ] Memory usage normal (<1GB per process)
- [ ] CPU usage normal (<50% average)

### 10.2 First Hour
- [ ] Performance metrics normal:
  - [ ] QR redirect P95 <100ms
  - [ ] API endpoints P95 <200ms
  - [ ] Error rate <1%
- [ ] Cache hit rate >90%
- [ ] Database connections stable (no leak)
- [ ] Queue sizes stable (not growing)
- [ ] No memory leaks detected
- [ ] No recurring errors in logs

### 10.3 First Day
- [ ] User feedback collected (if beta users)
- [ ] No critical bugs reported
- [ ] All features functioning as expected
- [ ] Backup completed successfully
- [ ] Metrics trending normally:
  - [ ] Request volume expected
  - [ ] Response times consistent
  - [ ] Error rate steady <1%
- [ ] No performance degradation
- [ ] Worker queues healthy

### 10.4 First Week
- [ ] Daily metrics review
- [ ] User feedback analysis
- [ ] Performance optimization opportunities identified
- [ ] Bug fixes prioritized
- [ ] Documentation updates (if needed)
- [ ] Team retrospective conducted

---

## Approval Sign-Off

**Tested By:** _______________________
**Date:** _______________________
**Environment:** [ ] Staging [ ] Production

**Test Results:**
- [ ] All critical tests passed
- [ ] All security tests passed
- [ ] Performance benchmarks met
- [ ] Integration tests passed
- [ ] Manual testing completed

**Approved for Production Deployment:** [ ] YES [ ] NO

**Deployment Lead:** _______________________
**Signature:** _______________________
**Date:** _______________________

---

**Checklist Version:** 2.0
**Compatible with:** QRConnect Backend v1.0.0+
**Next Review:** 2025-12-01
