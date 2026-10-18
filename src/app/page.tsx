'use client';

import React, { useState, useEffect } from 'react';
import DealCard from '@/components/DealCard';
import {
  Users,
  Coins,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

export default function HomePage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDeals = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const res = await fetch('/api/deals');
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals || []);
      }
    } catch (err) {
      console.error('Failed to load deals:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeals();

    // 10-second polling for live updates as specified in blueprint
    const pollInterval = setInterval(() => {
      fetchDeals(false);
    }, 10000);

    return () => clearInterval(pollInterval);
  }, []);

  const categories = ['ALL', 'Cooking Oil', 'Rice & Grains', 'Tea & Beverages', 'Sugar & Sweeteners'];

  const filteredDeals = deals.filter((deal) => {
    if (categoryFilter === 'ALL') return true;
    return deal.product.category === categoryFilter;
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold backdrop-blur-md">
            <TrendingDown className="w-4 h-4 text-emerald-300" />
            Save 10% to 25% on Monthly Staples
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Buy Together. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">
              Pay Wholesale.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-emerald-100 font-medium leading-relaxed">
            Wholly lets neighbors and friends pool staple grocery orders together. When enough
            units are claimed, the wholesale discount unlocks for everyone.
          </p>

          {/* Value Props Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-emerald-200">
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <Coins className="w-4 h-4 text-amber-300" />
              Pay Cash at Pickup (No Advance)
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <Users className="w-4 h-4 text-emerald-300" />
              Max 3 Units Cap Per Person
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <ShieldCheck className="w-4 h-4 text-teal-300" />
              Zero Fee If Threshold Not Met
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Filter bar & Auto-poll indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
                    : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {cat === 'ALL' ? 'All Staples' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-gray-500 shrink-0 self-end sm:self-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync (10s)
            </span>
            <button
              onClick={() => fetchDeals(true)}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Refresh now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Deals Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 rounded-3xl bg-gray-100 animate-pulse border border-gray-200"
              />
            ))}
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">No deals found in this category</h3>
            <p className="text-xs text-gray-500 mt-1">Check back soon or select another category above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}

        {/* How Wholly Works 3-Step Banner */}
        <section className="mt-16 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-8 sm:p-10">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-black text-gray-900">How Wholly Works</h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
              Three simple steps to saving up to 25% on your monthly kitchen budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-emerald-100 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center mx-auto text-lg">
                1
              </div>
              <h3 className="font-bold text-gray-900 text-base">Claim 1 to 3 Units</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Browse open pools and reserve your units in 30 seconds with just your phone number.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xs border border-emerald-100 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center mx-auto text-lg">
                2
              </div>
              <h3 className="font-bold text-gray-900 text-base">Share with Friends</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Click the WhatsApp share button. As more neighbors join, the wholesale discount tier unlocks.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xs border border-emerald-100 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center mx-auto text-lg">
                3
              </div>
              <h3 className="font-bold text-gray-900 text-base">Pay Cash at Pickup</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Collect your order at the designated community hub and pay the final discounted rate in cash.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
