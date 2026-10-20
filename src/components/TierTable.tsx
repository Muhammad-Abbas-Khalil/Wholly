'use client';

import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface TierData {
  id?: string;
  minUnits: number;
  pricePerUnit: number;
  supplierCostPerUnit?: number;
}

interface TierTableProps {
  tiers: TierData[];
  unitsClaimed: number;
  unitLabel?: string;
  retailPrice?: number | null;
}

export default function TierTable({ tiers, unitsClaimed, unitLabel = 'units', retailPrice }: TierTableProps) {
  if (!tiers || tiers.length === 0) return null;

  const sortedTiers = [...tiers].sort((a, b) => a.minUnits - b.minUnits);
  const benchmarkPrice = retailPrice && retailPrice > 0 ? retailPrice : sortedTiers[0].pricePerUnit;

  // Find active tier
  const activeTiers = sortedTiers.filter((t) => unitsClaimed >= t.minUnits);
  const currentActive = activeTiers[activeTiers.length - 1] ?? null;

  // Find immediate next tier
  const nextTarget = sortedTiers.find((t) => t.minUnits > unitsClaimed) ?? null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50/80 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
          <tr>
            <th className="py-3 px-4">Pool Volume</th>
            <th className="py-3 px-4">Price / Unit</th>
            <th className="py-3 px-4">Discount</th>
            <th className="py-3 px-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedTiers.map((tier, idx) => {
            const isCurrent = currentActive?.minUnits === tier.minUnits;
            const isNext = nextTarget?.minUnits === tier.minUnits;
            const isUnlocked = unitsClaimed >= tier.minUnits;

            const savings = Math.max(0, benchmarkPrice - tier.pricePerUnit);
            const savingsPercent = benchmarkPrice > 0 ? Math.round((savings / benchmarkPrice) * 100) : 0;

            const nextTierObj = sortedTiers[idx + 1];
            const rangeLabel = nextTierObj
              ? `${tier.minUnits} to ${nextTierObj.minUnits - 1} ${unitLabel}`
              : `${tier.minUnits}+ ${unitLabel}`;

            return (
              <tr
                key={tier.id || idx}
                className={`transition-colors ${
                  isCurrent
                    ? 'bg-emerald-50/60 font-medium'
                    : isNext
                    ? 'bg-amber-50/30'
                    : 'hover:bg-gray-50/50'
                }`}
              >
                <td className="py-3.5 px-4 font-semibold text-gray-900 flex items-center gap-2">
                  {isUnlocked && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {rangeLabel}
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-bold text-gray-900">
                    PKR {tier.pricePerUnit.toLocaleString()}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  {savingsPercent > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Save {savingsPercent}% (-PKR {savings.toLocaleString()})
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Standard price</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                      Active Tier
                    </span>
                  ) : isNext ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <ArrowRight className="w-3 h-3" /> {tier.minUnits - unitsClaimed} left to unlock
                    </span>
                  ) : isUnlocked ? (
                    <span className="text-emerald-700 text-xs font-semibold">Unlocked</span>
                  ) : (
                    <span className="text-gray-400 text-xs">🔒 Locked</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
