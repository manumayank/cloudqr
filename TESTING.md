# QRConnect Backend Testing Guide

This guide provides step-by-step instructions for testing the QRConnect backend implementation.

## Prerequisites

1. **Environment Setup**

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qrconnect"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-super-secret-refresh-token-key"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Razorpay (Test Mode)
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_key_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# AWS S3
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
S3_BUCKET="qrconnect-assets"

# Application
QR_BASE_URL="http://localhost:3000"
DEFAULT_CACHE_TTL=300
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=1000
```

2. **Start Infrastructure**

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Start the application
npm run start:dev
```

## Testing Core Flows

### 1. Authentication Flow

#### Register a New Business

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User",
    "phone": "+919876543210",
    "businessName": "Test Restaurant",
    "businessCategory": "RESTAURANT"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "usr_...",
    "email": "test@example.com",
    "name": "Test User",
    "role": "BUSINESS_OWNER"
  },
  "business": {
    "id": "biz_...",
    "businessName": "Test Restaurant",
    "category": "RESTAURANT"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Save the `accessToken` for subsequent requests.**

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

#### Refresh Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGc..."
  }'
```

### 2. Campaign & QR Code Flow

#### Create a Campaign

```bash
# Replace YOUR_ACCESS_TOKEN with the token from registration/login
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Google Reviews Campaign",
    "description": "Collect customer reviews",
    "useCase": "REVIEW",
    "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
  }'
```

**Expected Response:**
```json
{
  "id": "cmp_...",
  "name": "Google Reviews Campaign",
  "status": "DRAFT",
  "qrCode": {
    "id": "qr_...",
    "slug": "abc12xyz",
    "qrUrl": "http://localhost:3000/r/abc12xyz",
    "isActive": false
  }
}
```

**Save the `campaignId` and `slug` for testing.**

#### List All Campaigns

```bash
curl -X GET http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get Campaign Details

```bash
curl -X GET http://localhost:3000/api/campaigns/CAMPAIGN_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Update Campaign (Activate)

```bash
curl -X PATCH http://localhost:3000/api/campaigns/CAMPAIGN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "status": "ACTIVE"
  }'
```

### 3. QR Code Redirect Flow

#### Test QR Redirect (Public Endpoint)

```bash
# This simulates a customer scanning the QR code
curl -v http://localhost:3000/r/abc12xyz
```

**Expected Response:**
- HTTP 302 redirect to the target URL
- Scan event queued for analytics (non-blocking)

**To test with browser simulation:**
```bash
curl -v http://localhost:3000/r/abc12xyz \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
  -H "X-Forwarded-For: 103.21.244.0"
```

### 4. Analytics Flow

#### Get Campaign Summary

```bash
curl -X GET "http://localhost:3000/api/analytics/campaigns/CAMPAIGN_ID/summary?from=2024-01-01&to=2024-12-31" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "totalScans": 42,
  "uniqueIps": 35,
  "avgScansPerDay": 1.4,
  "peakScanTime": "14:00 - 15:00",
  "deviceBreakdown": {
    "mobile": 30,
    "desktop": 10,
    "tablet": 2
  },
  "topCities": [
    { "city": "Bangalore", "state": "Karnataka", "count": 20 },
    { "city": "Mumbai", "state": "Maharashtra", "count": 15 }
  ],
  "topBrowsers": [
    { "browser": "Chrome", "count": 25 },
    { "browser": "Safari", "count": 12 }
  ]
}
```

#### Get Time-Series Data

```bash
curl -X GET "http://localhost:3000/api/analytics/campaigns/CAMPAIGN_ID/time-series?from=2024-01-01&to=2024-01-31&groupBy=day" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get QR Code Analytics

```bash
curl -X GET "http://localhost:3000/api/analytics/qr-codes/QR_CODE_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get Customer List

```bash
curl -X GET "http://localhost:3000/api/analytics/customers?page=1&limit=20&search=bangalore" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get Business Statistics

```bash
curl -X GET "http://localhost:3000/api/analytics/business/stats" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Order & Payment Flow

#### Create an Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "campaignId": "CAMPAIGN_ID",
    "quantity": 500,
    "productType": "BUSINESS_CARD",
    "shippingAddress": "123 MG Road, Koramangala",
    "shippingCity": "Bangalore",
    "shippingState": "Karnataka",
    "shippingPincode": "560034",
    "notes": "Please print glossy finish"
  }'
```

**Expected Response:**
```json
{
  "order": {
    "id": "ord_...",
    "orderNumber": "ORD-2024-00001",
    "quantity": 500,
    "productType": "BUSINESS_CARD",
    "amount": 250000,
    "currency": "INR",
    "status": "PENDING",
    "paymentStatus": "PENDING"
  },
  "payment": {
    "razorpayOrderId": "order_...",
    "amount": 250000,
    "currency": "INR",
    "key": "rzp_test_..."
  }
}
```

#### List Orders

```bash
curl -X GET "http://localhost:3000/api/orders?status=PENDING" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get Order Details

```bash
curl -X GET http://localhost:3000/api/orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Payment Webhook Flow

**Note:** This is typically triggered by Razorpay, but you can test it manually.

#### Simulate Payment Captured Webhook

```bash
# Generate HMAC signature
PAYLOAD='{"event":"payment.captured","payload":{"payment":{"id":"pay_test123","order_id":"order_xyz","amount":250000,"method":"card","status":"captured","created_at":1640000000}}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "your_webhook_secret" | awk '{print $2}')

curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Expected Outcome:**
1. Order status updated to `PAID`
2. Print job queued in BullMQ
3. Audit log created

### 7. Print Job Worker Flow

The print job worker runs automatically when a payment is captured. To monitor:

#### Check Print Job Status

```bash
curl -X GET http://localhost:3000/api/print-jobs/order/ORDER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "id": "pjob_...",
  "orderId": "ord_...",
  "status": "QUEUED",
  "qrCodesGenerated": 500,
  "sheetCount": 50,
  "impositionFileUrl": "https://qrconnect-assets.s3.ap-south-1.amazonaws.com/print-jobs/pjob_.../ORD-2024-00001.pdf",
  "impositionData": {
    "qrCodes": [...],
    "businessName": "Test Restaurant",
    "campaignName": "Google Reviews Campaign"
  }
}
```

#### Check Queue Status (Redis CLI)

```bash
# Connect to Redis
redis-cli

# List all jobs in print-jobs queue
SMEMBERS bull:print-jobs:completed
SMEMBERS bull:print-jobs:failed
SMEMBERS bull:print-jobs:active
```

## Performance Testing

### QR Redirect Performance

Test redirect latency (should be <100ms):

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:3000/r/abc12xyz

# Using curl with timing
curl -w "@-" -o /dev/null -s http://localhost:3000/r/abc12xyz <<'EOF'
    time_namelookup:  %{time_namelookup}s\n
       time_connect:  %{time_connect}s\n
    time_appconnect:  %{time_appconnect}s\n
   time_pretransfer:  %{time_pretransfer}s\n
      time_redirect:  %{time_redirect}s\n
 time_starttransfer:  %{time_starttransfer}s\n
                    ----------\n
         time_total:  %{time_total}s\n
EOF
```

### Cache Hit Rate

Monitor Redis cache hits:

```bash
# In Redis CLI
redis-cli

# Monitor cache operations
MONITOR

# In another terminal, make multiple requests to the same QR code
for i in {1..10}; do
  curl -s http://localhost:3000/r/abc12xyz > /dev/null
done
```

**Expected:** First request misses cache, subsequent 9 hit cache.

## Integration Testing

### Complete End-to-End Flow

1. **Register** → Get access token
2. **Create Campaign** → Get campaign ID and QR slug
3. **Activate Campaign** → Set status to ACTIVE
4. **Scan QR Code** → Simulate customer scan (5-10 times with different IPs/UAs)
5. **Check Analytics** → Verify scan data appears
6. **Create Order** → Get Razorpay order ID
7. **Simulate Payment** → Send webhook
8. **Verify Print Job** → Check PDF generated and uploaded to S3
9. **Check Final Order Status** → Should be IN_PRODUCTION

### Test Script Example

```bash
#!/bin/bash

# 1. Register
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User","phone":"+919876543210","businessName":"Test Biz","businessCategory":"RESTAURANT"}')

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
echo "Access Token: $TOKEN"

# 2. Create Campaign
CAMPAIGN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Campaign","useCase":"REVIEW","googlePlaceId":"ChIJN1t_tDeuEmsRUsoyG83frY4"}')

CAMPAIGN_ID=$(echo $CAMPAIGN_RESPONSE | jq -r '.id')
QR_SLUG=$(echo $CAMPAIGN_RESPONSE | jq -r '.qrCode.slug')
echo "Campaign ID: $CAMPAIGN_ID"
echo "QR Slug: $QR_SLUG"

# 3. Activate Campaign
curl -s -X PATCH http://localhost:3000/api/campaigns/$CAMPAIGN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"ACTIVE"}' | jq

# 4. Simulate Scans
for i in {1..5}; do
  curl -s http://localhost:3000/r/$QR_SLUG -o /dev/null
  sleep 1
done

# Wait for scan logger worker
sleep 3

# 5. Check Analytics
curl -s -X GET "http://localhost:3000/api/analytics/campaigns/$CAMPAIGN_ID/summary" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "✓ End-to-end test completed"
```

## Troubleshooting

### Common Issues

1. **JWT Errors**
   - Ensure JWT_SECRET is set in .env
   - Check token expiration
   - Verify Authorization header format: `Bearer <token>`

2. **Database Connection Errors**
   - Ensure PostgreSQL is running: `docker-compose ps`
   - Check DATABASE_URL in .env
   - Run migrations: `npx prisma migrate dev`

3. **Redis Connection Errors**
   - Ensure Redis is running: `redis-cli ping`
   - Check REDIS_HOST and REDIS_PORT in .env

4. **QR Redirect Not Working**
   - Verify campaign is ACTIVE
   - Check QR code slug is valid (6-8 alphanumeric chars)
   - Ensure redirect rule exists for the QR code

5. **Print Job Not Processing**
   - Check BullMQ worker is running
   - Verify AWS credentials are correct
   - Check S3 bucket permissions
   - Monitor worker logs: `npm run start:dev` (look for worker output)

## Monitoring

### Logs

```bash
# Application logs
npm run start:dev

# Worker logs (look for ScanLoggerWorker and PrintJobWorker)
tail -f logs/workers.log

# Database queries (enable in Prisma)
DATABASE_LOGGING=true npm run start:dev
```

### Metrics

Key metrics to monitor:

- **QR Redirect Latency**: P50, P95, P99 (target: <100ms)
- **Cache Hit Rate**: (target: >90%)
- **Worker Processing Time**: Scan logger, Print jobs
- **Database Query Performance**: Slow queries
- **Error Rates**: Authentication, payments, workers

## Next Steps

1. Add automated tests (Jest/Supertest)
2. Set up monitoring (Prometheus, Grafana)
3. Configure production environment variables
4. Set up CI/CD pipeline
5. Add load testing (k6, Artillery)
