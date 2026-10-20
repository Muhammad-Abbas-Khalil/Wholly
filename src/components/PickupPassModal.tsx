'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  Share2,
  MapPin,
  Calendar,
  Coins,
  ShieldCheck,
  Package,
  Sparkles,
} from 'lucide-react';

interface PickupPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  pass: {
    pickupCode: string;
    participationId?: string;
    buyerName?: string;
    buyerPhone?: string;
    productName: string;
    productImage?: string;
    productCategory?: string;
    units: string;
    depositPaid: number;
    paymentMethod?: string;
    balanceDue: number;
    pickupLocation: string;
    pickupTime: string;
    status: string;
  } | null;
}

export default function PickupPassModal({ isOpen, onClose, pass }: PickupPassModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!pass || !isOpen) return;

    // Build verification payload for QR
    const qrPayload = JSON.stringify({
      app: 'Wholly',
      code: pass.pickupCode,
      partId: pass.participationId,
      name: pass.buyerName,
      phone: pass.buyerPhone,
      product: pass.productName,
      units: pass.units,
      due: pass.balanceDue,
    });

    QRCode.toDataURL(qrPayload, {
      width: 280,
      margin: 1,
      color: {
        dark: '#064e3b', // Deep emerald
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [pass, isOpen]);

  if (!isOpen || !pass) return null;

  const isCollected = pass.status === 'COLLECTED';

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pass.pickupCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShareWhatsApp = () => {
    const text =
      `*Wholly Hub Pickup Pass*\n\n` +
      `📦 *Product:* ${pass.productName}\n` +
      `🔢 *Pickup Code:* ${pass.pickupCode}\n` +
      `⚖️ *Units:* ${pass.units}\n` +
      `💵 *Cash Balance Due on Pickup:* PKR ${pass.balanceDue.toLocaleString()}\n` +
      `📍 *Pickup Hub:* ${pass.pickupLocation}\n` +
      `🕒 *Schedule:* ${pass.pickupTime}\n\n` +
      `_Please show this Pickup Code to the Wholly Hub staff at the counter._`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-white/15 text-white">
              <Package className="w-4 h-4" />
            </span>
            <span className="text-xs font-black tracking-widest uppercase opacity-90">
              Wholly Hub Official Pass
            </span>
          </div>

          <h3 className="text-xl font-black mt-2 leading-tight">Order Pickup Ticket</h3>
          <p className="text-[11px] text-emerald-100/90 mt-0.5">
            Present this QR code or pickup code at the counter to claim your goods.
          </p>
        </div>

        {/* Scrollable Pass Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 ${
                isCollected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              {isCollected ? 'Order Collected & Completed' : 'Ready for In-Person Pickup'}
            </span>

            {pass.buyerName && (
              <span className="text-xs font-semibold text-slate-500">
                Buyer: <strong className="text-slate-800">{pass.buyerName}</strong>
              </span>
            )}
          </div>

          {/* QR Code Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 text-center space-y-3">
            <div className="bg-white p-3 rounded-xl inline-block shadow-sm border border-slate-200">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${pass.pickupCode}`}
                  className="w-44 h-44 mx-auto object-contain"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                  Generating QR Code...
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Human-Readable Pickup Code
              </span>
              <div className="inline-flex items-center gap-2 mt-1">
                <span className="font-mono text-2xl font-black tracking-widest text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-300 shadow-2xs">
                  {pass.pickupCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
                  title="Copy pickup code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Ticket Dashed Separator with Cutouts */}
          <div className="relative flex items-center justify-center">
            <div className="border-t-2 border-dashed border-slate-200 w-full" />
            <span className="absolute bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Receipt & Settlement
            </span>
          </div>

          {/* Order Details Breakdown */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Product</span>
              <span className="font-bold text-slate-900 text-right line-clamp-1 max-w-[200px]">
                {pass.productName}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Reserved Quantity</span>
              <span className="font-black text-emerald-800 text-sm">{pass.units}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                30% Advance Secured
              </span>
              <span className="font-bold text-emerald-700">
                PKR {pass.depositPaid.toLocaleString()}
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  ({pass.paymentMethod === 'CARD' ? 'Card' : pass.paymentMethod || 'JazzCash'})
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                Remaining Cash on Pickup:
              </span>
              <span className="font-black text-amber-950 text-base">
                PKR {pass.balanceDue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 100% Secure Advance Guarantee */}
          <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-emerald-900">100% Advance Deposit Security</span>
              <span className="text-emerald-800 leading-tight block mt-0.5">
                Your 30% advance is held safely. If the pool does not unlock by the deadline, your deposit is automatically refunded in full with zero deductions.
              </span>
            </div>
          </div>

          {/* Location & Time Window */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Hub Pickup Location</span>
                <span className="text-slate-600 font-medium">{pass.pickupLocation}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Collection Schedule</span>
                <span className="text-slate-600 font-medium">{pass.pickupTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            Forward Pass via WhatsApp
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl font-bold text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
