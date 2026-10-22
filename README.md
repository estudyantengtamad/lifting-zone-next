# Lifting Zone Obrero — High Performance Fitness & Sports Nutrition

A modern, offline-resilient e-commerce platform and fitness showroom portal for **Lifting Zone Obrero**, located on Salvador Calo St., Obrero, Butuan City, Philippines.

---

## Features

1. **Dark, Light & System Mode (Zero Flash)**
   - High-contrast, editorial typography inspired by Casa di Solare aesthetics.
   - Built with CSS variables (`--color-bg`, `--color-card`, `--color-text`, `--color-brand-500`, etc.).
   - Default is dark mode; cycles smoothly between **Dark**, **Light**, and **System**.
   - Inline execution script in `<head>` applies saved preference before initial paint, eliminating theme flashes.
   - Light mode colors strictly comply with **WCAG AA** contrast requirements (> 5:1 contrast on text).
   - Dynamic canvas components ([DotField](frontend/components/DotField.tsx) and [ScratchDiscount](frontend/components/ScratchDiscount.tsx)) dynamically read computed CSS variables on theme change.

2. **Google OAuth & Role-Based Access Control (RBAC)**
   - Powered by Supabase Auth with Google OAuth.
   - Customers receive the `customer` role by default upon signing in.
   - System administrators are strictly controlled via the `public.admin_emails` allowlist table; users cannot escalate their own role.
   - Server-side enforcement with `requireUser()` and `requireAdmin()` helpers, plus PostgreSQL Row Level Security (RLS) policies.
   - `/admin` returns a strict **404 Not Found** response to non-admins.
   - Inventory Manager (`#inventory-admin`) and its header navigation link are rendered exclusively for administrators.
   - Checkout requires login to ensure authentic Gmail receipt delivery.
   - Fully offline-resilient: if Supabase credentials are not provided, storefront browsing and cart operations remain functional without crashing.

3. **PayMongo QR Ph Payments**
   - Direct integration with PayMongo's QR Ph gateway (interoperable with GCash, Maya, ShopeePay, and major Philippine bank apps).
   - QR generation uses the order total in the database as the source of truth (never trusting client-supplied amounts).
   - Reuses active, unexpired QR codes to prevent multiple payable QRs for a single order.
   - Secure webhook receiver at `/api/webhooks/paymongo` verifying the `Paymongo-Signature` header via constant-time HMAC-SHA256 comparison.
   - Automatic polling and direct PayMongo reconciliation at `/api/payments/status`.
   - Customer checkout UI displays the QR code on a high-contrast white tile with padding in both themes, countdown timer, auto-detection on payment, and a "Save QR Image" download link.
   - Unpaid orders can be paid later directly from the customer's `/account` page.

4. **Automated Gmail Receipts (`gmail.send`)**
   - Transmits verifiable, branded transaction receipts from the store's Gmail account directly to the customer's login Gmail.
   - Utilizes Google's REST API (`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`) with refresh token renewal—no heavy external SDK.
   - Features dual-format RFC 2822 emails: rich responsive HTML receipt and plain-text fallback.
   - Strict protection against MIME header injection by stripping CR/LF characters (`\r`, `\n`) and escaping all HTML content.
   - Send-once idempotency: records `receipt_sent_at` and `receipt_error` in the database.
   - Rate-limited manual "Resend Receipt" action available to customers and administrators.

---

## Directory Structure

```
lifting-zone-next/
├── frontend/                     # Next.js 14 App Router
│   ├── app/
│   │   ├── account/              # Customer order history & receipt view
│   │   ├── admin/                # Admin operations dashboard (404 for non-admins)
│   │   ├── api/
│   │   │   ├── checkout/         # Server-recomputed checkout & order creation
│   │   │   ├── payments/         # QR generation & status polling
│   │   │   ├── webhooks/         # PayMongo webhook signature handler
│   │   │   ├── receipts/         # Gmail receipt resend handler
│   │   │   └── products/         # Public GET, Admin-only POST/PUT/DELETE
│   │   ├── auth/callback/        # OAuth code exchange with open-redirect guard
│   │   ├── globals.css           # CSS theme tokens & utilities
│   │   ├── layout.tsx            # Font setup & no-flash theme script
│   │   └── page.tsx              # Showroom storefront
│   ├── components/               # React UI components (ThemeToggle, AuthMenu, etc.)
│   ├── lib/
│   │   ├── authStore.ts          # Zustand auth & session store
│   │   ├── email/gmail.ts        # Gmail API REST receipt service
│   │   ├── payments/paymongo.ts  # PayMongo QR Ph service & signature verifier
│   │   ├── store.ts              # Zustand cart & inventory store
│   │   └── supabase/             # Browser, server, and service-role clients
│   └── __tests__/                # Unit tests for signatures, roles, idempotency
├── backend/                      # Standalone Node microservice
└── database/
    ├── migrations/               # 002_auth_roles_qr_receipts.sql
    ├── schema.sql                # Base DDL
    ├── seed.sql                  # Seed data
    └── types.ts                  # TypeScript Supabase definitions
```

---

## Environment Variables

Copy `.env.example` to `frontend/.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-for-admin-operations

# PayMongo
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_WEBHOOK_SECRET=whsk_...

# Gmail API
GMAIL_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
GMAIL_SENDER_ADDRESS=orders@liftingzone.ph
GMAIL_SENDER_NAME=Lifting Zone Obrero
```

---

## Setup & Running Locally

1. **Install Dependencies**:
   ```powershell
   cd frontend
   npm install
   ```

2. **Run Unit Tests**:
   ```powershell
   npm run test
   ```

3. **Start Development Server**:
   ```powershell
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
