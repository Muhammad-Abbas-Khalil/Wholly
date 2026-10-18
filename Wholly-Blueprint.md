# Wholly: Project Blueprint

A full-stack group-buying app for Pakistan. People join the same deal, and once enough units are claimed, the order is placed in bulk and everyone gets the lower price.

*Working name: Wholly. Tagline: Buy together, pay wholesale. Alternatives: GroupCart, Sharely, Splitly.*

## 1. The idea in one paragraph

Buying in bulk is cheaper, but one person rarely needs 50 units of anything. Wholly lets 5 to 50 people pool the same order. When the total units ordered cross a threshold, the price drops to a wholesale tier and the order is sent to the supplier. Buyers save money, the supplier gets one large guaranteed order, and the platform earns a small margin from the difference between the wholesale price and the price buyers pay.

**Locked decisions**

| Area | Decision |
| --- | --- |
| Market | Pakistan, prices in PKR |
| First category | Monthly household staples (atta, rice, cooking oil, sugar, tea, lentils, detergent) |
| Language | English only |
| Tier rule | Tiers count total units, with a cap of 3 units per person per deal |
| Payment | Cash at pickup. JazzCash or Easypaisa later |
| Login | Phone number |
| Sharing | WhatsApp share button with a pre-written message |
| Fulfilment | One pickup point per deal, no home delivery |
| Deal source | Curated by admin |

## 2. Goals

**Product goals**

- Let a buyer join a deal in under 30 seconds.
- Make progress visible ("14 of 20 units claimed, 6 more unlocks PKR 2,700") so people invite friends.
- Make the platform margin automatic and transparent.

**Portfolio goals**

- Show real full-stack skills: auth, database design, API, business logic, scheduled jobs, deployment.
- Have a live demo link, a clean README, and a 30-second demo video for LinkedIn.

## 3. Users and roles

| Role | What they do |
| --- | --- |
| Buyer | Browses deals, joins, invites friends, tracks orders |
| Admin | Creates products and deals, monitors progress, marks orders fulfilled |
| Supplier (later) | Posts bulk offers, confirms orders |

For the weekend MVP, Admin acts as the supplier side. We curate every deal ourselves.

## 4. How a deal works

1. Admin creates a deal: product, wholesale tiers, deadline, and pickup details.
2. Buyers join and reserve 1 to 3 units.
3. The page shows a live progress bar, current price, and the next tier.
4. At the deadline the system adds up the units claimed.
5. If the minimum tier is reached, the deal becomes **Unlocked** and everyone pays the final tier price in cash at pickup.
6. If not, the deal becomes **Failed** and nobody owes anything.
7. After the supplier delivers, Admin marks the deal **Fulfilled** and buyers collect their items.

**Deal statuses:** `open` → `unlocked` → `fulfilled`, or `open` → `failed`.

## 5. Pricing model

Every buyer pays the price of the highest tier reached, not the tier they joined at. This rewards early joiners and encourages sharing.

**Example: 5 L cooking oil (placeholder prices, verify real wholesale rates)**

| Total units claimed | Price per unit (PKR) | Buyer saving |
| --- | --- | --- |
| 1 to 9 | 3,000 | 0% |
| 10 to 19 | 2,850 | 5% |
| 20 or more | 2,700 | 10% |

**Platform margin:** the supplier's real price is lower than the tier price. If the supplier charges PKR 2,500 per unit at 20+ units, the platform keeps PKR 200 per unit. Supplier cost is stored per tier so margin can be reported in the admin dashboard. With a cap of 3 units per person, unlocking the 20-unit tier takes at least 7 buyers.

**Final price rule:** `finalPrice = price of the highest tier whose minUnits <= totalUnits`, where `totalUnits` is the sum of quantity across all active participations.

## 6. Features

**MVP (weekend scope)**

- Phone number sign-up and login (SMS OTP later)
- Deal list with a unit progress bar, countdown, and current price in PKR
- Deal detail page with a tier table and a Join button
- Join with 1 to 3 units, and change or cancel before the deadline
- WhatsApp share button with a pre-written message
- My Deals page for buyers
- Admin panel: create product, create deal, view participants, mark collected or no-show, mark fulfilled
- Scheduled job that closes expired deals and sets unlocked or failed
- Pay at pickup, with no online payments

**Later**

- JazzCash or Easypaisa payments, with a small booking token to reduce no-shows
- SMS or WhatsApp notifications ("6 more units to unlock")
- Reliability score for buyers who miss pickups
- Product request board with upvotes
- Supplier dashboard and ratings
- Neighborhood, hostel, and office groups
- Real-time progress via WebSockets

## 7. Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | Frontend and API in one repo, easy deploy |
| Styling | Tailwind CSS | Fast, consistent UI |
| Database | PostgreSQL (Neon or Supabase free tier) | Relational data fits deals and participations |
| ORM | Prisma | Typed schema and migrations |
| Auth | NextAuth (credentials) with phone number and password | Phone is the common identifier. SMS OTP can be added later |
| Jobs | Scheduled route that closes expired deals | Sets unlocked or failed at the deadline |
| Live updates | Polling every 10 seconds (WebSockets later) | Simple and reliable |
| Testing | Vitest for the pricing logic | Shows engineering discipline |
| Deploy | Vercel | Live link for LinkedIn |

## 8. Data model

**User**: id, name, phone (unique), passwordHash, role (BUYER or ADMIN), noShowCount, createdAt

**Product**: id, name, description, imageUrl, unit (kg, pack, piece), category

**Deal**: id, productId, status (OPEN, UNLOCKED, FAILED, FULFILLED), deadline, maxPerUser (default 3), pickupLocation, pickupTime, createdBy, createdAt

**DealTier**: id, dealId, minUnits, pricePerUnit (PKR), supplierCostPerUnit (PKR)

**Participation**: id, dealId, userId, quantity (1 to maxPerUser), status (RESERVED, COLLECTED, NO_SHOW, CANCELLED), joinedAt. Unique on (dealId, userId).

**Relationships:** a Product has many Deals, a Deal has many DealTiers and many Participations, and a User has many Participations.

## 9. Core business logic

```ts
// Tiers count total units, not people
function totalUnits(participations) {
  return participations
    .filter(p => p.status !== 'CANCELLED')
    .reduce((sum, p) => sum + p.quantity, 0);
}

function currentTier(tiers, units) {
  const reached = tiers
    .filter(t => units >= t.minUnits)
    .sort((a, b) => b.minUnits - a.minUnits);
  return reached[0] ?? null; // null = below the first tier
}

function nextTier(tiers, units) {
  return tiers
    .filter(t => t.minUnits > units)
    .sort((a, b) => a.minUnits - b.minUnits)[0] ?? null;
}

// Scheduled job: closes expired deals
async function closeExpiredDeals() {
  const deals = await findOpenDealsPastDeadline();
  for (const deal of deals) {
    const units = totalUnits(deal.participations);
    const tier = currentTier(deal.tiers, units);
    if (tier) await markUnlocked(deal.id, tier);
    else await markFailed(deal.id);
  }
}
```

**Edge cases to handle**

- A user joining twice (blocked by the unique constraint, they change quantity instead)
- Quantity above the per-person cap of 3 (rejected)
- Joining after the deadline
- Leaving or reducing units after the deal is unlocked (not allowed)
- Two people joining at the exact moment a tier is crossed (use a database transaction)
- Joins that would push the total past the supplier's available stock (check inside the same transaction)
- No-shows at pickup (mark NO_SHOW and track a count per user)
- Admin editing tiers after people have joined (lock tiers once the first person joins)

## 10. Screens

| Screen | Purpose |
| --- | --- |
| Home / Deals | Grid of open deals with progress bars and countdowns |
| Deal detail | Tier table, progress, join button, share link, unit count |
| Login / Sign up | Auth |
| My Deals | Joined deals grouped by status |
| Admin: Deals | Create and manage deals |
| Admin: Deal participants | Who joined, quantities, mark collected |

**Design direction:** clean and trustworthy, with the progress bar as the visual hero. Price drops should feel rewarding, with a small celebration when a tier unlocks.

## 11. API routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /api/deals | List deals with current tier and units claimed |
| GET | /api/deals/:id | Deal detail |
| POST | /api/deals | Create deal (admin) |
| POST | /api/deals/:id/join | Join with quantity |
| DELETE | /api/deals/:id/join | Leave before deadline |
| GET | /api/me/deals | Buyer's participations |
| POST | /api/admin/deals/:id/fulfill | Mark fulfilled (admin) |
| GET | /api/cron/close-deals | Protected cron endpoint |

## 12. Folder structure

```
wholly/
  prisma/schema.prisma
  src/
    app/
      (public)/page.tsx           # deals list
      deals/[id]/page.tsx
      my-deals/page.tsx
      admin/...
      api/...
    lib/
      pricing.ts                  # tier logic (unit tested)
      db.ts
      auth.ts
    components/
      DealCard.tsx
      ProgressBar.tsx
      TierTable.tsx
  tests/pricing.test.ts
  README.md
```

## 13. Weekend plan

**Saturday**

- Morning: set up Next.js, Prisma, database, and auth. Write the schema and seed data.
- Afternoon: build pricing logic with tests, deal list, and deal detail pages.
- Evening: join and leave flow, My Deals page.

**Sunday**

- Morning: admin panel, scheduled job, status transitions.
- Afternoon: polish the UI, progress bar animation, WhatsApp share, empty and error states.
- Evening: deploy, write the README, record the demo.

## 14. GitHub and LinkedIn plan

**README should contain**

- A GIF or screenshot at the top and a live demo link
- The problem, in two sentences
- Architecture diagram and tech stack
- How the pricing logic works
- "What I learned" and "What I'd build next"
- Setup instructions

**LinkedIn post**

- A 30-second screen recording showing people joining and the price dropping
- One line on the problem
- One technical challenge you solved, such as handling two people crossing a tier at the same moment
- Links to the live demo and the repo

## 15. Risks

| Risk | Mitigation |
| --- | --- |
| Trust in a new platform | Start with one known group (hostel, office, or neighborhood) and a few curated deals |
| Empty deals on launch | Seed data for the demo, and invite friends for real use |
| Delivery logistics | Single pickup location per deal, no home delivery |
| No-shows with pay at pickup | 3-unit cap per person, a no-show count per user, and a booking token via JazzCash or Easypaisa later |
| Payments | Cash at pickup for the MVP, so no refunds or payment gateway to build |
| Scope creep | Keep to the MVP list above and park everything else |

## 16. Open decisions

- Final project name
- First pickup point and launch group (hostel, office, university, or neighborhood)
- Real wholesale prices for the first two or three deals
- Deal length (for example 3 to 5 days)

Once these are settled, the next step is scaffolding the repo and writing the Prisma schema and pricing module.
