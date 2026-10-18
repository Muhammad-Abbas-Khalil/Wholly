import { describe, it, expect } from 'vitest';
import {
  totalUnits,
  currentTier,
  nextTier,
  unitsToNextTier,
  calculateDealProgress,
  calculateSavings,
  calculatePlatformMargin,
  calculateAdvanceDeposit,
  calculateBalanceDue,
  type TierLike,
  type ParticipationLike,
} from '../src/lib/pricing';

describe('Wholly Pricing Engine', () => {
  const sampleTiers: TierLike[] = [
    { minUnits: 1, pricePerUnit: 3000, supplierCostPerUnit: 2600 },
    { minUnits: 10, pricePerUnit: 2850, supplierCostPerUnit: 2550 },
    { minUnits: 20, pricePerUnit: 2700, supplierCostPerUnit: 2500 },
  ];

  describe('totalUnits()', () => {
    it('returns 0 for empty participations list', () => {
      expect(totalUnits([])).toBe(0);
    });

    it('sums active quantities correctly', () => {
      const participations: ParticipationLike[] = [
        { quantity: 2, status: 'RESERVED' },
        { quantity: 3, status: 'RESERVED' },
        { quantity: 1, status: 'COLLECTED' },
      ];
      expect(totalUnits(participations)).toBe(6);
    });

    it('ignores CANCELLED participations', () => {
      const participations: ParticipationLike[] = [
        { quantity: 3, status: 'RESERVED' },
        { quantity: 3, status: 'CANCELLED' },
        { quantity: 2, status: 'RESERVED' },
      ];
      expect(totalUnits(participations)).toBe(5);
    });
  });

  describe('currentTier()', () => {
    it('returns null if units are below the first tier minimum', () => {
      const tiersWithMin5: TierLike[] = [
        { minUnits: 5, pricePerUnit: 3000, supplierCostPerUnit: 2600 },
        { minUnits: 15, pricePerUnit: 2700, supplierCostPerUnit: 2400 },
      ];
      expect(currentTier(tiersWithMin5, 0)).toBeNull();
      expect(currentTier(tiersWithMin5, 4)).toBeNull();
    });

    it('returns base tier when units meet first tier min', () => {
      const tier = currentTier(sampleTiers, 1);
      expect(tier).not.toBeNull();
      expect(tier?.pricePerUnit).toBe(3000);
      expect(tier?.minUnits).toBe(1);
    });

    it('returns intermediate tier when reaching boundary', () => {
      const tier = currentTier(sampleTiers, 10);
      expect(tier).not.toBeNull();
      expect(tier?.pricePerUnit).toBe(2850);
      expect(tier?.minUnits).toBe(10);
    });

    it('returns highest unlocked tier when exceeding top tier', () => {
      const tier = currentTier(sampleTiers, 25);
      expect(tier).not.toBeNull();
      expect(tier?.pricePerUnit).toBe(2700);
      expect(tier?.minUnits).toBe(20);
    });
  });

  describe('nextTier() & unitsToNextTier()', () => {
    it('identifies next tier when at 0 units', () => {
      const next = nextTier(sampleTiers, 0);
      expect(next?.minUnits).toBe(1);
      expect(unitsToNextTier(sampleTiers, 0)).toBe(1);
    });

    it('identifies next tier when at 14 units', () => {
      const next = nextTier(sampleTiers, 14);
      expect(next?.minUnits).toBe(20);
      expect(unitsToNextTier(sampleTiers, 14)).toBe(6);
    });

    it('returns null and 0 when top tier is already unlocked', () => {
      expect(nextTier(sampleTiers, 20)).toBeNull();
      expect(unitsToNextTier(sampleTiers, 20)).toBe(0);
      expect(nextTier(sampleTiers, 30)).toBeNull();
      expect(unitsToNextTier(sampleTiers, 30)).toBe(0);
    });
  });

  describe('calculateDealProgress()', () => {
    it('calculates correct percentages up to 100%', () => {
      expect(calculateDealProgress(sampleTiers, 0)).toBe(0);
      expect(calculateDealProgress(sampleTiers, 10)).toBe(50);
      expect(calculateDealProgress(sampleTiers, 20)).toBe(100);
      expect(calculateDealProgress(sampleTiers, 30)).toBe(100);
    });
  });

  describe('calculateSavings()', () => {
    it('returns 0 savings on base tier', () => {
      const active = currentTier(sampleTiers, 5);
      const savings = calculateSavings(sampleTiers, active);
      expect(savings.savingsPerUnit).toBe(0);
      expect(savings.percentage).toBe(0);
    });

    it('calculates correct savings on highest tier (PKR 3000 -> 2700 is 10%)', () => {
      const active = currentTier(sampleTiers, 20);
      const savings = calculateSavings(sampleTiers, active);
      expect(savings.savingsPerUnit).toBe(300);
      expect(savings.percentage).toBe(10);
    });
  });

  describe('calculatePlatformMargin()', () => {
    it('returns 0 when active tier is null or units are 0', () => {
      expect(calculatePlatformMargin(null, 10)).toBe(0);
      expect(calculatePlatformMargin(sampleTiers[0], 0)).toBe(0);
    });
  });

  describe('calculateAdvanceDeposit() & calculateBalanceDue()', () => {
    it('calculates 10% advance deposit correctly based on total pool value', () => {
      expect(calculateAdvanceDeposit(27000, 10)).toBe(2700);
      expect(calculateAdvanceDeposit(3000, 10)).toBe(300);
      expect(calculateAdvanceDeposit(0, 10)).toBe(0);
    });

    it('calculates remaining cash balance due at pickup accurately after deducting advance deposit', () => {
      // 5 units at PKR 2,700 = 13,500 total, 10% advance paid = 1350 -> balance due = 12,150
      expect(calculateBalanceDue(2700, 5, 1350)).toBe(12150);
      // If no deposit paid yet
      expect(calculateBalanceDue(2700, 5, 0)).toBe(13500);
    });
  });
});

