# QRConnect Backend - Quick Start Guide

Get the QRConnect backend running locally in 5 minutes.

## Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org))
- **Docker** & Docker Compose ([Download](https://www.docker.com/get-started))
- **Git** ([Download](https://git-scm.com))

## Option 1: Docker (Recommended for Quick Start)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd qrconnect-backend
cp .env.example .env
```

### 2. Start All Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- MinIO/S3 (port 9000)
- NestJS API (port 3000)
- Prisma Studio (port 5555)

### 3. Run Database Migrations

```bash
docker-compose exec api npx prisma migrate dev --name init
```

### 4. Access Services

- **API**: http://localhost:3000
- **API Docs (Swagger)**: http://localhost:3000/api
- **Prisma Studio**: http://localhost:5555
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

### 5. Test It Works

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","database":"connected","redis":"connected"}
```

### 6. Stop Services

```bash
docker-compose down
```

---

## Option 2: Local Development (Without Docker)

### 1. Install PostgreSQL & Redis

**macOS** (using Homebrew):
```bash
brew install postgresql@15 redis
brew services start postgresql@15
brew services start redis
```

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install postgresql-15 redis-server
sudo systemctl start postgresql redis
```

**Windows**: Use Docker or install from official websites.

### 2. Create Database

```bash
psql postgres
CREATE DATABASE qrconnect;
CREATE USER qrconnect_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE qrconnect TO qrconnect_user;
\q
```

### 3. Clone and Install

```bash
git clone <repository-url>
cd qrconnect-backend
npm install
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://qrconnect_user:password@localhost:5432/qrconnect?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-key-change-this
```

### 5. Run Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Start Development Server

```bash
npm run start:dev
```

API runs on http://localhost:3000

---

## Development Workflow

### View Database (Prisma Studio)

```bash
npm run prisma:studio
```

Opens http://localhost:5555 with a GUI for your database.

### Create a New Migration

```bash
# After editing prisma/schema.prisma
npx prisma migrate dev --name add_new_field
```

### Test API Endpoints

**Register a new business**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "businessName": "John's Store",
    "businessCategory": "ECOMMERCE"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

Save the `accessToken` from response for authenticated requests.

**Create a campaign** (replace `<TOKEN>`):
```bash
curl -X POST http://localhost:3000/api/v1/campaigns \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Year Promo",
    "useCase": "REVIEW",
    "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
  }'
```

---

## Next Steps

1. **Read the architecture**: See `IMPLEMENTATION_SUMMARY.md` for complete system design
2. **Implement modules**: Follow the roadmap in the implementation summary
3. **Run tests**: `npm test`
4. **Check code quality**: `npm run lint`

---

## Troubleshooting

### Port already in use

If port 3000 is busy:
```bash
# Find process
lsof -i :3000
# Kill it
kill -9 <PID>
```

Or change port in `.env`:
```
PORT=3001
```

### Database connection failed

Check PostgreSQL is running:
```bash
pg_isready
```

Verify DATABASE_URL in `.env` matches your PostgreSQL credentials.

### Redis connection failed

Check Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### Prisma errors

Regenerate client:
```bash
npx prisma generate
```

Reset database (WARNING: deletes all data):
```bash
npx prisma migrate reset
```

---

## Production Deployment

See `IMPLEMENTATION_SUMMARY.md` → Deployment section for:
- AWS/DigitalOcean setup
- Environment variables
- Docker production build
- Performance tuning

---

## Support

For issues or questions:
1. Check `IMPLEMENTATION_SUMMARY.md` for detailed docs
2. Review code examples in design sections
3. Contact the development team

**Happy coding! 🚀**
