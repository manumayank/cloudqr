# QRConnect Frontend – Complete QA Checklist

This checklist defines the **minimum quality bar** for the QRConnect frontend (Next.js + Tailwind) before releasing to staging/production.

---

## 1. Automated Tests

### 1.1 E2E (Playwright)

- [ ] Test: Unauthenticated user
  - [ ] Visiting `/dashboard` redirects to `/login`
  - [ ] Direct access to protected routes redirects to login
- [ ] Test: Register new user
  - [ ] Registration form submits successfully
  - [ ] User is redirected to `/dashboard`
  - [ ] Basic dashboard UI is visible (heading, nav, stats)
  - [ ] Empty state shows "No campaigns yet"
- [ ] Test: Login existing user
  - [ ] Valid credentials → `/dashboard`
  - [ ] Invalid credentials → error message shown, stays on `/login`
  - [ ] Error message is user-friendly (not technical)
- [ ] Test: Get Started wizard
  - [ ] Persona selection step works (card selected, next enabled)
  - [ ] Use-case selection works
  - [ ] Editor page pre-fills headline + subtext based on use-case
  - [ ] Live preview updates when typing in editor
  - [ ] Checkout page shows correct summary (quantity, price)
  - [ ] Form validation prevents submission with empty required fields
- [ ] Test: Campaign management
  - [ ] Can view campaign detail page
  - [ ] Can edit campaign destination
  - [ ] Can view analytics page with charts
  - [ ] Can view feedback submissions

### 1.2 Component / Unit Tests (Jest + React Testing Library) - Optional but Recommended

- [ ] Critical UI components have basic tests:
  - [ ] `Button` (primary/secondary, disabled state, loading state)
  - [ ] `Input` + validation styling (error state, label wiring)
  - [ ] `Modal` (open/close, Escape, backdrop click)
  - [ ] `Card` (hover state, padding variants)
- [ ] Dashboard page:
  - [ ] Renders loading state when data is fetching
  - [ ] Shows campaigns list when API returns data
  - [ ] Shows "empty state" message when there are no campaigns
  - [ ] Stats cards display correct numbers

---

## 2. Functional UX Checks (Staging)

### 2.1 Auth

- [ ] `/login`:
  - [ ] Contains clearly labelled fields for **Email** and **Password**
  - [ ] Toggle between Login/Signup modes works
  - [ ] Submitting empty form shows validation messages (no silent fail)
  - [ ] API error (wrong password, unknown user) is shown in a friendly inline error
  - [ ] Success redirects to dashboard
- [ ] Remember-me / token refresh:
  - [ ] With valid refresh token in storage, refreshing the page on `/dashboard` keeps the user logged in
  - [ ] On expired/invalid refresh token, user is redirected to `/login` with a clear message
- [ ] Logout:
  - [ ] Logout button clears all auth state
  - [ ] Redirects to home or login page
  - [ ] Cannot access protected routes after logout

### 2.2 Dashboard

- [ ] Campaign cards:
  - [ ] Show correct campaign name, type label, created date, and scan count
  - [ ] Status badge (Active / Paused) displays correctly
  - [ ] Icons match campaign types (Reviews ⭐, WhatsApp 💬, etc.)
  - [ ] Click navigates to campaign detail page
- [ ] Stats cards:
  - [ ] Display correct totals (campaigns, scans, active, today)
  - [ ] Numbers format correctly (Indian number system with commas)
- [ ] Navigation:
  - [ ] Top nav highlights the active section (Dashboard, Settings, etc.)
  - [ ] Mobile nav works (hamburger → menu; menu closes on route change)
  - [ ] "New Campaign" button navigates to Get Started
  - [ ] Logout works from all pages
- [ ] Empty state:
  - [ ] Shows friendly message when no campaigns exist
  - [ ] "Create Campaign" button is prominent
  - [ ] Doesn't show broken/confusing UI

### 2.3 Get Started Wizard

- [ ] Persona selection:
  - [ ] Each persona card is clickable and clearly indicates selection
  - [ ] Cannot proceed without selecting a persona
  - [ ] Selected state is visually obvious
- [ ] Use case selection:
  - [ ] Only allowed to proceed after selecting a use case
  - [ ] Use case cards are well-explained with icons
- [ ] Template gallery:
  - [ ] Templates display with previews
  - [ ] Selection state is clear
  - [ ] Continue button enabled after selection
- [ ] Editor:
  - [ ] Headline and description fields are editable and auto-populate based on the use case
  - [ ] Live preview updates in real-time
  - [ ] Logo upload:
    - [ ] Accepts JPG/PNG
    - [ ] Shows preview immediately
    - [ ] Gracefully handles non-image files with an error
    - [ ] File size validation (max 2MB)
  - [ ] Brand color picker works
  - [ ] Preview accurately reflects card design
- [ ] Checkout:
  - [ ] Quantity selection updates price correctly
  - [ ] All pricing displays in ₹ INR
  - [ ] Price per card calculates correctly
  - [ ] Address form validates all required fields
  - [ ] Phone number accepts Indian format (+91)
  - [ ] Summary sidebar shows all selections
  - [ ] Cannot submit without completing form
- [ ] Success page:
  - [ ] Shows clear confirmation and next steps
  - [ ] "Go to Dashboard" button works
  - [ ] Order details visible

### 2.4 Campaign Detail Page

- [ ] Overview:
  - [ ] Campaign name, type, and status displayed
  - [ ] QR code preview visible
  - [ ] Short URL displayed with copy button
  - [ ] Stats cards show correct numbers
- [ ] Edit destination modal:
  - [ ] Opens when clicking "Edit Destination"
  - [ ] Shows current destination
  - [ ] Validates new URL format
  - [ ] Saves successfully with confirmation
  - [ ] Updates display after save
- [ ] Quick actions:
  - [ ] "View Analytics" navigates correctly
  - [ ] "View Feedback" works (if applicable)
  - [ ] Toggle active/pause works
  - [ ] QR code download works

### 2.5 Analytics

- [ ] Charts render correctly with data
- [ ] Filters (date range) work and update charts/tables
- [ ] Scans over time line chart displays
- [ ] Device breakdown pie chart displays
- [ ] Location bar chart displays
- [ ] Export functionality works
- [ ] Empty state shown when no data
- [ ] Charts are responsive on mobile

### 2.6 Feedback Submissions

- [ ] Submissions list displays
- [ ] Search/filter works
- [ ] Star ratings show correctly
- [ ] Contact info clickable (tel/mailto)
- [ ] CSV export works
- [ ] Empty state for no submissions
- [ ] Pagination works (if implemented)

### 2.7 Settings

- [ ] Business profile fields editable
- [ ] Logo upload works
- [ ] Brand color picker works
- [ ] Address fields validate
- [ ] Notification toggles work
- [ ] Save button updates successfully
- [ ] Cancel button discards changes

---

## 3. Visual & Responsive Checks

### 3.1 Layout & Branding

- [ ] Branding:
  - [ ] Logo, brand colors, and typography are consistent across:
    - [ ] Landing page
    - [ ] Login
    - [ ] Dashboard
    - [ ] Get Started flow
    - [ ] All sub-pages
- [ ] Design:
  - [ ] No overlapping or cut-off text at standard desktop width (~1280px)
  - [ ] Buttons and cards use consistent border radius, padding, and spacing
  - [ ] Color palette matches design system (primary #6366f1, secondary #f59e0b)
  - [ ] Typography uses correct fonts (Poppins for headings, Inter for body)

### 3.2 Responsive Breakpoints

Test at **mobile (~375px)**, **tablet (~768px)**, and **desktop (>=1280px)**:

- [ ] Nav:
  - [ ] Mobile nav collapses into a hamburger menu
  - [ ] Dashboard sidebar collapses/overlays correctly on small screens
  - [ ] All nav items accessible on mobile
- [ ] Forms:
  - [ ] Inputs and buttons remain comfortably tappable on mobile (minimum 44px height)
  - [ ] Labels remain visible (not hidden by placeholders)
  - [ ] Error messages don't break layout
- [ ] Tables / charts:
  - [ ] No horizontal scroll unless absolutely necessary
  - [ ] If horizontal scroll exists, it's obvious and usable
  - [ ] Cards or stacked layout used where tables are too wide for mobile
- [ ] Images:
  - [ ] Logo and QR code scale appropriately
  - [ ] No pixelation or distortion
- [ ] Cards:
  - [ ] Stack vertically on mobile
  - [ ] Maintain readability and spacing

### 3.3 Print Styles (Critical for QR Business)

- [ ] QR code page prints correctly
- [ ] Print dialog shows clean QR without nav/footer
- [ ] High resolution for professional printing
- [ ] Print preview works (`window.print()`)

---

## 4. Accessibility & Usability

### 4.1 Keyboard Navigation

- [ ] All interactive elements (buttons, links, inputs) are reachable with **Tab** key
- [ ] Focus outline is visible and not removed
- [ ] Tab order follows visual/logical order
- [ ] Modals trap focus inside while open
- [ ] Escape key closes modals
- [ ] Enter key submits forms
- [ ] Arrow keys work in dropdowns

### 4.2 Screen Readers

- [ ] Semantic HTML (<button>, <nav>, <main>, <form>)
- [ ] ARIA labels for icons-only buttons
- [ ] ARIA live regions for dynamic content (toasts, loading states)
- [ ] Alt text for all images
- [ ] Headings follow logical hierarchy (H1 → H2 → H3)
- [ ] Form inputs properly labeled

### 4.3 Forms

- [ ] Every input has a visible label connected via `htmlFor`/`id` or wrapped properly
- [ ] Labels always visible (not just placeholders)
- [ ] Error messages:
  - [ ] Use clear text (e.g., "Email is required")
  - [ ] Associated with input via `aria-describedby` and `aria-invalid`
  - [ ] Color is not the only indicator (use icons too)
- [ ] Required fields marked with * and `aria-required`
- [ ] Success confirmations accessible

### 4.4 Color Contrast

- [ ] Text and icons against backgrounds meet **WCAG AA** (4.5:1 for body text)
- [ ] Use a contrast checker (WebAIM, Chrome DevTools)
- [ ] Primary buttons have sufficient contrast
- [ ] Error/success states don't rely solely on color

### 4.5 Toasts & Messages

- [ ] Success and error feedback is visible long enough (3-5 seconds)
- [ ] Toasts don't cover critical controls
- [ ] Can be dismissed manually
- [ ] Announce to screen readers

---

## 5. Performance

### 5.1 Lighthouse Scores (Target: 90+)

Run Lighthouse audit in Chrome DevTools:

- [ ] Performance: 90+
- [ ] Accessibility: 95+
- [ ] Best Practices: 95+
- [ ] SEO: 95+

### 5.2 Core Web Vitals

- [ ] **LCP** (Largest Contentful Paint): < 2.5s
- [ ] **FID** (First Input Delay): < 100ms
- [ ] **CLS** (Cumulative Layout Shift): < 0.1

### 5.3 Bundle Size

- [ ] Total JS bundle < 200KB gzipped
- [ ] Check with `npm run build` and analyze output
- [ ] Use dynamic imports for routes (Next.js automatic)
- [ ] Images optimized (WebP, proper sizing with Next.js Image)

### 5.4 Loading States

- [ ] Skeleton screens for slow-loading content
- [ ] Spinner for async operations
- [ ] No layout shift when content loads
- [ ] Graceful degradation on slow connections
- [ ] Loading text is user-friendly ("Loading campaigns..." not "Loading...")

### 5.5 Network Performance

- [ ] Test on slow 3G network
- [ ] Optimistic UI updates where appropriate
- [ ] Retry logic for failed requests
- [ ] Timeout handling

---

## 6. Security

### 6.1 XSS Prevention

- [ ] All user input is sanitized before rendering
- [ ] No `dangerouslySetInnerHTML` without DOMPurify
- [ ] CSP headers configured (check with security headers tool)

### 6.2 Authentication

- [ ] Tokens stored in httpOnly cookies (preferred) OR localStorage with precautions
- [ ] No sensitive data in URL params
- [ ] Session timeout works correctly (15 min for access token)
- [ ] Logout clears all auth state (tokens, localStorage, cookies)
- [ ] Refresh token rotation implemented

### 6.3 API Security

- [ ] No API keys in client code
- [ ] CORS configured correctly
- [ ] Rate limiting on sensitive endpoints (backend)
- [ ] HTTPS enforced in production

### 6.4 Dependencies

- [ ] Run `npm audit` and fix **high/critical** vulnerabilities
- [ ] Keep dependencies reasonably updated
- [ ] No known vulnerable packages

---

## 7. Integration with Backend

### 7.1 API Configuration

- [ ] `NEXT_PUBLIC_API_URL` correctly set for environment (dev, staging, prod)
- [ ] API calls use correct base URL
- [ ] CORS allows frontend domain

### 7.2 Auth Integration

- [ ] Axios interceptor attaches `Authorization: Bearer <token>` on protected calls
- [ ] On 401 + failed refresh, tokens are cleared and user redirected to `/login`
- [ ] Token refresh works silently in background

### 7.3 Error Handling

- [ ] For 4xx/5xx responses, user sees a clear message instead of being stuck on spinner
- [ ] Network errors show "Something went wrong, please try again" with retry option
- [ ] Timeout errors handled gracefully
- [ ] API errors mapped to user-friendly messages

### 7.4 Data Validation

- [ ] Analytics data displayed matches backend endpoints (spot-check totals, time ranges)
- [ ] Dates/times formatted correctly (Indian timezone)
- [ ] Currency always shows ₹ INR

---

## 8. SEO & Meta Tags

- [ ] Every page has unique `<title>` (50-60 characters)
- [ ] Meta descriptions present and relevant (150-160 characters)
- [ ] Open Graph tags for social sharing:
  - [ ] og:title, og:description, og:image
  - [ ] Twitter card tags
- [ ] Canonical URLs set correctly
- [ ] Sitemap.xml generated (`/sitemap.xml`)
- [ ] Robots.txt configured (`/robots.txt`)
- [ ] Structured data (JSON-LD) for business info
- [ ] Alt text on all images

---

## 9. Browser Testing

Test on major browsers:

- [ ] **Chrome** (latest) - Primary browser
- [ ] **Safari** (latest) - iOS users, often has issues
- [ ] **Firefox** (latest) - Good standards compliance
- [ ] **Edge** (latest) - Windows users
- [ ] **Mobile Safari** (iOS 15+) - Critical for mobile
- [ ] **Chrome Mobile** (Android) - Critical for mobile

Known issues to watch for:

- [ ] Safari: Flexbox bugs, date input format
- [ ] iOS Safari: Input zoom (16px min font size)
- [ ] Mobile: Touch target sizes (44px min)

---

## 10. Analytics & Tracking

- [ ] Google Analytics 4 events fire correctly:
  - [ ] Page views
  - [ ] Button clicks (Get Started, Create Campaign, Place Order)
  - [ ] Form submissions
  - [ ] Errors
- [ ] Conversion tracking works:
  - [ ] Registration completed
  - [ ] Order placed
  - [ ] QR code created
- [ ] Privacy:
  - [ ] Cookie consent banner (if EU users)
  - [ ] Analytics opt-out works
  - [ ] Privacy policy linked

---

## 11. Content & Copy

### 11.1 Copy Quality

- [ ] No Lorem Ipsum or placeholder text
- [ ] Spelling and grammar checked
- [ ] Tone is friendly, simple, reassuring (see UX_DESIGN_DOCUMENT.md)
- [ ] No jargon (e.g., "API", "OAuth", "webhook")
- [ ] Indian English conventions (₹, lakhs, crores)

### 11.2 Error Messages

- [ ] Friendly and actionable (Problem + Solution format)
- [ ] Examples provided where helpful
- [ ] No technical error codes shown to users

### 11.3 Empty States

- [ ] Clear icon/illustration
- [ ] Friendly message explaining why empty
- [ ] Clear call-to-action button

---

## 12. CI/CD Pipeline

- [ ] Playwright tests run on every PR
- [ ] Lint + type-check pass before merge (`npm run lint`, `npm run type-check`)
- [ ] Build succeeds for staging/production (`npm run build`)
- [ ] Auto-deploy to staging on merge to `main`
- [ ] Manual approval required for production deploy
- [ ] Rollback plan documented

---

## 13. Monitoring & Observability

### 13.1 Error Tracking

- [ ] Sentry or similar tool configured
- [ ] Errors logged with context (user ID, page, action)
- [ ] Sourcemaps uploaded for stack traces
- [ ] Alert for critical errors (5xx, auth failures)

### 13.2 Uptime Monitoring

- [ ] Pingdom, UptimeRobot, or similar configured
- [ ] Monitors key pages (`/`, `/login`, `/dashboard`)
- [ ] Alert on downtime (email/SMS/Slack)

### 13.3 Performance Monitoring

- [ ] Vercel Analytics or Speedcurve configured
- [ ] Track Core Web Vitals over time
- [ ] Alert on performance regression

### 13.4 User Session Replay

- [ ] LogRocket, FullStory, or Hotjar configured (optional but recommended)
- [ ] Helps debug user-reported issues
- [ ] Privacy settings configured (mask sensitive data)

---

## 14. Documentation

- [ ] README has clear setup instructions
- [ ] Environment variables documented (`.env.example`)
- [ ] API integration documented
- [ ] Troubleshooting guide for common issues
- [ ] Component library documented (or Storybook)
- [ ] Deployment process documented

---

## 15. Release Checklist

Before promoting a build to **production**:

### 15.1 Pre-Release

- [ ] Run `npm run lint` and fix any errors
- [ ] Run `npm run type-check` and fix any TypeScript errors
- [ ] Run all Playwright tests (`npm run test:e2e`) and confirm they pass
- [ ] Run Lighthouse audit and verify scores (90+ across the board)
- [ ] Check `npm audit` for critical vulnerabilities
- [ ] Verify all environment variables set correctly for production
- [ ] Check bundle size (`npm run build` → `.next/static`)

### 15.2 Smoke Test (Staging)

Manually perform a short smoke test on staging:

- [ ] Login or register
- [ ] Create or view a campaign
- [ ] Navigate to analytics and confirm charts load
- [ ] Walk through Get Started → Checkout (don't submit)
- [ ] Edit campaign destination
- [ ] View feedback submissions
- [ ] Check settings page
- [ ] Test on mobile device (real device, not just emulator)
- [ ] Log out and ensure `/dashboard` is no longer accessible

### 15.3 Deployment

- [ ] Deploy to production
- [ ] Verify deployment success (check production URL)
- [ ] Run quick smoke test on production
- [ ] Monitor error tracking tool for 30 minutes post-deploy
- [ ] Verify analytics tracking works
- [ ] Check sitemap and robots.txt accessible

### 15.4 Post-Release

- [ ] Announce in team Slack/Discord
- [ ] Update changelog
- [ ] Tag release in Git
- [ ] Monitor user feedback/support tickets
- [ ] Watch for performance regressions in monitoring tools

---

## 16. Progressive Enhancement & Fallbacks

- [ ] Core functionality works without JavaScript (where possible)
- [ ] Graceful degradation for:
  - [ ] Image loading failures (show placeholder)
  - [ ] Font loading failures (fallback to system fonts)
  - [ ] Chart rendering failures (show table)
- [ ] Offline experience (service worker) - Future enhancement

---

## 17. Legal & Compliance

- [ ] Privacy policy accessible and up-to-date
- [ ] Terms of service accessible
- [ ] Cookie consent (if required by law)
- [ ] GDPR compliance (if serving EU users):
  - [ ] Right to erasure ("Delete Account")
  - [ ] Data export functionality
- [ ] Disclaimer for test/demo accounts

---

## 18. i18n Readiness (Phase 2 - Future)

If planning internationalization:

- [ ] All hardcoded strings extracted to constants or i18n files
- [ ] Date/time formatting uses locale-aware functions (`Intl.DateTimeFormat`)
- [ ] Currency formatting centralized (₹ INR for now)
- [ ] UI accommodates longer text (Hindi can be 30% longer)
- [ ] RTL support planned (Arabic, Hebrew - future)

---

## Summary

✅ **This checklist ensures**:
- Automated test coverage (E2E with Playwright)
- Manual QA for UX and edge cases
- Performance optimization (Lighthouse, Core Web Vitals)
- Security best practices (XSS, CSRF, auth)
- Accessibility compliance (WCAG AA)
- Production readiness (monitoring, CI/CD)

🚀 **Before every production deploy**:
1. Run all automated tests
2. Complete smoke test checklist
3. Verify performance metrics
4. Monitor post-deploy

**Keeping this checklist up-to-date and wiring tests into CI will give you a rock-solid frontend as the project scales.**

---

**Document Version:** 1.0
**Last Updated:** November 18, 2025
**Owner:** QRConnect Engineering Team
