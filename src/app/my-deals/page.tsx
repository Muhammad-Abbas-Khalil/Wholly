'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ShoppingBag,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Coins,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Check,
  RotateCcw,
  QrCode,
} from 'lucide-react';
import { formatReservedUnits, getPickupCode } from '@/lib/pricing';
import PickupPassModal from '@/components/PickupPassModal';

export default function MyDealsPage() {
  const { data: session, status } = useSession();
  const [participations, setParticipations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COLLECTED'>('ACTIVE');
  const [selectedPass, setSelectedPass] = useState<any | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/me/deals')
        .then((res) => res.json())
        .then((data) => {
          const loaded = data.participations || data.reservations || data.orders || [];
          setParticipations(loaded);
        })
        .catch((err) => console.error('Failed to load user deals:', err))
        .finally(() => setLoading(false));
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [session, status]);

  const activeReservations = useMemo(
    () => participations.filter((p) => p.status !== 'CANCELLED'),
    [participations]
  );

  const filteredItems = useMemo(() => {
    if (filter === 'ACTIVE') {
      return activeReservations.filter((p) => p.status === 'RESERVED');
    }
    if (filter === 'COLLECTED') {
      return activeReservations.filter((p) => p.status === 'COLLECTED');
    }
    return activeReservations;
  }, [activeReservations, filter]);

  // Order summary metrics
  const totalAdvancePaid = useMemo(
    () => activeReservations.reduce((sum, p) => sum + (p.depositPaid || 0), 0),
    [activeReservations]
  );

  const totalCashDue = useMemo(
    () =>
      activeReservations
        .filter((p) => p.status === 'RESERVED')
        .reduce((sum, p) => sum + (p.balanceDue || Math.max(0, (p.deal?.totalCost || 0) - (p.depositPaid || 0))), 0),
    [activeReservations]
  );

  const totalWholesaleValue = useMemo(
    () => activeReservations.reduce((sum, p) => sum + (p.deal?.totalCost || 0), 0),
    [activeReservations]
  );

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Please Sign In</h2>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Sign in to view and track your reserved group-buying orders and pickup instructions.
        </p>
        <Link
          href="/login?callbackUrl=/my-deals"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header and Summary Cards */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Orders & Grocery Pools</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track your reserved staple quantities, pickup schedules, 30% advance deposits paid, and cash due on pickup.
          </p>
        </div>

        {/* Quick Summary Chips */}
        {activeReservations.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-bold block">Reserved Orders</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{activeReservations.length}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[11px] text-emerald-800 font-bold block">30% Advance Secured</span>
              <span className="text-xl font-black text-emerald-700 mt-0.5 block">
                PKR {totalAdvancePaid.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span className="text-[11px] text-amber-800 font-bold block">Cash Due on Pickup</span>
              <span className="text-xl font-black text-amber-900 mt-0.5 block">
                PKR {totalCashDue.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200">
              <span className="text-[11px] text-purple-800 font-bold block">Wholesale Order Value</span>
              <span className="text-xl font-black text-purple-900 mt-0.5 block">
                PKR {totalWholesaleValue.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      {activeReservations.length > 0 && (
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <span className="text-xs font-bold text-gray-500 mr-2">Filter Orders:</span>
          {(['ACTIVE', 'COLLECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                filter === tab
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab === 'ACTIVE'
                ? `Awaiting Collection (${activeReservations.filter((p) => p.status === 'RESERVED').length})`
                : tab === 'COLLECTED'
                ? `Collected (${activeReservations.filter((p) => p.status === 'COLLECTED').length})`
                : `All Orders (${activeReservations.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Order List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8 space-y-4">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {filter === 'COLLECTED' ? 'No collected orders yet' : 'No orders in this category'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Browse live grocery pools and claim staple goods at wholesale rates.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Explore Live Deals <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredItems.map((item) => {
            const { deal } = item;
            const isCollected = item.status === 'COLLECTED';
            const isNoShow = item.status === 'NO_SHOW';

            return (
              <div
                key={item.participationId}
                className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Product & Deal Info */}
                <div className="flex items-start gap-4">
                  <img
                    src={deal.product?.imageUrl}
                    alt={deal.product?.name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-gray-200"
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {deal.product?.category}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                          isCollected
                            ? 'bg-blue-50 text-blue-800 font-bold'
                            : deal.status === 'OPEN'
                            ? 'bg-amber-50 text-amber-800'
                            : deal.status === 'UNLOCKED'
                            ? 'bg-teal-50 text-teal-800 font-bold'
                            : deal.status === 'FULFILLED'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isCollected ? 'Collected ✓' : `Pool Status: ${deal.status}`}
                      </span>

                      <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                        <QrCode className="w-3 h-3 text-emerald-700" />
                        {getPickupCode(item.participationId)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900">{deal.product?.name}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 font-medium pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {deal.pickupLocation}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        {deal.pickupTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Units, Price & Payment */}
                <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 gap-3">
                  <div className="text-left md:text-right space-y-0.5">
                    <span className="text-xs font-semibold text-slate-700 block">
                      Reserved: <strong className="text-gray-900 font-bold">{formatReservedUnits(item.quantity, deal.product?.unit)}</strong>
                    </span>
                    <span className="text-xs text-slate-600 font-medium block">
                      @ PKR {deal.unitPrice?.toLocaleString()} / unit (Total: PKR {deal.totalCost?.toLocaleString()})
                    </span>
                    {item.depositPaid > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700 block">
                        ✓ 30% Advance Paid: PKR {item.depositPaid.toLocaleString()} (via {item.paymentMethod === 'CARD' ? 'Card' : item.paymentMethod})
                      </span>
                    )}
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-xs font-bold text-amber-700 block flex items-center md:justify-end gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      {isCollected ? 'Collected at Pickup' : 'Remaining Cash on Pickup:'}
                    </span>
                    <span className="text-xl font-black text-gray-900 block">
                      PKR {item.balanceDue ? item.balanceDue.toLocaleString() : (deal.totalCost - (item.depositPaid || 0)).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 self-stretch sm:self-auto justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPass({
                          pickupCode: getPickupCode(item.participationId),
                          participationId: item.participationId,
                          buyerName: session?.user?.name || undefined,
                          buyerPhone: session?.user?.phone || undefined,
                          productName: deal.product?.name,
                          productImage: deal.product?.imageUrl,
                          productCategory: deal.product?.category,
                          units: formatReservedUnits(item.quantity, deal.product?.unit),
                          depositPaid: item.depositPaid || 0,
                          paymentMethod: item.paymentMethod,
                          balanceDue: item.balanceDue || Math.max(0, deal.totalCost - (item.depositPaid || 0)),
                          pickupLocation: deal.pickupLocation,
                          pickupTime: deal.pickupTime,
                          status: item.status,
                        })
                      }
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-950 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                      Pickup Pass & QR
                    </button>

                    {isCollected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Collected
                      </span>
                    ) : isNoShow ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" /> No-Show
                      </span>
                    ) : (
                      <Link
                        href={`/deals/${deal.id}`}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1"
                      >
                        View Pool <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pickup Pass Ticket Modal */}
      <PickupPassModal
        isOpen={!!selectedPass}
        onClose={() => setSelectedPass(null)}
        pass={selectedPass}
      />
    </div>
  );
}
