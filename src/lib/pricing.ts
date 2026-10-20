export interface TierLike {
  id?: string;
  minUnits: number;
  pricePerUnit: number;
  supplierCostPerUnit: number;
}

export interface ParticipationLike {
  quantity: number;
  status: string;
}

/**
 * Calculates the total claimed units across all active (non-cancelled) participations.
 */
export function totalUnits(participations: ParticipationLike[]): number {
  return participations
    .filter((p) => p.status !== 'CANCELLED')
    .reduce((sum, p) => sum + p.quantity, 0);
}

/**
 * Returns the highest tier reached based on total claimed units.
 * Returns null if units are below the first tier's minimum requirement.
 */
export function currentTier<T extends TierLike>(tiers: T[], units: number): T | null {
  const reached = tiers
    .filter((t) => units >= t.minUnits)
    .sort((a, b) => b.minUnits - a.minUnits);

  return reached[0] ?? null;
}

/**
 * Returns the immediate next tier that will be unlocked as more units are claimed.
 * Returns null if the highest tier has already been reached.
 */
export function nextTier<T extends TierLike>(tiers: T[], units: number): T | null {
  const upcoming = tiers
    .filter((t) => t.minUnits > units)
    .sort((a, b) => a.minUnits - b.minUnits);

  return upcoming[0] ?? null;
}

/**
 * Returns how many more units are needed to unlock the next discount tier.
 */
export function unitsToNextTier<T extends TierLike>(tiers: T[], units: number): number {
  const next = nextTier(tiers, units);
  if (!next) return 0;
  return Math.max(0, next.minUnits - units);
}

/**
 * Calculates percentage progress towards the maximum tier or a target.
 * Useful for the animated deal progress bar.
 */
export function calculateDealProgress<T extends TierLike>(tiers: T[], units: number): number {
  if (!tiers.length) return 0;
  const maxUnits = Math.max(...tiers.map((t) => t.minUnits));
  if (maxUnits <= 0) return 0;
  return Math.min(100, Math.round((units / maxUnits) * 100));
}

/**
 * Checks whether the minimum volume threshold has been crossed to activate the deal.
 */
export function isDealUnlocked<T extends TierLike>(tiers: T[], units: number): boolean {
  return currentTier(tiers, units) !== null;
}

/**
 * Computes savings compared to the retail/benchmark price or base tier.
 */
export function calculateSavings<T extends TierLike>(
  tiers: T[],
  activeTier: T | null,
  retailPrice?: number | null
): { savingsPerUnit: number; percentage: number } {
  if (!tiers.length || !activeTier) {
    return { savingsPerUnit: 0, percentage: 0 };
  }

  // Use explicit retail price if provided; otherwise fallback to the lowest minUnits tier
  const sortedByMin = [...tiers].sort((a, b) => a.minUnits - b.minUnits);
  const benchmarkPrice = retailPrice && retailPrice > 0 ? retailPrice : sortedByMin[0].pricePerUnit;

  const savingsPerUnit = Math.max(0, benchmarkPrice - activeTier.pricePerUnit);
  const percentage =
    benchmarkPrice > 0 ? Math.round((savingsPerUnit / benchmarkPrice) * 100) : 0;

  return { savingsPerUnit, percentage };
}

/**
 * Computes potential savings of the minimum unlock tier compared to retail price (for locked preview).
 */
export function calculateTargetSavings<T extends TierLike>(
  tiers: T[],
  retailPrice?: number | null
): { targetPrice: number; savingsPerUnit: number; percentage: number } {
  if (!tiers.length) {
    return { targetPrice: 0, savingsPerUnit: 0, percentage: 0 };
  }
  const sorted = [...tiers].sort((a, b) => a.minUnits - b.minUnits);
  const firstTier = sorted[0];
  const benchmark = retailPrice && retailPrice > 0 ? retailPrice : firstTier.pricePerUnit;
  const savingsPerUnit = Math.max(0, benchmark - firstTier.pricePerUnit);
  const percentage = benchmark > 0 ? Math.round((savingsPerUnit / benchmark) * 100) : 0;
  return {
    targetPrice: firstTier.pricePerUnit,
    savingsPerUnit,
    percentage,
  };
}

/**
 * Calculates platform margin/revenue for the admin dashboard.
 * Platform margin = (buyerPrice - supplierCost) * totalUnitsClaimed
 */
export function calculatePlatformMargin<T extends TierLike>(
  activeTier: T | null,
  units: number
): number {
  if (!activeTier || units <= 0) return 0;
  const perUnitProfit = activeTier.pricePerUnit - activeTier.supplierCostPerUnit;
  return Math.max(0, perUnitProfit * units);
}

/**
 * Calculates the advance booking deposit percentage (default 30%) to secure orders.
 */
export function calculateAdvanceDeposit(totalCost: number, percentage: number = 30): number {
  if (totalCost <= 0) return 0;
  return Math.round(totalCost * (percentage / 100));
}

/**
 * Calculates the remaining balance due in cash at pickup after deducting advance deposit.
 */
export function calculateBalanceDue(
  unitPrice: number,
  quantity: number,
  depositPaid: number = 0
): number {
  const total = unitPrice * quantity;
  return Math.max(0, total - depositPaid);
}

/**
 * Formats reserved units and product unit/pack size with a clear comma separator.
 * E.g., quantity: 6, unit: "10 kg" or "10kg" -> "6, 10kg"
 * E.g., quantity: 6, unit: "10 kg bag" -> "6, 10kg bag"
 * E.g., quantity: 3, unit: "5 L tin" -> "3, 5L tin"
 */
export function formatReservedUnits(quantity: number, unit?: string | null): string {
  if (!unit || !unit.trim()) return `${quantity} units`;
  const cleanUnit = unit.trim().replace(/^,\s*/, '');
  const normalizedUnit = cleanUnit.replace(/(\d+)\s+(kg|g|L|ml)\b/gi, '$1$2');
  return `${quantity}, ${normalizedUnit}`;
}

/**
 * Generates a clean, consistent, 6-character alphanumeric pickup verification code.
 * E.g., 'cmvf5lgpw000vs8x1n477cw5g' -> 'WH-77CW5G'
 */
export function getPickupCode(participationId?: string | null): string {
  if (!participationId) return 'WH-000000';
  const clean = participationId.replace(/[^a-zA-Z0-9]/g, '');
  const suffix = clean.slice(-6).toUpperCase();
  return `WH-${suffix.padStart(6, '0')}`;
}


