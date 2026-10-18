# 🛒 Wholly (Pakistan) — Group Buying for Household Staples

> **Buy together, pay wholesale.** A full-stack community group-buying platform designed for high-inflation markets like Pakistan. Neighbors pool orders for essential staples (Atta, Rice, Cooking Oil, Tea, Sugar); as total units cross wholesale volume thresholds, the price automatically drops for every participant.

---

## ⚡ The Problem & The Solution
Buying staple groceries directly in bulk from wholesale distributors is significantly cheaper (10% to 25% lower than retail), but an average family rarely needs 50 liters of oil or 100 kg of flour at once.

**Wholly** solves this by letting 5 to 50 households pool orders together. Once aggregate units cross wholesale tiers before the deal deadline, the supplier ships in bulk to a designated local pickup point, and buyers pay the final discounted rate in cash upon collection.

---

## 🚀 Key Features

- **Dynamic Tiered Pricing Engine:** Automatically aggregates active non-cancelled units, unlocks cheaper wholesale tiers, and applies the lowest unlocked tier price retroactively to all buyers in the pool.
- **Race Condition & Concurrency Safety:** Strict Prisma database transactions prevent double-booking past supplier caps or desynchronized tier thresholds when two buyers join at the same second.
- **Visual Deal Progress & Live Sync:** Hero animated progress bars with tier milestone markers and 10-second polling updates.
- **1-Click WhatsApp Sharing:** Generates pre-formatted viral invites with current units claimed, remaining units to unlock the next discount, and direct pool link.
- **Zero Advance Payment Risk:** Cash at pickup model tailored for the Pakistani market, with buyer reliability tracking (`noShowCount`).
- **Automated Lifecycle & Scheduled Cron:** `/api/cron/close-deals` automatically evaluates deals at deadlines, marking pools `UNLOCKED` if minimum volume is achieved or `FAILED` if unreached.
- **Admin Operations Hub:** Create products and deals, configure wholesale margin tiers, track participant rosters, manage fulfillment, and view automated platform profit calculations.
- **Quick Demo Login:** 1-click test login buttons for **Buyer** (`03211112233`) and **Admin** (`03001234567`) so recruiters can review without typing credentials.

---

## 📐 Architecture & Tech Stack

```
               ┌────────────────────────────────────────────────────────┐
               │             Next.js 16 (App Router) + React 19         │
               └───────────────┬────────────────────────┬───────────────┘
                               │                        │
                    ┌──────────▼──────────┐   ┌─────────▼──────────┐
                    │    UI Components    │   │  API Route Handlers│
                    │  Tailwind CSS v4    │   │    & Auth.js v5    │
                    │   Lucide Icons      │   │    (Credentials)   │
                    └─────────────────────┘   └─────────┬──────────┘
                                                        │
                                                        ▼
                                              ┌───────────────────┐
                                              │   Prisma ORM 6    │
                                              └─────────┬─────────┘
                                                        │
                                                        ▼
                                              ┌───────────────────┐
                                              │   PostgreSQL DB   │
                                              │    (Supabase)     │
                                              └───────────────────┘
```

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) + TypeScript | Modern React Server/Client boundary in a single unified codebase |
| **Database & ORM**| Supabase PostgreSQL + Prisma 6 | Relational constraints for deals, tiers, and user participations |
| **Styling** | Tailwind CSS v4 | High-performance design system with emerald brand palette |
| **Testing** | Vitest | Unit-tested pricing and tier-crossing calculations |
| **Auth** | NextAuth / Auth.js (Credentials) | Phone number + password identifier suited for Pakistani users |
| **Deployment** | Vercel | Seamless edge deployments with environment variable pooling |

---

## 🧮 How the Pricing Engine Works

Every buyer pays the rate of the **highest unlocked tier reached by the deal deadline**, not the tier active when they joined.

```
Total Active Units = sum(Participation.quantity where status != 'CANCELLED')

Current Tier = max(DealTier where minUnits <= Total Active Units)
Final Unit Price = Current Tier.pricePerUnit
Platform Margin = (Current Tier.pricePerUnit - Current Tier.supplierCostPerUnit) * Total Units
```

### Example (Dalda Cooking Oil 5L Tin):
- **1 to 9 units:** PKR 3,000 (Base retail)
- **10 to 19 units:** PKR 2,850 (Save 5%)
- **20+ units:** PKR 2,700 (Save 10%)

If 7 buyers pool 3 units each (= 21 units), **everyone pays PKR 2,700** at pickup.

---

## 🧪 Testing

The core pricing domain logic is thoroughly tested with **Vitest**:

```bash
pnpm test
```

Test coverage includes:
- Active vs cancelled participation filtering
- Tier boundary transitions
- Calculation of units needed to unlock next tier
- Deal progress percentage calculations
- Buyer savings and platform margin formulas

---

## 🛠️ Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd wholly
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase connection strings:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="your-secure-random-secret"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="your-cron-secret-token"
```

### 3. Push Database Schema & Seed Data
```bash
# Push schema to Supabase PostgreSQL
pnpm prisma db push

# Seed initial products, deals, tiers, and demo users
pnpm prisma db seed
```

### 4. Start Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Credentials

| Role | Phone | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `03001234567` | `password123` | Create deals, mark fulfilled, track buyer roster, close deals cron |
| **Buyer** | `03211112233` | `password123` | Join pools, select 1-3 units, invite neighbors via WhatsApp |

---

## 💡 What I Learned & What's Next

### Technical Highlights & Learnings:
1. **Handling Concurrency in Bulk Pools:** Used Prisma transactions to ensure that concurrent join requests don't exceed stock quotas or cause stale tier states.
2. **App Router & Dynamic Prerendering:** Managed dynamic server-side session contexts alongside static shell caching.
3. **State Machine Modeling:** Structured clear status transitions (`OPEN` → `UNLOCKED` / `FAILED` → `FULFILLED`) to avoid undefined order states.

### What's Next:
- [ ] JazzCash & Easypaisa token micro-deposits to prevent pickup no-shows.
- [ ] Real-time WebSocket / Supabase Realtime progress animations.
- [ ] Neighborhood and university hostel group tagging.
