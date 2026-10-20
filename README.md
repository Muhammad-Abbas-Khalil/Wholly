# 🛒 Wholly — Community Group Buying for Household Staples (Pakistan)

> **Buy Together, Pay Wholesale.** A full-stack community commerce platform built for high-inflation emerging markets. Neighbors pool orders for essential pantry staples (Atta, Basmati Rice, Dalda Cooking Oil, Tapal Tea, White Sugar); as collective volume crosses supplier wholesale thresholds, the price drops for everyone.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma 6](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?logo=postgresql)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-23_Tests_Passing-6E9F18?logo=vitest)](https://vitest.dev/)

---

## ⚡ Problem & Core Insight

In Pakistan, rapid food inflation has strained middle-class household budgets. Buying staple groceries directly from wholesale mills and factory distributors is **15% to 25% cheaper than neighborhood retail**, but minimum order quantities (MOQs) are prohibitive—distributors require orders of 50+ liters of oil or 100+ kg of flour at once.

**Wholly solves this through decentralized consumer pooling:**
1. A neighborhood deal opens with factory wholesale tiers and a deadline.
2. Multiple households reserve any quantity they need (no restrictive caps).
3. As total reservations cross wholesale thresholds, factory discounts unlock for all participants retroactively.
4. An advance deposit secures inventory; remaining balance is settled in cash upon in-person pickup at a designated local hub.

---

## 🚀 Key Features & Highlights

### 1. 🧮 Dynamic Volume Pricing Engine
- **Threshold-Locked Wholesale Model:** Deals start locked until a minimum volume threshold is achieved (e.g., 10 or 20 units). Buyers see live target savings against market retail.
- **Retroactive Tier Savings:** Every participant pays the rate of the highest unlocked tier reached at pool close, regardless of when they entered.
- **Strict Concurrency Safety:** Prisma database transactions enforce inventory caps and prevent race conditions when simultaneous orders hit tier boundaries.

### 2. 💳 FinTech Advance Deposit & Simulated Mobile Push Approval
- **30% Advance Deposit Escrow:** Eliminates pickup no-shows while committing inventory with wholesale suppliers. The remaining 70% is collected in cash after physical goods inspection.
- **100% Refund Guarantee:** If a deal does not meet its minimum activation threshold before the deadline, 100% of the advance deposit is automatically refunded with zero deductions.
- **SBP-Compliant Architecture (No MPIN on Web):** State Bank of Pakistan regulations strictly prohibit merchant websites from capturing secret MPINs.
- **Simulated Mobile Screen Approval Modal (Portfolio Showcase):** When checking out via **Easypaisa**, reviewers experience an interactive smartphone push notification mockup that simulates handset USSD/app authorization in 1 click.
- **Debit / Credit Card Rails:** Instant tokenized checkout with 3D-Secure verification simulation.

### 3. 🎫 Digital Pickup Pass & Hub Verification Counter
- **Client-Generated QR Code:** Dynamic QR code embedded with verification payload (buyer details, units, order ID, cash balance due).
- **Human-Readable Pickup Code (`WH-XXXXXX`):** Unique 6-character code for counter operators.
- **1-Click WhatsApp Forwarding:** Easily forward formatted pickup credentials to drivers, family members, or neighbors.
- **Admin Hub Redemption Scanner:** Hub staff can verify passes via camera QR scan, direct URL query (`/admin?verify=WH-...`), or instant search by phone, name, or code.

### 4. 📦 Flexible Ordering & Downward Lock Protection
- **No Restrictive Unit Limits:** Households order the exact amount they need (1, 2, 5, 20+ units).
- **Downward Order Lock:** To protect unlocked group discounts from collapsing, orders cannot be decreased once a wholesale tier is active. However, buyers can freely add extra units with an incremental 30% deposit.

### 5. 👥 Viral Community Growth & Live Sync
- **1-Click Viral WhatsApp Sharing:** Automatically generates pre-formatted WhatsApp invites highlighting units claimed, remaining units needed to unlock the next discount, and direct pool links.
- **Live Deal Sync:** 10-second polling keeps buyer progress bars and remaining time counters in sync across all open browser sessions.

---

## 🏛️ System Architecture

```
                   ┌────────────────────────────────────────────────────────┐
                   │         Next.js 16 (App Router) + React 19 Client      │
                   │           Tailwind CSS v4 + Lucide Icons + QR          │
                   └───────────────────────────┬────────────────────────────┘
                                               │
                                 Server Actions / REST APIs
                                               │
                   ┌───────────────────────────▼────────────────────────────┐
                   │          Next.js Route Handlers (Edge / Node)          │
                   │      Auth.js v5 (Credentials) | Pricing Engine        │
                   └───────────────────────────┬────────────────────────────┘
                                               │
                                 Interactive Transactions
                                               │
                   ┌───────────────────────────▼────────────────────────────┐
                   │                     Prisma ORM 6                       │
                   │      (Race-condition safe transactional mutations)     │
                   └───────────────────────────┬────────────────────────────┘
                                               │
                                     Pooled TCP (Port 6543)
                                               │
                   ┌───────────────────────────▼────────────────────────────┐
                   │            PostgreSQL Database (Supabase)              │
                   │    Deals, Products, Tier Milestones, Participations    │
                   └────────────────────────────────────────────────────────┘
```

---

## 📐 Data Model Overview

| Entity | Key Responsibilities |
| :--- | :--- |
| **`User`** | Phone number identifier, bcrypt password hash, role (`BUYER` / `ADMIN`), pickup pass associations. |
| **`Product`** | SKU catalog (Atta, Rice, Oil, Tea, Sugar, Milk), unit type (`5L Tin`, `10kg Bag`), image assets, baseline retail price. |
| **`Deal`** | Deal lifecycle state (`OPEN`, `UNLOCKED`, `FULFILLED`, `FAILED`), deadline timestamp, pickup hub location & schedule, minimum threshold volume. |
| **`DealTier`** | Progressive discount thresholds (`minUnits`, `pricePerUnit`, `supplierCostPerUnit`). |
| **`Participation`** | Buyer order quantity, deposit paid (30%), payment method (`EASYPAISA`, `CARD`), status (`RESERVED`, `COLLECTED`, `CANCELLED`). |

---

## 🧪 Pricing Engine & Mathematical Model

Every participant pays the unit price of the **highest tier reached by pool close**:

$$\text{Active Units} = \sum_{p \in \text{Participations},\, p.\text{status} \neq \text{CANCELLED}} p.\text{quantity}$$

$$\text{Active Tier} = \max \left(\{ t \in \text{Tiers} \mid t.\text{minUnits} \le \text{Active Units} \}\right)$$

$$\text{30\% Advance Deposit} = \text{round}(\text{Active Unit Price} \times \text{Quantity} \times 0.30)$$

$$\text{Remaining Cash on Pickup} = (\text{Active Unit Price} \times \text{Quantity}) - \text{Deposit Paid}$$

### Real Example (Dalda Canola Oil 5L Tin):
- **Retail Baseline:** PKR 3,000 / unit
- **Wholesale Threshold Tier 1 (10 units):** PKR 2,850 (Save 5%)
- **Wholesale Volume Tier 2 (20 units):** PKR 2,700 (Save 10%)
- **Wholesale Super Tier 3 (50 units):** PKR 2,550 (Save 15%)

If 7 neighbors join with 3 tins each (= 21 tins), **Tier 2 unlocks** and everyone pays **PKR 2,700** upon collection.

---

## ⚡ Quick Demo Walkthrough (For Recruiters & Reviewers)

Experience the complete flow in under 2 minutes without manually typing credentials:

### 1. Log In via 1-Click Demo Profiles
Navigate to `/login` and click either pre-filled test profile:
- **Buyer Account:** `03211112233` (Password: `password123`)
- **Admin Account:** `03001234567` (Password: `password123`)

### 2. Join a Live Pool & Test Advance Payment
1. Open any deal (e.g., *Dalda Cooking Oil* or *Sunridge Chakki Atta*).
2. Choose your quantity using the stepper or quick chips.
3. Select **Easypaisa**:
   - Click the 1-click **Demo Fill** chip (`0345-9876543`).
   - Click **"Pay 30% Deposit via Easypaisa Mobile Push"**.
   - Review the realistic smartphone lock-screen modal and click **"Simulate Instant Phone Approval"**.
4. Alternatively, select **Debit / Credit Card**:
   - Click **Demo Fill** (`Visa 4242`) and submit directly.

### 3. Inspect Digital Pickup Pass
- The confirmation celebration modal reveals your hybrid pickup pass.
- Click **"View Full QR Pass"** to view the live QR code, copy your 6-character code, or test WhatsApp sharing.

### 4. Admin Redemption
1. Log in as **Admin** and navigate to `/admin`.
2. Enter the pickup code into the **Pickup Verification Counter** or scan the QR.
3. Verify remaining cash due, click **"Confirm Collection & Cash Received"**, and watch the deal roster update in real time.

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: v18.18+ or v20+ (tested on Node v24)
- **Package Manager**: `pnpm` (recommended) or `npm`
- **Database**: PostgreSQL database (e.g. Supabase, Neon, or local Postgres)

### 1. Clone & Install
```bash
git clone https://github.com/<your-username>/wholly.git
cd wholly
pnpm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:

```env
# Supabase Transaction Pooler (Port 6543)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (Port 5432 - for Prisma CLI migrations)
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Cron Secret (for scheduled deal evaluation endpoint)
CRON_SECRET="your-secure-cron-secret"
```

### 3. Database Migration & Seed
```bash
# Push Prisma schema to your PostgreSQL database
pnpm prisma db push

# Seed products, threshold-locked deals, tiers, and demo users
pnpm prisma db seed
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Automated Testing

Domain pricing calculations, boundary transitions, platform margins, and currency rounding are validated via **Vitest**:

```bash
# Run unit test suite
pnpm test

# Run TypeScript compiler checks
pnpm tsc --noEmit

# Run ESLint
pnpm lint

# Production Next.js build
pnpm build
```

**Test Coverage Highlights (`tests/pricing.test.ts` — 23 unit tests):**
- Active unit summation excluding cancelled reservations.
- Tier boundary transitions at exact volume cutoffs.
- Target savings against retail baseline for locked threshold pools.
- Advance deposit (30%) and cash balance due (70%) calculations.
- QR pickup code generator formatting (`WH-XXXXXX`).

---

## 💼 Portfolio & Technical Talking Points

If you are discussing this project in an engineering interview or on LinkedIn:

1. **Transactional Integrity Over Optimistic Updates:** Groceries in emerging markets operate on razor-thin margins. Group deals cannot tolerate overselling past supplier caps or desynchronized tier pricing. All join/leave actions execute inside Prisma database transactions with atomic increments.
2. **FinTech Domain Realism (SBP Compliance):** Rather than copying Western credit card flows or unrealistically asking for secret PINs on-screen, Wholly reflects actual Pakistani payment rails (push prompt USSD/app authorization) backed by an interactive simulation modal.
3. **Hybrid Paperless Redemption:** Recognizes that retail hub workers operate in noisy, low-bandwidth environments. The counter scanner supports camera QR scanning, 1-click query URLs, and manual 6-character search fallbacks.
4. **Zero-Cap Consumer Freedom with Downward Lock:** Instead of artificial 1-to-3 unit limits, households order as much as they need, while downward cancellations are locked once the community threshold is reached to protect group savings from collapsing.

---

## 📄 License

Distributed under the **MIT License**. Feel free to use this codebase as a foundation for community commerce and group-buying applications.
