'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ProgressBar from '@/components/ProgressBar';
import TierTable from '@/components/TierTable';
import WhatsAppShareButton from '@/components/WhatsAppShareButton';
import {
  Clock,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  Sparkles,
  CreditCard,
  Smartphone,
  Coins,
} from 'lucide-react';
import Link from 'next/link';

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const { data: session } = useSession();

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'JAZZCASH' | 'EASYPAISA' | 'CARD'>('JAZZCASH');
  const [jazzcashNumber, setJazzcashNumber] = useState<string>('0321-1234567');
  const [jazzcashMpin, setJazzcashMpin] = useState<string>('1234');
  const [easypaisaNumber, setEasypaisaNumber] = useState<string>('0345-9876543');
  const [easypaisaPin, setEasypaisaPin] = useState<string>('12345');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('888');
  const [cardName, setCardName] = useState<string>('Abbas Khan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const fetchDealDetail = async () => {
    try {
      const res = await fetch(`/api/deals/${dealId}`);
      if (res.ok) {
        const data = await res.json();
        setDeal(data.deal);
        if (data.deal.userParticipation) {
          setSelectedQuantity(data.deal.userParticipation.quantity);
        }
      }
    } catch (err) {
      console.error('Failed to load deal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealDetail();
    const interval = setInterval(fetchDealDetail, 10000);
    return () => clearInterval(interval);
  }, [dealId]);

  useEffect(() => {
    if (!deal?.deadline) return;
    const updateCountdown = () => {
      const diff = new Date(deal.deadline).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [deal?.deadline]);

  const handleJoin = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/deals/${dealId}`);
      return;
    }

    setIsSubmitting(true);
    setPaymentProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    const totalWholesaleValue = deal.currentPrice * selectedQuantity;
    const advanceDeposit = Math.round(totalWholesaleValue * 0.10);

    try {
      // Simulate realistic gateway authentication delay for demo
      await new Promise((resolve) => setTimeout(resolve, 850));

      const res = await fetch(`/api/deals/${dealId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: selectedQuantity,
          paymentMethod,
          depositPaid: advanceDeposit,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || 'Failed to join deal');
      } else {
        const methodLabel =
          paymentMethod === 'JAZZCASH'
            ? 'JazzCash'
            : paymentMethod === 'EASYPAISA'
            ? 'Easypaisa'
            : 'Credit/Debit Card';
        setActionSuccess(
          `Reserved ${selectedQuantity} unit(s)! 10% Advance Deposit (PKR ${advanceDeposit.toLocaleString()}) confirmed via ${methodLabel}. Remaining 90% is payable in cash on pickup.`
        );
        await fetchDealDetail();
      }
    } catch {
      setActionError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
      setPaymentProcessing(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to cancel your reservation for this deal?')) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/deals/${dealId}/join`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || 'Failed to cancel reservation');
      } else {
        setActionSuccess('Reservation cancelled.');
        await fetchDealDetail();
      }
    } catch {
      setActionError('An error occurred while cancelling.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-96 rounded-3xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-gray-900">Deal not found</h2>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" /> Back to all deals
        </Link>
      </div>
    );
  }

  const isUserJoined = !!deal.userParticipation && deal.userParticipation.status !== 'CANCELLED';
  const isDealOpen = deal.status === 'OPEN';
  const isPastDeadline = new Date() >= new Date(deal.deadline);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Live Deals
        </Link>
      </div>

      {/* Main Deal Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
          {/* Product Image Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative h-72 sm:h-80 w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
              <img
                src={deal.product.imageUrl}
                alt={deal.product.name}
                className="w-full h-full object-cover object-center"
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-gray-800 shadow-xs">
                {deal.product.category}
              </span>
            </div>

            {/* WhatsApp Share Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Invite neighbors to unlock the wholesale price!
              </div>
              <p className="text-[11px] text-emerald-700">
                Every unit claimed helps lower the price for everyone in this pool.
              </p>
              <WhatsAppShareButton
                dealId={deal.id}
                productName={deal.product.name}
                unitsClaimed={deal.unitsClaimed}
                unitsNeeded={deal.unitsToNextTier}
                nextPrice={deal.nextTier?.pricePerUnit}
              />
            </div>
          </div>

          {/* Deal Details Column */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
                  Unit: {deal.product.unit}
                </span>

                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {isDealOpen ? timeLeft : deal.status}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                {deal.product.name}
              </h1>

              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                {deal.product.description || 'Premium household essential pooled for wholesale pricing.'}
              </p>

              {/* Price Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 block">Current Pool Price</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-gray-900">
                      PKR {deal.currentPrice.toLocaleString()}
                    </span>
                    {deal.savings.savingsPerUnit > 0 && (
                      <span className="text-sm font-semibold text-gray-400 line-through">
                        PKR {deal.basePrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {deal.savings.savingsPerUnit > 0 && (
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                      Save {deal.savings.percentage}%
                    </span>
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      -PKR {deal.savings.savingsPerUnit.toLocaleString()} / unit
                    </p>
                  </div>
                )}
              </div>

              {/* Hero Progress Bar */}
              <div className="pt-2">
                <ProgressBar unitsClaimed={deal.unitsClaimed} tiers={deal.tiers} />
              </div>

              {/* Pickup & Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-900 block">Pickup Location</span>
                    <span className="text-slate-700 font-medium">{deal.pickupLocation}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-900 block">Collection Schedule</span>
                    <span className="text-slate-700 font-medium">{deal.pickupTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Participation Box / Action Form */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 border border-rose-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {actionSuccess}
                </div>
              )}

              {isDealOpen && !isPastDeadline ? (
                <div className="space-y-5">
                  {/* Flexible Quantity Stepper & Quick Chips */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 block">
                        Order Quantity ({deal.product.unit})
                      </span>
                      <span className="text-[11px] text-slate-600 font-semibold">
                        {isUserJoined
                          ? `Currently reserved: ${deal.userParticipation.quantity} unit(s)`
                          : 'Order any quantity without artificial limits'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Stepper with +/- */}
                      <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                          className="px-3.5 py-2 text-slate-700 hover:bg-slate-100 font-black text-base border-r border-slate-200 transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={deal.maxPerUser || 100}
                          value={selectedQuantity}
                          onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 py-2 text-center text-slate-900 font-black text-sm outline-none bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                          className="px-3.5 py-2 text-slate-700 hover:bg-slate-100 font-black text-base border-l border-slate-200 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Quick preset chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[1, 2, 5, 10, 20, 50].map((qty) => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => setSelectedQuantity(qty)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              selectedQuantity === qty
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            {qty} {qty === 1 ? 'unit' : 'units'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown & 10% Advance Deposit Card */}
                  {(() => {
                    const totalWholesaleValue = deal.currentPrice * selectedQuantity;
                    const advanceDeposit = Math.round(totalWholesaleValue * 0.10);
                    const remainingBalance = Math.max(0, totalWholesaleValue - advanceDeposit);

                    return (
                      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3.5">
                        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5">
                          <span className="font-bold text-slate-700">Total Wholesale Value:</span>
                          <span className="font-black text-slate-900 text-sm">
                            PKR {totalWholesaleValue.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5">
                          <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            10% Advance Deposit (to secure order):
                          </span>
                          <span className="font-black text-emerald-700 text-sm">
                            PKR {advanceDeposit.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-0.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-amber-600" />
                            Remaining 90% Due at Pickup (Cash):
                          </span>
                          <span className="font-black text-slate-900 text-base">
                            PKR {remainingBalance.toLocaleString()}
                          </span>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-900">
                              Pay 10% Advance Deposit Via:
                            </label>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Simulated Demo Gateway
                            </span>
                          </div>

                          {/* 3 Payment Tabs */}
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('JAZZCASH')}
                              className={`p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                                paymentMethod === 'JAZZCASH'
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <Smartphone className="w-4 h-4 text-red-600" />
                              <span>JazzCash</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPaymentMethod('EASYPAISA')}
                              className={`p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                                paymentMethod === 'EASYPAISA'
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <Smartphone className="w-4 h-4 text-emerald-600" />
                              <span>Easypaisa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPaymentMethod('CARD')}
                              className={`p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                                paymentMethod === 'CARD'
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <CreditCard className="w-4 h-4 text-blue-600" />
                              <span>Card</span>
                            </button>
                          </div>

                          {/* Dummy Interactive Checkout Inputs */}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                            {paymentMethod === 'JAZZCASH' && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                                  <span>JazzCash Account Number</span>
                                  <span className="text-emerald-700 text-[10px] font-bold">✓ Pre-filled test account</span>
                                </div>
                                <input
                                  type="text"
                                  value={jazzcashNumber}
                                  onChange={(e) => setJazzcashNumber(e.target.value)}
                                  placeholder="0321-1234567"
                                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold text-xs outline-none focus:border-emerald-500"
                                />
                                <div className="flex items-center gap-2">
                                  <input
                                    type="password"
                                    maxLength={4}
                                    value={jazzcashMpin}
                                    onChange={(e) => setJazzcashMpin(e.target.value)}
                                    placeholder="MPIN"
                                    className="w-28 p-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-center tracking-widest text-xs outline-none focus:border-emerald-500"
                                  />
                                  <span className="text-[11px] text-slate-500">Demo 4-digit MPIN (Simulated)</span>
                                </div>
                              </div>
                            )}

                            {paymentMethod === 'EASYPAISA' && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                                  <span>Easypaisa Mobile Number</span>
                                  <span className="text-emerald-700 text-[10px] font-bold">✓ Pre-filled test account</span>
                                </div>
                                <input
                                  type="text"
                                  value={easypaisaNumber}
                                  onChange={(e) => setEasypaisaNumber(e.target.value)}
                                  placeholder="0345-9876543"
                                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold text-xs outline-none focus:border-emerald-500"
                                />
                                <div className="flex items-center gap-2">
                                  <input
                                    type="password"
                                    maxLength={5}
                                    value={easypaisaPin}
                                    onChange={(e) => setEasypaisaPin(e.target.value)}
                                    placeholder="PIN"
                                    className="w-28 p-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-center tracking-widest text-xs outline-none focus:border-emerald-500"
                                  />
                                  <span className="text-[11px] text-slate-500">Demo 5-digit PIN (Simulated)</span>
                                </div>
                              </div>
                            )}

                            {paymentMethod === 'CARD' && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                                  <span>Credit / Debit Card</span>
                                  <span className="text-emerald-700 text-[10px] font-bold">✓ Pre-filled test card</span>
                                </div>
                                <input
                                  type="text"
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value)}
                                  placeholder="4242 •••• •••• 4242"
                                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono font-semibold text-xs outline-none focus:border-emerald-500"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    value={cardExpiry}
                                    onChange={(e) => setCardExpiry(e.target.value)}
                                    placeholder="MM/YY"
                                    className="p-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-center text-xs outline-none focus:border-emerald-500"
                                  />
                                  <input
                                    type="password"
                                    maxLength={4}
                                    value={cardCvc}
                                    onChange={(e) => setCardCvc(e.target.value)}
                                    placeholder="CVC"
                                    className="p-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-center text-xs outline-none focus:border-emerald-500"
                                  />
                                  <input
                                    type="text"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    placeholder="Cardholder"
                                    className="p-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs font-semibold outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <p className="text-[10px] text-slate-500">
                                  Accepts Visa, Mastercard, UnionPay & PayPak. Demo simulated flow.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Advance Commitment Guarantee Notice */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-950 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      Advance Commitment Guarantee:
                    </span>
                    <p className="text-emerald-800 leading-relaxed font-medium">
                      Your 10% advance deposit secures bulk inventory with local wholesale millers and suppliers. The remaining 90% is payable in cash when you inspect and collect your items at pickup. Once group wholesale tiers are unlocked, orders are committed to protect wholesale rates for all neighbors.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleJoin}
                      disabled={isSubmitting || paymentProcessing}
                      className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-75 disabled:hover:scale-100"
                    >
                      {paymentProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>
                            Processing 10% Advance ({paymentMethod === 'CARD' ? 'Card' : paymentMethod})...
                          </span>
                        </>
                      ) : isSubmitting ? (
                        'Reserving...'
                      ) : isUserJoined ? (
                        `Update to ${selectedQuantity} Unit(s)`
                      ) : (
                        `Pay 10% Deposit (PKR ${Math.round(deal.currentPrice * selectedQuantity * 0.10).toLocaleString()}) & Reserve`
                      )}
                    </button>

                    {isUserJoined && (
                      deal.unitsClaimed >= (deal.tiers[0]?.minUnits ?? 1) ? (
                        <span
                          className="py-3.5 px-4 rounded-2xl font-bold text-xs bg-slate-200 text-slate-600 cursor-not-allowed border border-slate-300 text-center"
                          title="Cancellation is locked because group wholesale tier is unlocked."
                        >
                          🔒 Orders Locked
                        </span>
                      ) : (
                        <button
                          onClick={handleLeave}
                          disabled={isSubmitting || paymentProcessing}
                          className="py-3.5 px-4 rounded-2xl font-bold text-sm text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                          title="Cancel reservation"
                        >
                          Cancel
                        </button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-xs font-semibold text-gray-500">
                  {deal.status === 'UNLOCKED' && '🎉 This deal reached the wholesale target and is locked for fulfillment!'}
                  {deal.status === 'FULFILLED' && '✅ This deal has been completed.'}
                  {deal.status === 'FAILED' && '❌ This deal did not meet the minimum unit threshold.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tiers Table Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-gray-900">Wholesale Price Tiers</h2>
          <p className="text-xs text-gray-500">
            Everyone pays the price of the highest tier reached when the pool closes.
          </p>
        </div>
        <TierTable tiers={deal.tiers} unitsClaimed={deal.unitsClaimed} unitLabel={deal.product.unit} />
      </div>

      {/* Participant Roster Section */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Pool Participants ({deal.participantCount})
          </h2>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {deal.unitsClaimed} total units pledged
          </span>
        </div>

        {deal.participations.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">
            Be the first person to join this deal and kick off the group pool!
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {deal.participations.map((p: any, idx: number) => (
              <div
                key={p.id || idx}
                className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-gray-900 block">{p.userName || p.user?.name}</span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(p.joinedAt).toLocaleDateString()}
                  </span>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-lg">
                  {p.quantity} {p.quantity === 1 ? 'unit' : 'units'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
