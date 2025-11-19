# QRConnect Frontend

Modern, user-friendly frontend for QRConnect - built with Next.js 14, TypeScript, and Tailwind CSS.

## 🎨 Design Philosophy

This frontend is designed specifically for non-technical business owners (ages 40-60) in India:

- **Simple & Reassuring**: Clear navigation, minimal distractions
- **Mobile-First**: Optimized for smartphones and tablets
- **Indian Context**: INR currency, Indian English, local use cases
- **Accessible**: Large touch targets, high contrast, clear labels

## 🏗️ Architecture

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State**: React Hooks + sessionStorage/localStorage
- **API**: Axios with interceptors for auth
- **Icons**: Lucide React + Custom SVGs

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout with fonts
│   ├── globals.css               # Global styles & Tailwind
│   ├── login/                    # Authentication
│   ├── dashboard/                # Dashboard & campaigns
│   └── get-started/              # Onboarding flow
│       ├── page.tsx              # Persona & use case selection
│       ├── templates/            # Template gallery
│       └── editor/               # Card designer
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   └── Badge.tsx
│   └── layout/                   # Layout components
│       ├── Header.tsx
│       └── Footer.tsx
├── lib/
│   ├── api.ts                    # API client & endpoints
│   └── utils.ts                  # Helper functions
├── types/
│   └── index.ts                  # TypeScript types
└── public/                       # Static assets

```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Backend API running on `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your API URL
```

### Development

```bash
# Start dev server (runs on port 3001)
npm run dev

# Open http://localhost:3001
```

### Build for Production

```bash
# Build
npm run build

# Start production server
npm start
```

## 🎨 Design System

### Colors

- **Primary**: Blue-indigo (#6366f1) - Trustworthy, professional
- **Secondary**: Warm amber (#f59e0b) - Highlights & accents
- **Success**: Green - Confirmations
- **Error**: Red - Warnings & errors
- **Grays**: Neutral backgrounds and text

### Typography

- **Display**: Poppins (headings, hero text)
- **Body**: Inter (paragraphs, UI text)
- **Sizes**: Responsive scale from xs (12px) to 5xl (48px)

### Components

All components follow accessibility best practices:

- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Focus indicators
- ✅ Color contrast (WCAG AA)

## 📱 Key Flows

### 1. New User Journey

```
Landing Page → Choose Persona → Select Use Case → Pick Template →
Customize Design → Enter Quantity → Login/Signup → Payment →
Order Confirmation → Dashboard
```

### 2. Returning User

```
Login → Dashboard → View Campaigns → Click Campaign →
View Analytics / Edit Destination / View Feedback
```

### 3. QR Scan Experience

```
Customer Scans QR → Redirect Engine →
Google Review / WhatsApp / Feedback Form / Custom Link
```

## 🎯 Target Personas

### Persona 1: Ravi (Amazon Seller)

- Age: 35-45
- Tech comfort: Medium
- Goals: More reviews, repeat customers
- Pain points: Complex tools, policy violations

**UX Adaptations:**
- Simple language, no jargon
- Clear preview before submitting
- Amazon-specific templates & copy
- Review link validation

### Persona 2: Anita (Restaurant Owner)

- Age: 40-55
- Tech comfort: Low-Medium
- Goals: Google ratings, direct orders
- Pain points: Tech complexity, staff training

**UX Adaptations:**
- Large touch targets (min 44px)
- Visual instructions with emojis
- Restaurant templates (food imagery)
- WhatsApp integration for orders

## 🔐 Authentication

Uses JWT tokens stored in localStorage:

- **Access Token**: 15min expiry, sent with API requests
- **Refresh Token**: 7 days, auto-refreshes access token
- **Auto-logout**: Clears tokens on 401 errors

## 📊 Analytics Integration

Ready for:

- Google Analytics 4
- Meta Pixel (Facebook/Instagram ads)
- Razorpay analytics
- Custom event tracking

## 🌍 Localization

Currently: Indian English

Ready for:
- Hindi (हिन्दी)
- Regional languages
- Currency (₹ INR only for now)

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

## 📦 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build image
docker build -t qrconnect-frontend .

# Run
docker run -p 3001:3001 qrconnect-frontend
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=https://api.qrconnect.in
NEXT_PUBLIC_APP_URL=https://qrconnect.in
```

## 🛣️ Roadmap

- [ ] Card editor with live preview
- [ ] Analytics dashboard with charts (Recharts)
- [ ] Feedback form builder
- [ ] Image upload with crop
- [ ] Bulk campaign creation
- [ ] WhatsApp integration
- [ ] Print preview PDF generator
- [ ] Hindi language support
- [ ] Mobile app (React Native)

## 🤝 Contributing

This is a proprietary project. For issues or suggestions, contact the development team.

## 📄 License

Proprietary - All rights reserved
