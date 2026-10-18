'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function MyDealsPage() {
  const { data: session, status } = useSession();
  const [participations, setParticipations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/me/deals')
        .then((res) => res.json())
        .then((data) => {
          setParticipations(data.participations || []);
        })
        .catch((err) => console.error('Failed to load user deals:', err))
        .finally(() => setLoading(false));
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [session, status]);

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
        <ShoppingBag className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900">Please Log In</h2>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Sign in to view and track your reserved group-buying orders.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const activeReservations = participations.filter((p) => p.status !== 'CANCELLED');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">My Orders & Deals</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Track your pooled units, pickup locations, and total wholesale payment due on collection.
        </p>
      </div>

      {activeReservations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8 space-y-4">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-gray-900">You haven't joined any deals yet</h3>
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
          {activeReservations.map((item) => {
            const { deal } = item;
            const isCollected = item.status === 'COLLECTED';
            const isNoShow = item.status === 'NO_SHOW';

            return (
              <div
                key={item.participationId}
                className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Product & Deal Info */}
                <div className="flex items-start gap-4">
                  <img
                    src={deal.product.imageUrl}
                    alt={deal.product.name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-gray-100"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {deal.product.category}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          deal.status === 'OPEN'
                            ? 'bg-amber-50 text-amber-800'
                            : deal.status === 'UNLOCKED'
                            ? 'bg-teal-50 text-teal-800 font-bold'
                            : deal.status === 'FULFILLED'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Pool: {deal.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900">{deal.product.name}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {deal.pickupLocation}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        {deal.pickupTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Units, Price & Payment */}
                <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 gap-2">
                  <div className="text-left md:text-right">
                    <span className="text-xs font-semibold text-gray-500 block">
                      Reserved: <strong className="text-gray-900 font-bold">{item.quantity} {deal.product.unit}</strong>
                    </span>
                    <span className="text-xs text-gray-400">
                      @ PKR {deal.unitPrice.toLocaleString()} / unit
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-700 block flex items-center gap-1 justify-end">
                      <Coins className="w-3.5 h-3.5 text-emerald-600" /> Cash on Pickup
                    </span>
                    <span className="text-xl font-black text-gray-900">
                      PKR {deal.totalCost.toLocaleString()}
                    </span>
                  </div>

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
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      View Pool <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
