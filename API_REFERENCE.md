# QRConnect API Reference

## Base URL
```
Production: https://app.qrconnect.in
Development: http://localhost:3000
```

## Authentication

All endpoints (except public ones) require JWT authentication.

**Header Format:**
```
Authorization: Bearer {access_token}
```

**Token Expiry:**
- Access Token: 15 minutes
- Refresh Token: 7 days

---

## 1. Authentication Endpoints

### POST /api/auth/register
Register a new business owner and create their business.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+919876543210",
  "businessName": "My Restaurant",
  "businessCategory": "RESTAURANT"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "usr_...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "BUSINESS_OWNER"
  },
  "business": {
    "id": "biz_...",
    "businessName": "My Restaurant",
    "category": "RESTAURANT"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "user": { ... },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### POST /api/auth/logout
Logout and revoke refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`

---

## 2. Campaign Endpoints

### POST /api/campaigns
Create a new campaign with QR code.

**Request Body:**
```json
{
  "name": "Google Reviews Campaign",
  "description": "Collect customer reviews",
  "useCase": "REVIEW",
  "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
}
```

**Use Cases:**
- `REVIEW` - Google Reviews
- `MENU` - Digital Menu
- `WHATSAPP` - WhatsApp Chat
- `SOCIAL_MEDIA` - Social Media Links
- `WEBSITE` - Website Link
- `CUSTOM` - Custom URL

**Response:** `201 Created`
```json
{
  "id": "cmp_...",
  "name": "Google Reviews Campaign",
  "status": "DRAFT",
  "useCase": "REVIEW",
  "qrCode": {
    "id": "qr_...",
    "slug": "abc12xyz",
    "qrUrl": "https://qr.qrconnect.in/r/abc12xyz",
    "isActive": false
  }
}
```

### GET /api/campaigns
List all campaigns for the authenticated business.

**Query Parameters:**
- `status` - Filter by status (DRAFT, ACTIVE, PAUSED, COMPLETED)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "cmp_...",
      "name": "Google Reviews Campaign",
      "status": "ACTIVE",
      "useCase": "REVIEW",
      "createdAt": "2024-01-15T10:30:00Z",
      "_count": {
        "scans": 42,
        "qrCodes": 1
      }
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### GET /api/campaigns/:id
Get campaign details with QR codes.

**Response:** `200 OK`

### PATCH /api/campaigns/:id
Update campaign (including activation/deactivation).

**Request Body:**
```json
{
  "status": "ACTIVE",
  "name": "Updated Campaign Name"
}
```

**Response:** `200 OK`

### DELETE /api/campaigns/:id
Delete a campaign (soft delete).

**Response:** `200 OK`

---

## 3. QR Redirect Endpoint (PUBLIC)

### GET /r/:slug
Redirect QR code scan to target URL.

**Example:** `https://app.qrconnect.in/r/abc12xyz`

**Response:** `302 Found`
- Redirects to target URL
- Queues scan event for analytics (non-blocking)
- Cached for 5 minutes

**Performance:** <100ms P95 latency

---

## 4. Analytics Endpoints

### GET /api/analytics/campaigns/:id/summary
Get campaign analytics summary.

**Query Parameters:**
- `from` - Start date (ISO 8601)
- `to` - End date (ISO 8601)

**Response:** `200 OK`
```json
{
  "totalScans": 142,
  "uniqueIps": 98,
  "avgScansPerDay": 4.7,
  "peakScanTime": "14:00 - 15:00",
  "deviceBreakdown": {
    "mobile": 95,
    "desktop": 40,
    "tablet": 7
  },
  "topCities": [
    { "city": "Bangalore", "state": "Karnataka", "count": 56 },
    { "city": "Mumbai", "state": "Maharashtra", "count": 42 }
  ],
  "topBrowsers": [
    { "browser": "Chrome", "count": 85 },
    { "browser": "Safari", "count": 38 }
  ]
}
```

### GET /api/analytics/campaigns/:id/time-series
Get time-series analytics data.

**Query Parameters:**
- `from` - Start date
- `to` - End date
- `groupBy` - Grouping interval (`hour`, `day`, `week`, `month`)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "date": "2024-01-15",
      "scans": 42,
      "uniqueIps": 35
    }
  ]
}
```

### GET /api/analytics/customers
List customers with pagination and search.

**Query Parameters:**
- `search` - Search by name, email, phone
- `page` - Page number
- `limit` - Items per page

**Response:** `200 OK`

### GET /api/analytics/business/stats
Get business-level aggregated statistics.

**Response:** `200 OK`

---

## 5. Forms Endpoints

### POST /api/forms
Create a form for a campaign.

**Request Body:**
```json
{
  "title": "Customer Feedback",
  "description": "Help us improve",
  "campaignId": "cmp_...",
  "fields": [
    {
      "label": "Name",
      "type": "TEXT",
      "required": true,
      "placeholder": "Your name"
    },
    {
      "label": "Email",
      "type": "EMAIL",
      "required": true
    },
    {
      "label": "Rating",
      "type": "RATING",
      "required": true
    }
  ],
  "submitButtonText": "Submit",
  "successMessage": "Thank you!"
}
```

**Field Types:**
- `TEXT`, `EMAIL`, `PHONE`, `TEXTAREA`, `NUMBER`, `RATING`, `CHOICE`, `MULTIPLE_CHOICE`

**Response:** `201 Created`

### GET /api/forms/campaign/:campaignId (PUBLIC)
Get form definition for rendering (no auth required).

**Response:** `200 OK`
```json
{
  "id": "frm_...",
  "title": "Customer Feedback",
  "description": "Help us improve",
  "fields": [...],
  "submitButtonText": "Submit",
  "successMessage": "Thank you!"
}
```

### POST /api/forms/:id/submit (PUBLIC)
Submit form data (no auth required).

**Request Body:**
```json
{
  "data": {
    "Name": "John Doe",
    "Email": "john@example.com",
    "Rating": "5"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Thank you!",
  "submissionId": "sub_..."
}
```

### GET /api/forms/:id/submissions
List form submissions (business owner only).

**Response:** `200 OK`

---

## 6. Orders Endpoints

### POST /api/orders
Create a new print order.

**Request Body:**
```json
{
  "campaignId": "cmp_...",
  "quantity": 100,
  "productType": "BUSINESS_CARD",
  "shippingAddress": "123 Main St",
  "shippingCity": "Bangalore",
  "shippingState": "Karnataka",
  "shippingPincode": "560001",
  "notes": "Glossy finish"
}
```

**Product Types & Pricing:**
- `BUSINESS_CARD` - ₹5 per card
- `STICKER_SMALL` - ₹3 per sticker
- `STICKER_MEDIUM` - ₹4 per sticker
- `STICKER_LARGE` - ₹6 per sticker
- `CUSTOM` - ₹5 per unit

**Response:** `201 Created`
```json
{
  "order": {
    "id": "ord_...",
    "orderNumber": "ORD-2024-00001",
    "quantity": 100,
    "productType": "BUSINESS_CARD",
    "amount": 50000,
    "currency": "INR",
    "status": "PENDING"
  },
  "payment": {
    "razorpayOrderId": "order_...",
    "amount": 50000,
    "currency": "INR",
    "key": "rzp_..."
  }
}
```

### GET /api/orders
List orders for business.

**Query Parameters:**
- `status` - Filter by status
- `page`, `limit` - Pagination

**Response:** `200 OK`

### GET /api/orders/:id
Get order details.

**Response:** `200 OK`

---

## 7. Payments Endpoint (PUBLIC)

### POST /api/payments/webhook
Razorpay webhook handler (called by Razorpay).

**Headers:**
- `X-Razorpay-Signature` - HMAC-SHA256 signature

**Events Handled:**
- `payment.captured` - Payment successful
- `payment.failed` - Payment failed
- `refund.created` - Refund processed

**Response:** `200 OK`

---

## 8. Print Jobs Endpoints

### GET /api/print-jobs
List print jobs (filtered by business for owners, all for admins).

**Query Parameters:**
- `status` - PENDING, QUEUED, PROCESSING, COMPLETED, FAILED
- `orderId` - Filter by order
- `page`, `limit` - Pagination

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "pjob_...",
      "status": "COMPLETED",
      "qrCodesGenerated": 100,
      "sheetCount": 10,
      "impositionFileUrl": "https://s3.../print.pdf",
      "order": {
        "orderNumber": "ORD-2024-00001",
        "quantity": 100
      }
    }
  ],
  "meta": { ... }
}
```

### GET /api/print-jobs/:id
Get print job details.

**Response:** `200 OK`

### PATCH /api/print-jobs/:id/status (ADMIN ONLY)
Update print job status.

**Request Body:**
```json
{
  "status": "COMPLETED"
}
```

**Response:** `200 OK`

### GET /api/print-jobs/:id/download
Get PDF download URL.

**Response:** `200 OK`
```json
{
  "printJobId": "pjob_...",
  "downloadUrl": "https://s3.../print.pdf",
  "status": "COMPLETED"
}
```

---

## 9. Admin Endpoints (ADMIN ROLE ONLY)

### GET /api/admin/stats
Get system-wide dashboard statistics.

**Response:** `200 OK`
```json
{
  "overview": {
    "totalUsers": 150,
    "totalBusinesses": 120,
    "activeBusinesses": 95,
    "totalCampaigns": 450,
    "activeCampaigns": 280,
    "totalQRCodes": 450,
    "totalScans": 25000,
    "totalOrders": 85,
    "totalRevenue": 42500,
    "pendingPrintJobs": 5
  },
  "recentActivity": {
    "newUsers": 12,
    "scansLast30Days": 8500,
    "ordersLast30Days": 28
  },
  "topCampaigns": [...]
}
```

### GET /api/admin/businesses
List all businesses across all tenants.

**Query Parameters:**
- `search` - Search by name, email, phone
- `category` - ECOMMERCE, RESTAURANT, OTHER
- `isActive` - true/false
- `page`, `limit` - Pagination

**Response:** `200 OK`

### GET /api/admin/businesses/:id
Get detailed business information.

**Response:** `200 OK`

### PATCH /api/admin/businesses/:id
Update business status (activate/deactivate).

**Request Body:**
```json
{
  "isActive": false
}
```

**Response:** `200 OK`

### GET /api/admin/orders
List all orders across all businesses.

**Query Parameters:**
- `status`, `paymentStatus`, `page`, `limit`

**Response:** `200 OK`

### GET /api/admin/print-jobs
List all print jobs across all businesses.

**Response:** `200 OK`

### GET /api/admin/users
List all users.

**Query Parameters:**
- `role` - ADMIN, BUSINESS_OWNER
- `isActive` - true/false
- `search` - Search by name, email

**Response:** `200 OK`

### PATCH /api/admin/users/:id
Update user role or status.

**Request Body:**
```json
{
  "role": "ADMIN",
  "isActive": true
}
```

**Response:** `200 OK`

---

## 10. Health Check Endpoints (PUBLIC)

### GET /health
Basic health check.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "1.0.0"
}
```

### GET /health/detailed
Detailed health check with dependency status.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "status": "healthy",
      "latency": "5ms",
      "stats": {
        "users": 150,
        "campaigns": 450,
        "scans": 25000
      }
    },
    "redis": {
      "status": "healthy",
      "latency": "2ms"
    },
    "queues": {
      "status": "healthy",
      "queues": {
        "scanLogs": {
          "waiting": 0,
          "active": 0,
          "completed": 1000,
          "failed": 2
        },
        "printJobs": { ... },
        "emails": { ... }
      }
    }
  },
  "memory": {
    "used": 120,
    "total": 256,
    "unit": "MB"
  }
}
```

### GET /health/ready
Readiness probe (Kubernetes).

**Response:** `200 OK` if ready, `503 Service Unavailable` if not

### GET /health/live
Liveness probe (Kubernetes).

**Response:** `200 OK` (always, if process running)

---

## Error Responses

### Standard Error Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Common Status Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate email, etc.)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

- **Default:** 1000 requests per minute per IP
- **QR Redirect:** No rate limit (performance critical)
- **Form Submit:** 5 submissions per IP per hour

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1640000000
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response Meta:**
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## Webhooks

### Razorpay Webhook
**URL:** `POST /api/payments/webhook`

**Signature Verification:**
```javascript
const signature = req.headers['x-razorpay-signature'];
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature === expectedSignature) {
  // Process webhook
}
```

---

## SDKs & Libraries

### JavaScript/TypeScript
```bash
npm install axios
```

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://app.qrconnect.in',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Create campaign
const response = await api.post('/api/campaigns', {
  name: 'My Campaign',
  useCase: 'REVIEW'
});
```

### cURL Examples
See TESTING.md for comprehensive cURL examples for all endpoints.

---

## Support

- **Documentation:** https://docs.qrconnect.in
- **API Status:** https://status.qrconnect.in
- **Support Email:** support@qrconnect.in
- **GitHub Issues:** https://github.com/qrconnect/backend/issues

---

**API Version:** 1.0.0
**Last Updated:** 2024-01-15
