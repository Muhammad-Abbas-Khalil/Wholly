'use client';

import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface TierMarker {
  minUnits: number;
  pricePerUnit: number;
}

interface ProgressBarProps {
  unitsClaimed: number;
  tiers: TierMarker[];
  className?: string;
}

export default function ProgressBar({ unitsClaimed, tiers, className = '' }: ProgressBarProps) {
  if (!tiers || tiers.length === 0) return null;

  const sortedTiers = [...tiers].sort((a, b) => a.minUnits - b.minUnits);
  const maxTierUnits = sortedTiers[sortedTiers.length - 1].minUnits;
  const progressPercent = Math.min(100, Math.round((unitsClaimed / maxTierUnits) * 100));

  // Determine current and next tier
  const reachedTiers = sortedTiers.filter((t) => unitsClaimed >= t.minUnits);
  const currentActiveTier = reachedTiers[reachedTiers.length - 1] ?? null;
  const upcomingTiers = sortedTiers.filter((t) => t.minUnits > unitsClaimed);
  const nextTargetTier = upcomingTiers[0] ?? null;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Top summary row */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <strong className="text-gray-900 font-bold">{unitsClaimed}</strong> of {maxTierUnits} units claimed
        </span>

        {nextTargetTier ? (
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            {nextTargetTier.minUnits - unitsClaimed} more unlocks PKR {nextTargetTier.pricePerUnit.toLocaleString()}
          </span>
        ) : (
          <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            Max wholesale tier unlocked!
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden p-0.5 shadow-inner">
        {/* Animated fill bar */}
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-700 ease-out shadow-sm"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Tier milestone labels */}
      <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 pt-1">
        {sortedTiers.map((tier, idx) => {
          const isUnlocked = unitsClaimed >= tier.minUnits;
          return (
            <div
              key={idx}
              className={`flex flex-col items-center transition-colors ${
                isUnlocked ? 'text-emerald-700 font-bold' : 'text-gray-400'
              }`}
            >
              <span>{tier.minUnits} units</span>
              <span className="text-[10px]">PKR {tier.pricePerUnit.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
