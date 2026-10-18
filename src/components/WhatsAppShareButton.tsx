'use client';

import React, { useState } from 'react';
import { Share2, Check, MessageCircle } from 'lucide-react';

interface WhatsAppShareButtonProps {
  productName: string;
  unitsClaimed: number;
  unitsNeeded: number;
  nextPrice?: number;
  dealId: string;
}

export default function WhatsAppShareButton({
  productName,
  unitsClaimed,
  unitsNeeded,
  nextPrice,
  dealId,
}: WhatsAppShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/deals/${dealId}`;
  };

  const getShareMessage = () => {
    const url = getShareUrl();
    if (unitsNeeded > 0 && nextPrice) {
      return `🛒 *Wholly Group Deal:* Pool with me to buy *${productName}* at wholesale price!\n\n` +
        `📦 *${unitsClaimed} units* already joined. Only *${unitsNeeded} more units needed* to unlock PKR ${nextPrice.toLocaleString()} per unit!\n\n` +
        `Join before the deadline here: ${url}`;
    }
    return `🛒 *Wholly Group Deal:* Great savings on *${productName}*! Pool with us to get bulk wholesale prices.\n\n` +
      `Check details & join here: ${url}`;
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleWhatsAppShare}
        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20 transition-all hover:scale-[1.02]"
      >
        <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
        Share on WhatsApp
      </button>

      <button
        onClick={handleCopyLink}
        className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors flex items-center justify-center"
        title="Copy Link"
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-600" />
        ) : (
          <Share2 className="w-4 h-4 text-gray-500" />
        )}
      </button>
    </div>
  );
}
