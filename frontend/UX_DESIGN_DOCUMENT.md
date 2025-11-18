# QRConnect - UX/UI Design Document

> Comprehensive UX/UI design specifications for QRConnect platform

## Table of Contents

1. [Product Context](#product-context)
2. [Target Personas](#target-personas)
3. [Information Architecture](#information-architecture)
4. [User Flows](#user-flows)
5. [Design System](#design-system)
6. [Wireframes & Screens](#wireframes--screens)
7. [Component Library](#component-library)
8. [Copy Guidelines](#copy-guidelines)
9. [Accessibility](#accessibility)
10. [Mobile UX](#mobile-ux)

---

## Product Context

### Problem Statement

Ecommerce sellers (Amazon/Flipkart/Meesho) and restaurant owners (Zomato/Swiggy/Uber Eats) lack direct connection with their customers. They need:

- ⭐ More reviews (Google, Amazon, Zomato)
- 🔄 Repeat orders and customer loyalty
- 💬 WhatsApp subscribers for direct marketing
- 📝 Feedback and ratings
- 📊 Customer data and insights

### Solution

QRConnect provides:

1. **Physical QR Cards/Stickers**
   - Custom designed with business logo and branding
   - Printed on premium material (HP Indigo)
   - Delivered in 3-5 days across India
   - Quantities: 100/250/500/1000

2. **Simple Dashboard**
   - Change QR destination anytime (dynamic QR)
   - View analytics (scans, devices, locations)
   - Collect feedback submissions
   - Export customer data

### Design Principles

1. **Extremely Simple**: No jargon, clear labels, one-click actions
2. **Reassuring**: Trust indicators, preview before commit, clear pricing
3. **Mobile-First**: Large buttons (44px min), readable fonts, touch-friendly
4. **India-Focused**: INR currency, local payment methods, Indian English

---

## Target Personas

### Persona 1: Ravi - Amazon Seller

**Demographics:**
- Age: 35-45
- Location: Tier 2 city (Pune, Surat, Jaipur)
- Tech comfort: Medium
- Education: Graduate

**Business:**
- Sells home products on Amazon & Flipkart
- 100-500 orders/month
- Revenue: ₹2-5 lakhs/month
- Operates from home/small warehouse

**Goals:**
- Get more Amazon reviews (4.5+ rating)
- Build WhatsApp list for new product launches
- Reduce return rates through better quality perception
- Get repeat customers

**Pain Points:**
- Amazon policy violations (fear of account suspension)
- Complex tools waste time
- Doesn't want to learn new software
- Worried about spending money on unproven solutions

**UX Adaptations:**
- Simple, jargon-free language
- Clear preview before ordering
- Amazon-specific templates and copy
- Review link validation
- Transparent pricing (no hidden fees)
- Video tutorials in Hindi

### Persona 2: Anita - Restaurant Owner

**Demographics:**
- Age: 40-55
- Location: Urban area (Mumbai, Bangalore, Delhi)
- Tech comfort: Low-Medium
- Education: Some college

**Business:**
- Runs 1-3 restaurant outlets
- On Zomato, Swiggy, Uber Eats
- 50-200 orders/day
- Revenue: ₹5-15 lakhs/month

**Goals:**
- Improve Google rating (3.8 → 4.2+)
- Get more direct orders (avoid platform commission)
- Collect customer contact info for offers
- Understand customer preferences

**Pain Points:**
- Tech complexity (too many features)
- Staff training overhead
- Busy schedule (no time to learn)
- Platform dependency (high commissions)

**UX Adaptations:**
- Large touch targets (tablet-friendly for staff)
- Visual instructions with emojis
- Restaurant-specific templates (food imagery)
- WhatsApp integration (familiar tool)
- One-page dashboard (no overwhelming options)

---

## Information Architecture

### Site Map

```
Public Site
├── Home (/)
│   ├── Hero
│   ├── How It Works
│   ├── Use Cases
│   ├── Pricing
│   └── CTA
├── Login/Signup (/login)
├── Use Cases
│   ├── Reviews (/use-cases/reviews)
│   ├── WhatsApp (/use-cases/whatsapp)
│   ├── Feedback (/use-cases/feedback)
│   ├── Ecommerce (/use-cases/ecommerce)
│   └── Restaurants (/use-cases/restaurants)
├── FAQ (/faq)
├── Contact (/contact)
├── Privacy Policy (/privacy)
└── Terms of Service (/terms)

Onboarding Flow
└── Get Started (/get-started)
    ├── Persona Selection (Step 1)
    ├── Use Case Selection (Step 2)
    ├── Template Gallery (/get-started/templates)
    ├── Card Editor (/get-started/editor)
    ├── Checkout (/get-started/checkout)
    └── Success (/get-started/success)

Dashboard (Authenticated)
└── Dashboard (/dashboard)
    ├── Overview (campaign list)
    ├── Orders (/dashboard/orders)
    ├── Settings (/dashboard/settings)
    └── Campaign Detail (/dashboard/campaigns/:id)
        ├── Overview
        ├── Edit Destination (modal)
        ├── Analytics (/dashboard/campaigns/:id/analytics)
        └── Feedback (/dashboard/campaigns/:id/feedback)

Public QR Redirect
└── Redirect (/r/:slug)
    → Handled by backend, records analytics, redirects
```

---

## User Flows

### Flow 1: New User → First Order

**Scenario:** Ravi (Amazon Seller) wants QR cards for reviews

```
1. Landing Page
   ↓ Click "Get QR Cards Now"

2. Persona Selection (/get-started)
   - Sees 2 options: "I Sell on Amazon/Flipkart" | "I Run a Restaurant"
   - Clicks "I Sell on Amazon/Flipkart"
   - Progress: [1/3] ●○○
   ↓

3. Use Case Selection
   - Sees 4 options: Reviews | Feedback | WhatsApp | Custom Link
   - Clicks "Get More Reviews" (with clear description)
   - Progress: [2/3] ●●○
   ↓

4. Template Gallery (/get-started/templates)
   - Sees 4-6 card designs with previews
   - Selects "Modern Minimal" template
   - Progress: [3/3] ●●●
   ↓

5. Card Editor (/get-started/editor)
   - Left panel: Form inputs
     - Business Name*
     - Logo Upload (with preview)
     - Brand Color (color picker)
     - Headline* (pre-filled: "Love our product? Leave a review!")
     - Subtext (pre-filled: "Your review helps us serve you better")
   - Right panel: Live Preview
     - Updates in real-time as user types
     - Shows QR code mockup with branding
   - Tip: "Keep message clear and simple"
   ↓ Click "Continue to Checkout"

6. Checkout (/get-started/checkout)
   - Product Type: Cards | Stickers
   - Quantity: 100 (₹999) | 250 (₹1,999) ← Popular | 500 (₹3,499) | 1000 (₹5,999)
   - Delivery Address form
   - Order Summary sidebar (sticky)
   - Trust badges: "Premium print" | "Free shipping" | "Update QR anytime"
   ↓ Click "Place Order & Pay"

7a. If NOT logged in → Redirect to Login
    - Simple login/signup modal
    - Email + Password OR Google/Facebook
    - Returns to checkout after auth
    ↓

7b. If logged in → Razorpay Payment
    - Razorpay modal opens
    - UPI | Cards | Net Banking | Wallets
    - Payment success
    ↓

8. Success Page (/get-started/success)
   - ✅ "Order Placed Successfully!"
   - Order details & tracking
   - "What happens next" (3 steps)
   - CTA: "Go to Dashboard" (primary) | "Back to Home" (secondary)
   ↓

9. Dashboard (/dashboard)
   - Sees new campaign in list
   - Can view analytics (currently 0 scans)
   - Can edit destination URL
```

**Decision Points:**
- Persona selection narrows down relevant use cases
- Use case pre-fills content for card editor
- Template provides visual structure
- Live preview reduces anxiety before ordering
- Login delayed until payment to reduce friction

**Success Metrics:**
- Time to complete: <5 minutes
- Abandonment rate: <30%
- User satisfaction: 4+/5

---

### Flow 2: Returning User → Edit Campaign

**Scenario:** Anita (Restaurant Owner) wants to change QR to new offer

```
1. Login (/login)
   - Email + Password
   ↓

2. Dashboard (/dashboard)
   - Sees list of campaigns
   - Campaign card shows:
     - Name: "Restaurant Review Card - Main Outlet"
     - Type: Google Reviews | Status: Active
     - Stats: 1,247 scans | Created: Feb 15, 2025
   - Clicks campaign
   ↓

3. Campaign Detail (/dashboard/campaigns/:id)
   - Top: Name | Status badge | "Edit Destination" button
   - Quick stats: Total scans | This week | This month
   - Sidebar:
     - QR code preview with download
     - Current destination (Google Review link)
     - Short URL: qrconnect.in/r/abc123
   - Main area:
     - Scans over time (line chart)
     - Device breakdown (pie chart)
     - Top locations (bar chart)
   - Clicks "Edit Destination"
   ↓

4. Edit Destination Modal
   - Current: Google Review Link
   - Options:
     [ ] Google Review Link
     [x] Custom Link ← Selected
   - Input: "Target URL*"
   - Enters: "https://restaurant.com/diwali-offer"
   - Validation: ✅ Valid URL
   - Click "Save Changes"
   ↓

5. Confirmation
   - Modal closes
   - Toast: "✅ Destination updated successfully"
   - QR now redirects to new URL
   - Old QR cards immediately work with new link (dynamic!)
   ↓

6. View Analytics
   - Clicks "View Detailed Analytics"
   - Sees:
     - Scans over time (30 days)
     - Peak hours (10-12 PM, 6-8 PM)
     - Device types (75% mobile, 20% desktop, 5% tablet)
     - Top cities (Mumbai, Pune, Bangalore)
     - Browser distribution
   - Can export as PDF/CSV
```

**Key UX Points:**
- Campaign list provides at-a-glance status
- Edit is accessible but not accidental
- Clear confirmation after edit
- Analytics are visual (charts, not tables)
- Export option for power users

---

### Flow 3: Customer → Scans QR Code

**Scenario:** Customer receives order with QR card

```
1. Physical Card
   - Customer opens package
   - Sees QR card with message: "Love our product? Leave a review! ⭐"
   - Opens phone camera
   ↓

2. Scan QR Code
   - Phone camera detects QR
   - Shows link: qrconnect.in/r/abc123
   - Taps notification
   ↓

3. Redirect Page (/r/abc123)
   - Backend records:
     - Timestamp
     - Device type (mobile)
     - Browser (Chrome)
     - Location (Mumbai, India)
     - IP, User-Agent
   - Instantly redirects (< 100ms)
   ↓

4a. If Review Campaign → Google Review
    - Opens Google review page
    - Pre-filled business name
    - Customer leaves 5-star review

4b. If WhatsApp Campaign → WhatsApp
    - Opens WhatsApp with pre-filled message
    - Customer sends message, joins broadcast list

4c. If Feedback Campaign → Form
    - Opens custom feedback form
    - Fields: Name, Email, Phone, Rating (1-5), Comments
    - Submit → Thank you page

4d. If Custom Link → Website
    - Opens target URL
    - Customer sees offer/content
```

**Performance Requirements:**
- Redirect latency: <100ms (cache hit), <300ms (cache miss)
- Mobile-optimized (90%+ of scans are mobile)
- Works offline (graceful degradation)

---

## Design System

### Color Palette

**Primary (Blue-Indigo)** - Trustworthy, Professional
```
50:  #f0f4ff
100: #e0e7ff
200: #c7d2fe
500: #6366f1 ← Main primary
600: #4f46e5
700: #4338ca
```

**Secondary (Warm Amber)** - Highlights, Accents
```
100: #fde68a
400: #f59e0b ← Main secondary
500: #d97706
```

**Success (Green)**
```
500: #10b981
600: #059669
```

**Error (Red)**
```
500: #ef4444
600: #dc2626
```

**Neutral (Gray)**
```
50:  #f9fafb ← Backgrounds
100: #f3f4f6
200: #e5e7eb ← Borders
600: #4b5563 ← Body text
900: #111827 ← Headings
```

### Typography

**Font Families:**
- **Display (Headings):** Poppins (400, 500, 600, 700)
- **Body (Text):** Inter (400, 500, 600)

**Font Sizes:**
```css
xs:   0.75rem (12px) - Labels, captions
sm:   0.875rem (14px) - Small text
base: 1rem (16px) - Body text
lg:   1.125rem (18px) - Large body
xl:   1.25rem (20px) - Subheadings
2xl:  1.5rem (24px) - Section titles
3xl:  1.875rem (30px) - Page titles (mobile)
4xl:  2.25rem (36px) - Page titles (desktop)
5xl:  3rem (48px) - Hero text
```

**Line Heights:**
- Body: 1.5 (24px for 16px text)
- Headings: 1.2 (tight)

### Spacing Scale

Based on 4px grid:

```
1:  0.25rem (4px)
2:  0.5rem (8px)
3:  0.75rem (12px)
4:  1rem (16px) ← Base unit
6:  1.5rem (24px)
8:  2rem (32px)
12: 3rem (48px)
16: 4rem (64px)
```

### Border Radius

```
sm:  0.25rem (4px) - Inputs
md:  0.5rem (8px) - Buttons, cards
lg:  0.75rem (12px) - Large cards
xl:  1rem (16px) - Modals
2xl: 1.5rem (24px) - Hero sections
```

### Shadows

```
soft:   0 2px 8px rgba(0, 0, 0, 0.08) - Cards
medium: 0 4px 16px rgba(0, 0, 0, 0.12) - Hover cards
strong: 0 8px 24px rgba(0, 0, 0, 0.16) - Modals
```

### Breakpoints

```
sm:  640px  - Large phones
md:  768px  - Tablets
lg:  1024px - Laptops
xl:  1280px - Desktops
2xl: 1536px - Large desktops
```

---

## Wireframes & Screens

### Landing Page (/)

**Header (Sticky)**
- Logo (left)
- Navigation: How It Works | Pricing | Templates | Login
- CTA: "Get QR Cards" (primary button)

**Hero Section**
- Left (60%):
  - Badge: "Trusted by 1000+ businesses" (with animation pulse)
  - H1: "Get More Reviews & Customers with Smart QR Cards"
  - Body: "Perfect for Amazon/Flipkart sellers and restaurant owners..."
  - CTA Row:
    - Primary: "Get QR Cards Now" (large)
    - Secondary: "See How It Works" (outline)
  - Trust indicators: ✅ High Quality | ✅ Fast Delivery | ✅ Change QR Anytime
- Right (40%):
  - QR card mockup (3D visual)
  - Decorative gradient blobs

**How It Works Section**
- 3 columns:
  - Icon: "1"
  - Title: "Choose & Design"
  - Body: "Pick use case, select template, customize..."
  (Repeat for steps 2, 3)

**Use Cases Grid**
- 4 cards (2x2 on mobile, 4x1 on desktop):
  - Icon (emoji): ⭐
  - Title: "Get More Reviews"
  - Body: "Direct link to Google, Amazon, or Zomato..."

**Pricing Section**
- 4 cards (horizontal scroll on mobile):
  - 100 cards: ₹999 (₹10/card)
  - 250 cards: ₹1,999 (₹8/card) ← "Popular" badge
  - 500 cards: ₹3,499 (₹7/card)
  - 1000 cards: ₹5,999 (₹6/card)
- Note: "All plans include: Premium print • Free shipping • Dashboard • Unlimited updates"

**CTA Section**
- Background: Gradient (primary-600 to primary-700)
- Title: "Ready to Grow Your Business?"
- Body: "Join 1000+ businesses using QRConnect..."
- CTAs: "Get Started Now" | "Talk to Us"

**Footer**
- 4 columns: Brand | Product | Use Cases | Support
- Social links
- Copyright

---

### Dashboard (/dashboard)

**Layout:**
- Top: Dashboard Navigation (sticky)
- Body: Content area

**Dashboard Navigation:**
- Logo + Brand name
- Tabs: Dashboard | Campaigns | Orders | Settings
- Right: "New Campaign" button | User menu

**Content:**

1. **Stats Grid (4 cards)**
   - Total Campaigns: 5
   - Total Scans: 12,453
   - Active Campaigns: 4
   - Scans Today: 87

2. **Campaign List**
   - Header: "Your Campaigns" | Filter dropdown
   - Each campaign card:
     - Icon (emoji based on type)
     - Name | Status badge | Type badge
     - Created date
     - Stats row: 👁️ 1,247 scans | 🔗 /abc123
     - Hover: Show "View Details" overlay

3. **Empty State** (if no campaigns):
   - Icon: 📱 (large)
   - Title: "No campaigns yet"
   - Body: "Create your first QR campaign to get started!"
   - CTA: "Create Campaign"

---

### Campaign Detail (/dashboard/campaigns/:id)

**Header:**
- Breadcrumb: Dashboard > Campaign Name
- Title + Badges (Active | Google Reviews)
- Actions: "Pause" | "Edit Destination"

**Layout: 2 Columns**

**Left (66%):**

1. **Quick Stats (3 cards)**
   - Total Scans: 1,247
   - This Week: 156 (+12%)
   - This Month: 543

2. **Scans Over Time**
   - Line chart
   - Time range selector: 7d | 30d | 90d

3. **Device & Location (2 columns)**
   - Left: Pie chart (Mobile 75%, Desktop 20%, Tablet 5%)
   - Right: Bar chart (Mumbai, Delhi, Bangalore...)

**Right (33% - Sticky):**

1. **QR Code Card**
   - Preview image
   - Download button

2. **Destination Card**
   - Short URL (with copy button)
   - Current destination
   - Last updated

3. **Quick Actions**
   - View Detailed Analytics
   - View Feedback (if applicable)
   - Export Data

---

## Component Library

### Button

**Variants:**
- `primary`: Solid primary color, white text
- `secondary`: Solid secondary color, white text
- `outline`: Border with primary color, primary text
- `ghost`: Transparent, gray text
- `danger`: Red background, white text

**Sizes:**
- `sm`: 32px height, 12px padding
- `md`: 40px height, 16px padding (default)
- `lg`: 48px height, 24px padding

**States:**
- Default
- Hover (darker shade)
- Active (even darker)
- Disabled (50% opacity, cursor not-allowed)
- Loading (spinner + "Loading..." text)

**Code Example:**
```tsx
<Button variant="primary" size="lg">
  Get Started
</Button>
```

---

### Input

**Props:**
- label: string (optional)
- placeholder: string
- error: string (optional)
- helperText: string (optional)
- required: boolean

**States:**
- Default
- Focus (primary ring)
- Error (red border + error message)
- Disabled (gray background)

**Code Example:**
```tsx
<Input
  label="Email"
  type="email"
  placeholder="you@business.com"
  required
  helperText="We'll never share your email"
/>
```

---

### Card

**Props:**
- padding: 'none' | 'sm' | 'md' | 'lg'
- hover: boolean (adds hover effect)

**Styles:**
- Background: White
- Border: 1px gray-200
- Border radius: 12px
- Shadow: soft

**Code Example:**
```tsx
<Card padding="lg" hover>
  <h3>Card Title</h3>
  <p>Card content...</p>
</Card>
```

---

### Modal

**Props:**
- isOpen: boolean
- onClose: () => void
- title: string
- size: 'sm' | 'md' | 'lg' | 'xl'

**Features:**
- Backdrop (click to close)
- ESC key to close
- Focus trap
- Scroll lock on body

**Code Example:**
```tsx
<Modal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  title="Edit Destination"
  size="md"
>
  <form>...</form>
</Modal>
```

---

### Badge

**Variants:**
- `default`: Gray
- `success`: Green
- `warning`: Amber
- `error`: Red
- `info`: Blue

**Code Example:**
```tsx
<Badge variant="success">Active</Badge>
```

---

## Copy Guidelines

### Tone & Voice

**Principles:**
- **Simple:** Use everyday words, avoid jargon
- **Reassuring:** Reduce anxiety, build trust
- **Conversational:** Like a helpful friend, not a robot
- **Action-oriented:** Verbs over nouns

**Examples:**

❌ **Bad:** "Initiate campaign creation workflow"
✅ **Good:** "Create your first campaign"

❌ **Bad:** "Insufficient credits for transaction processing"
✅ **Good:** "You don't have enough credits. Add more to continue."

❌ **Bad:** "QR code destination URL modification interface"
✅ **Good:** "Change where your QR code goes"

---

### Button Labels

**Primary Actions:**
- "Get QR Cards Now" (not "Submit Order")
- "Create Campaign" (not "Add New")
- "Save Changes" (not "Update")
- "View Analytics" (not "See Data")

**Secondary Actions:**
- "Cancel"
- "Go Back"
- "Learn More"
- "Skip for Now"

---

### Error Messages

**Format:** Problem + Solution

❌ **Bad:** "Invalid input"
✅ **Good:** "Please enter a valid phone number (e.g., +91 98765 43210)"

❌ **Bad:** "Error 404"
✅ **Good:** "We couldn't find that page. Try going back to the dashboard."

❌ **Bad:** "Authentication failed"
✅ **Good:** "Wrong email or password. Please try again or reset your password."

---

### Empty States

**Format:** Icon + Friendly Message + Clear Action

```
📱
No campaigns yet
Create your first QR campaign to get started!
[Create Campaign]
```

```
📊
No scans yet
Share your QR code with customers to start seeing data!
[Copy QR Link]
```

---

### Helper Text

- Keep under 1 line (60 characters)
- Provide examples when possible
- Explain "why" for non-obvious fields

Examples:
- "This will appear on your QR card"
- "We'll send order updates here"
- "Include country code (e.g., +91 for India)"

---

## Accessibility

### WCAG AA Compliance

**Color Contrast:**
- Body text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Keyboard Navigation:**
- All interactive elements focusable
- Focus indicators (2px primary ring)
- Tab order follows visual order
- Skip to content link

**Screen Readers:**
- Semantic HTML (<button>, <nav>, <main>)
- ARIA labels for icons
- ARIA live regions for dynamic content
- Alt text for all images

**Forms:**
- Labels always visible (not just placeholders)
- Error messages linked to inputs (aria-describedby)
- Required fields marked with * and aria-required

---

### Touch Targets

**Minimum sizes:**
- Buttons: 44x44px
- Form inputs: 48px height
- Links in body text: 16px font, 1.5 line-height
- Touch spacing: 8px between adjacent targets

---

## Mobile UX

### Mobile-First Design

**Approach:**
- Design for 375px width first (iPhone SE)
- Scale up for larger screens
- Never rely on hover states

**Layout:**
- Single column on mobile
- Cards stack vertically
- Bottom sheet for modals (instead of center)
- Sticky CTAs at bottom

**Typography:**
- Minimum font size: 16px (prevent zoom on iOS)
- Line height: 1.5 for readability
- Headings: 24px (mobile), 36px (desktop)

**Forms:**
- One field per row
- Large inputs (48px height)
- Appropriate input types:
  - `type="tel"` for phone (opens numeric keyboard)
  - `type="email"` for email (shows @ key)
  - `inputmode="numeric"` for PIN codes

**Navigation:**
- Hamburger menu for secondary links
- Tab bar for primary sections
- Back button in top-left (iOS pattern)

**Performance:**
- Lazy load images
- Optimize for 3G networks
- Minimize bundle size

---

## Implementation Notes

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React + Custom SVGs
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **State:** React Hooks + sessionStorage

### File Structure

```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout (fonts, global styles)
├── globals.css                 # Tailwind + custom CSS
├── login/page.tsx              # Auth
├── dashboard/
│   ├── layout.tsx              # Dashboard nav
│   ├── page.tsx                # Campaign list
│   ├── settings/page.tsx
│   └── campaigns/[id]/
│       ├── page.tsx            # Detail
│       ├── analytics/page.tsx
│       └── feedback/page.tsx
├── get-started/
│   ├── page.tsx                # Persona/use case
│   ├── templates/page.tsx
│   ├── editor/page.tsx
│   ├── checkout/page.tsx
│   └── success/page.tsx
└── r/[slug]/page.tsx           # QR redirect

components/
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── ...
└── layout/
    ├── Header.tsx
    ├── Footer.tsx
    └── DashboardNav.tsx

lib/
├── utils.ts                    # Helper functions
└── api.ts                      # API client

types/
└── index.ts                    # TypeScript types
```

### Responsive Breakpoints

Use Tailwind's mobile-first approach:

```tsx
// Mobile (default)
<div className="text-sm p-4">

// Tablet (md: 768px+)
<div className="text-sm md:text-base p-4 md:p-6">

// Desktop (lg: 1024px+)
<div className="text-sm md:text-base lg:text-lg p-4 md:p-6 lg:p-8">
```

---

## Future Enhancements

### Phase 2 (Q2 2025)

- [ ] Hindi language support (i18n)
- [ ] Bulk campaign creation (CSV upload)
- [ ] Advanced form builder (drag & drop)
- [ ] WhatsApp Business API integration
- [ ] SMS notifications

### Phase 3 (Q3 2025)

- [ ] Mobile app (React Native)
- [ ] QR code analytics API
- [ ] Integrations (Shopify, WooCommerce)
- [ ] A/B testing for QR destinations
- [ ] Team collaboration (multi-user accounts)

---

## Conclusion

This design system is built to serve **non-technical business owners in India** with a focus on **simplicity, trust, and mobile-first experience**.

Every decision—from the color palette to button labels—is made with our personas (Ravi and Anita) in mind.

**Key Takeaways:**
- ✅ Simple, jargon-free language
- ✅ Large touch targets (44px+)
- ✅ Clear visual hierarchy
- ✅ Trust indicators throughout
- ✅ Mobile-first, India-focused
- ✅ WCAG AA accessible

For questions or feedback, contact: **design@qrconnect.in**

---

**Document Version:** 1.0
**Last Updated:** November 18, 2025
**Author:** QRConnect Design Team
