'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProgressBar from '@/components/ProgressBar';
import { MapPin, Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface DealCardProps {
  deal: {
    id: string;
    status: 'OPEN' | 'UNLOCKED' | 'FAILED' | 'FULFILLED';
    deadline: string;
    pickupLocation: string;
    pickupTime: string;
    maxPerUser: number;
    product: {
      name: string;
      description?: string | null;
      imageUrl: string;
      unit: string;
      category: string;
    };
    tiers: { minUnits: number; pricePerUnit: number }[];
    unitsClaimed: number;
    participantCount: number;
    currentPrice: number;
    basePrice: number;
    savings: { savingsPerUnit: number; percentage: number };
    progress: number;
  };
}

export default function DealCard({ deal }: DealCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const diff = new Date(deal.deadline).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m left`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [deal.deadline]);

  const statusConfig = {
    OPEN: {
      label: 'Open Pool',
      className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    UNLOCKED: {
      label: 'Goal Met / Unlocked',
      className: 'bg-teal-50 text-teal-800 border-teal-200',
    },
    FULFILLED: {
      label: 'Fulfilled',
      className: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    FAILED: {
      label: 'Missed Threshold',
      className: 'bg-gray-100 text-gray-700 border-gray-300',
    },
  };

  const statusInfo = statusConfig[deal.status] || statusConfig.OPEN;

  return (
    <div className="group flex flex-col bg-white rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-xl hover:border-emerald-200 transition-all duration-300 overflow-hidden">
      {/* Product Image & Badges */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-100">
        <img
          src={deal.product.imageUrl}
          alt={deal.product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-gray-800 shadow-xs">
            {deal.product.category}
          </span>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Countdown Badge on Image bottom */}
        {deal.status === 'OPEN' && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {timeLeft || 'Ending soon'}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {deal.product.name}
            </h3>
          </div>
          <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 inline-block px-2 py-0.5 rounded-md mt-1">
            Unit: {deal.product.unit}
          </p>

          {/* Pricing Highlight */}
          <div className="mt-3.5 flex items-baseline gap-2.5">
            <span className="text-2xl font-black text-gray-900">
              PKR {deal.currentPrice.toLocaleString()}
            </span>

            {deal.savings.savingsPerUnit > 0 && (
              <>
                <span className="text-sm font-semibold text-gray-400 line-through">
                  PKR {deal.basePrice.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Save {deal.savings.percentage}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Live Progress Bar Component */}
        <div className="pt-1">
          <ProgressBar unitsClaimed={deal.unitsClaimed} tiers={deal.tiers} />
        </div>

        {/* Pickup spot preview */}
        <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 flex items-start gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{deal.pickupLocation}</span>
        </div>

        {/* CTA Button */}
        <Link
          href={`/deals/${deal.id}`}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm bg-gray-900 hover:bg-emerald-600 text-white shadow-xs group-hover:shadow-md group-hover:shadow-emerald-600/20 transition-all duration-200"
        >
          {deal.status === 'OPEN' ? 'Join Deal & Pool Order' : 'View Deal Details'}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
