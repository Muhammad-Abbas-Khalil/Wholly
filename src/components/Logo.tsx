import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export default function Logo({ className = '', size = 'md', showTagline = false }: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Sleek Vector Brandmark: Community Cart & Wholesale Pool */}
      <div className={`relative ${iconSizes[size]} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Subtle gradient definitions */}
          <defs>
            <linearGradient id="whollyGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="whollyAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Rounded Modern Bag / Pool Container */}
          <rect
            x="4"
            y="10"
            width="36"
            height="30"
            rx="10"
            fill="url(#whollyGreenGrad)"
          />

          {/* Minimalist Cart/Bag Curved Handle */}
          <path
            d="M15 11V8C15 5.23858 17.2386 3 20 3H24C26.7614 3 29 5.23858 29 8V11"
            stroke="#047857"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M16 11V8C16 5.79086 17.7909 4 20 4H24C26.2091 4 28 5.79086 28 8V11"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Community Group Nodes (Pool Buying Representation in Amber) */}
          {/* Left member */}
          <circle cx="15.5" cy="22" r="3.2" fill="url(#whollyAmberGrad)" />
          {/* Center leader / peak */}
          <circle cx="22" cy="18.5" r="3.8" fill="url(#whollyAmberGrad)" />
          {/* Right member */}
          <circle cx="28.5" cy="22" r="3.2" fill="url(#whollyAmberGrad)" />

          {/* Connecting Community Pool Arc / Smile */}
          <path
            d="M12.5 28.5C15 32 29 32 31.5 28.5"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Wholesale Sparkle Accent */}
          <path
            d="M34 9L35.2 12.2L38.4 13.4L35.2 14.6L34 17.8L32.8 14.6L29.6 13.4L32.8 12.2L34 9Z"
            fill="#FBBF24"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span className={`font-black ${textSizes[size]} tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors`}>
            Wholl
          </span>
          <span className={`font-black ${textSizes[size]} tracking-tight text-emerald-600`}>
            y
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-0.5 mb-1 animate-pulse" />
        </div>
        {showTagline && (
          <span className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mt-0.5">
            Buy Together, Pay Wholesale
          </span>
        )}
      </div>
    </div>
  );
}
