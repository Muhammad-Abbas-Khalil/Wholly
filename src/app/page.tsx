'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DealCard from '@/components/DealCard';
import {
  Users,
  Coins,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  TrendingDown,
  Sparkles,
  CreditCard,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
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

    // 10-second polling for live updates
    const pollInterval = setInterval(() => {
      fetchDeals(false);
    }, 10000);

    return () => clearInterval(pollInterval);
  }, []);

  const categories = [
    'ALL',
    'Flour & Grains',
    'Cooking Oil',
    'Dairy & Breakfast',
    'Rice & Grains',
    'Tea & Beverages',
    'Sugar & Sweeteners',
  ];

  const cities = ['ALL', 'Lahore', 'Karachi', 'Islamabad', 'Peshawar'];

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchesCategory = categoryFilter === 'ALL' || deal.product.category === categoryFilter;
      const matchesCity =
        cityFilter === 'ALL' ||
        (deal.pickupLocation && deal.pickupLocation.toLowerCase().includes(cityFilter.toLowerCase()));
      return matchesCategory && matchesCity;
    });
  }, [deals, categoryFilter, cityFilter]);

  return (
    <div className="space-y-10 pb-16">
      {/* Catchy Modern Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-white pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8 shadow-inner">
        {/* Decorative background aura */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_55%)] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Badge with All 4 Major Cities */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold backdrop-blur-md shadow-xs animate-in fade-in duration-300">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            Direct-From-Mill Wholesale Grocery Pools • Lahore • Karachi • Islamabad • Peshawar & More
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Stop Paying Retail Markups.{' '}
            <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">
              Pool Orders. Pay Wholesale.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-emerald-100/90 font-medium leading-relaxed">
            Wholly lets Pakistani families and businesses pool monthly staple grocery orders together.
            When neighborhood volume tiers unlock, genuine direct-from-mill discounts apply to everyone.
          </p>

          {/* Value Prop Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-emerald-100">
            <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors">
              <ShoppingBag className="w-4 h-4 text-emerald-300" />
              No Unit Limits
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors">
              <CreditCard className="w-4 h-4 text-amber-300" />
              30% Advance (JazzCash / Easypaisa / Card)
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors">
              <Coins className="w-4 h-4 text-teal-300" />
              Remaining 70% Cash on Pickup
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              100% Genuine Direct-from-Miller
            </span>
          </div>

          {/* Impact Stats Banner */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left text-xs">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[11px] text-emerald-300 font-semibold block">Total Volume Pooled</span>
              <span className="text-xl font-black text-white mt-0.5 block">24,500+ kg</span>
              <span className="text-[10px] text-emerald-200/70">Atta, Rice, Oil, Tea & Milk</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[11px] text-emerald-300 font-semibold block">Avg. Family Savings</span>
              <span className="text-xl font-black text-amber-300 mt-0.5 block">Save 18% – 35%</span>
              <span className="text-[10px] text-emerald-200/70">Below Supermarket Rates</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[11px] text-emerald-300 font-semibold block">Active City Hubs</span>
              <span className="text-xl font-black text-white mt-0.5 block">4 Major Cities</span>
              <span className="text-[10px] text-emerald-200/70">Lahore, Karachi, Islamabad & Peshawar</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[11px] text-emerald-300 font-semibold block">Fulfillment Trust</span>
              <span className="text-xl font-black text-emerald-300 mt-0.5 block">100% Verified</span>
              <span className="text-[10px] text-emerald-200/70">Inspect before final cash payment</span>
            </div>
          </div>
        </div>
      </section>

      {/* Active Cities & Expansion Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
              <MapPin className="w-5 h-5" />
            </span>
            <div>
              <span className="text-sm font-black text-slate-900 block">Available in Active City Hubs:</span>
              <span className="text-xs text-slate-500">Pick up from verified community hubs across Pakistan</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setCityFilter(city)}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  cityFilter === city
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {city !== 'ALL' && <span className={`w-2 h-2 rounded-full ${cityFilter === city ? 'bg-white' : 'bg-emerald-500'} animate-pulse`} />}
                {city === 'ALL' ? 'All Cities' : city}
              </button>
            ))}

            <span className="px-3 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Coming Soon to Rawalpindi, Faisalabad & Multan
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-2">
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
                    : 'bg-white text-slate-800 hover:text-black border border-slate-300 hover:border-slate-400'
                }`}
              >
                {cat === 'ALL' ? 'All Staples' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 shrink-0 self-end sm:self-center">
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
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8 space-y-3">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-900">No deals found in this selection</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No live pools matching {categoryFilter !== 'ALL' ? `category "${categoryFilter}"` : ''}{' '}
              {cityFilter !== 'ALL' ? `in ${cityFilter}` : ''}. Check back soon or reset filters.
            </p>
            <button
              onClick={() => {
                setCategoryFilter('ALL');
                setCityFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Reset Filters
            </button>
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
              Three simple steps to unlocking direct factory wholesale prices on your monthly staple budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-emerald-100 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center mx-auto text-lg">
                1
              </div>
              <h3 className="font-bold text-gray-900 text-base">Order Any Quantity (No Limits)</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Choose any quantity your household or business requires with zero unit limits. Lock in with a 30% advance deposit via JazzCash, Easypaisa, or Card.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xs border border-emerald-100 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center mx-auto text-lg">
                2
              </div>
              <h3 className="font-bold text-gray-900 text-base">Share with Friends & Neighbors</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Click the WhatsApp share button. As more community members join the pool, deeper wholesale discount tiers unlock for everyone.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xs border border-emerald-100 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center mx-auto text-lg">
                3
              </div>
              <h3 className="font-bold text-gray-900 text-base">Inspect & Pay 70% Balance at Pickup</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Collect your fresh sealed factory goods at your local city hub, verify items in person, and pay the remaining 70% balance in cash.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
