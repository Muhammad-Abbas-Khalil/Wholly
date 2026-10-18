'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { ShoppingBag, Users, ShieldCheck, LogIn, LogOut, Sparkles, User } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isDemoLoggingIn, setIsDemoLoggingIn] = useState(false);

  const handleDemoLogin = async (role: 'BUYER' | 'ADMIN') => {
    setIsDemoLoggingIn(true);
    try {
      if (role === 'ADMIN') {
        await signIn('credentials', {
          phone: '03001234567',
          password: 'password123',
          callbackUrl: '/admin',
        });
      } else {
        await signIn('credentials', {
          phone: '03211112233',
          password: 'password123',
          callbackUrl: '/',
        });
      }
    } finally {
      setIsDemoLoggingIn(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-6 sm:gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/logo.png"
                alt="Wholly - Buy Together, Pay Wholesale"
                className="h-10 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                PK
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  pathname === '/'
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Live Deals
              </Link>

              {session?.user && (
                <>
                  <Link
                    href="/my-deals"
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      pathname === '/my-deals'
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    My Deals
                  </Link>

                  <Link
                    href="/account"
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      pathname === '/account'
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    My Account
                  </Link>
                </>
              )}

              {session?.user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    pathname.startsWith('/admin')
                      ? 'text-purple-700 bg-purple-50'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Admin Portal
                </Link>
              )}
            </nav>
          </div>

          {/* Right actions: Demo pills & Auth */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Login Pills for Evaluators */}
            {!session?.user && (
              <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
                <span className="px-2 text-slate-700 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Demo:
                </span>
                <button
                  onClick={() => handleDemoLogin('BUYER')}
                  disabled={isDemoLoggingIn}
                  className="px-2.5 py-1 rounded-lg bg-white shadow-xs text-slate-900 hover:text-emerald-700 hover:bg-emerald-50 font-bold transition-colors border border-slate-200"
                >
                  Buyer
                </button>
                <button
                  onClick={() => handleDemoLogin('ADMIN')}
                  disabled={isDemoLoggingIn}
                  className="px-2.5 py-1 rounded-lg bg-white shadow-xs text-purple-900 hover:bg-purple-50 font-bold transition-colors border border-slate-200"
                >
                  Admin
                </button>
              </div>
            )}

            {status === 'loading' ? (
              <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />
            ) : session?.user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="md:hidden px-2.5 py-1 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}
                <Link
                  href="/account"
                  className="text-right px-2.5 py-1 rounded-xl hover:bg-slate-100 transition-colors group"
                  title="View Account & Profile"
                >
                  <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-700 leading-tight">
                    {session.user.name || 'User'}
                  </p>
                  <p className="text-[11px] font-medium text-gray-500">
                    {session.user.role === 'ADMIN' ? (
                      <span className="text-purple-600 font-bold">Admin Portal</span>
                    ) : (
                      session.user.phone
                    )}
                  </p>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-2 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-700/20 transition-all hover:scale-[1.02]"
                >
                  Join Wholly
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
