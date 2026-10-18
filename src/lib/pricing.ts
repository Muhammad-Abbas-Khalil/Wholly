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
 * Computes savings compared to the base tier (first tier).
 */
export function calculateSavings<T extends TierLike>(
  tiers: T[],
  activeTier: T | null
): { savingsPerUnit: number; percentage: number } {
  if (!tiers.length || !activeTier) {
    return { savingsPerUnit: 0, percentage: 0 };
  }

  // Base tier is the tier with the lowest minUnits (usually standard retail/starter tier)
  const sortedByMin = [...tiers].sort((a, b) => a.minUnits - b.minUnits);
  const baseTier = sortedByMin[0];

  const savingsPerUnit = Math.max(0, baseTier.pricePerUnit - activeTier.pricePerUnit);
  const percentage =
    baseTier.pricePerUnit > 0 ? Math.round((savingsPerUnit / baseTier.pricePerUnit) * 100) : 0;

  return { savingsPerUnit, percentage };
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
