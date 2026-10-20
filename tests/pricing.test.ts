import { describe, it, expect } from 'vitest';
import {
  totalUnits,
  currentTier,
  nextTier,
  unitsToNextTier,
  calculateDealProgress,
  calculateSavings,
  calculateTargetSavings,
  isDealUnlocked,
  calculatePlatformMargin,
  calculateAdvanceDeposit,
  calculateBalanceDue,
  formatReservedUnits,
  getPickupCode,
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

    it('calculates savings against explicit retail price for threshold locked tiers', () => {
      const wholesaleTiers: TierLike[] = [
        { minUnits: 10, pricePerUnit: 2850, supplierCostPerUnit: 2550 },
        { minUnits: 20, pricePerUnit: 2700, supplierCostPerUnit: 2500 },
      ];
      // When locked (< 10 units)
      const lockedTier = currentTier(wholesaleTiers, 6);
      expect(lockedTier).toBeNull();
      const lockedSavings = calculateSavings(wholesaleTiers, lockedTier, 3000);
      expect(lockedSavings.savingsPerUnit).toBe(0);

      // When unlocked at tier 1 (10 units)
      const unlockedTier = currentTier(wholesaleTiers, 12);
      const tier1Savings = calculateSavings(wholesaleTiers, unlockedTier, 3000);
      expect(tier1Savings.savingsPerUnit).toBe(150);
      expect(tier1Savings.percentage).toBe(5);

      // Target preview savings
      const target = calculateTargetSavings(wholesaleTiers, 3000);
      expect(target.targetPrice).toBe(2850);
      expect(target.savingsPerUnit).toBe(150);
      expect(target.percentage).toBe(5);
    });
  });

  describe('isDealUnlocked()', () => {
    const wholesaleTiers: TierLike[] = [
      { minUnits: 10, pricePerUnit: 2850, supplierCostPerUnit: 2550 },
      { minUnits: 20, pricePerUnit: 2700, supplierCostPerUnit: 2500 },
    ];

    it('returns false when units are below the minimum threshold', () => {
      expect(isDealUnlocked(wholesaleTiers, 0)).toBe(false);
      expect(isDealUnlocked(wholesaleTiers, 9)).toBe(false);
    });

    it('returns true once minimum threshold is reached', () => {
      expect(isDealUnlocked(wholesaleTiers, 10)).toBe(true);
      expect(isDealUnlocked(wholesaleTiers, 25)).toBe(true);
    });
  });

  describe('calculatePlatformMargin()', () => {
    it('returns 0 when active tier is null or units are 0', () => {
      expect(calculatePlatformMargin(null, 10)).toBe(0);
      expect(calculatePlatformMargin(sampleTiers[0], 0)).toBe(0);
    });
  });

  describe('calculateAdvanceDeposit() & calculateBalanceDue()', () => {
    it('calculates 30% advance deposit correctly based on total pool value', () => {
      expect(calculateAdvanceDeposit(27000, 30)).toBe(8100);
      expect(calculateAdvanceDeposit(3000, 30)).toBe(900);
      expect(calculateAdvanceDeposit(3000)).toBe(900); // default 30%
      expect(calculateAdvanceDeposit(0, 30)).toBe(0);
    });

    it('calculates remaining cash balance due at pickup accurately after deducting advance deposit', () => {
      // 5 units at PKR 2,700 = 13,500 total, 30% advance paid = 4050 -> balance due = 9,450
      expect(calculateBalanceDue(2700, 5, 4050)).toBe(9450);
      // If no deposit paid yet
      expect(calculateBalanceDue(2700, 5, 0)).toBe(13500);
    });
  });

  describe('formatReservedUnits()', () => {
    it('formats quantity and metric unit with comma separator and compact notation', () => {
      expect(formatReservedUnits(6, '10 kg')).toBe('6, 10kg');
      expect(formatReservedUnits(6, '10kg')).toBe('6, 10kg');
      expect(formatReservedUnits(6, '10 kg bag')).toBe('6, 10kg bag');
      expect(formatReservedUnits(3, '5 L tin')).toBe('3, 5L tin');
      expect(formatReservedUnits(2, 'Carton (12 x 1L)')).toBe('2, Carton (12 x 1L)');
      expect(formatReservedUnits(4, 'Pack of 12')).toBe('4, Pack of 12');
    });

    it('handles empty or missing unit gracefully', () => {
      expect(formatReservedUnits(6, null)).toBe('6 units');
      expect(formatReservedUnits(6, '')).toBe('6 units');
      expect(formatReservedUnits(6, '   ')).toBe('6 units');
    });
  });

  describe('getPickupCode()', () => {
    it('generates consistent 6-character WH- prefixed pickup codes', () => {
      expect(getPickupCode('cmvf5lgpw000vs8x1n477cw5g')).toBe('WH-77CW5G');
      expect(getPickupCode('cmvf5ld9n000js8x1ttqu7p84')).toBe('WH-QU7P84');
      expect(getPickupCode('abc-123')).toBe('WH-ABC123');
    });

    it('handles null, empty, or short strings safely', () => {
      expect(getPickupCode(null)).toBe('WH-000000');
      expect(getPickupCode('')).toBe('WH-000000');
      expect(getPickupCode('A1')).toBe('WH-0000A1');
    });
  });
});

