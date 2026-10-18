'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Phone, Lock, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        phone,
        password,
      });

      if (res?.error) {
        setError('Invalid phone number or password');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (demoPhone: string, redirectPath?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        phone: demoPhone,
        password: 'password123',
      });

      if (res?.error) {
        setError('Demo login failed. Make sure database is seeded.');
      } else {
        router.push(redirectPath || callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Failed to login with demo credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200/90 shadow-xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-700/20">
          W
        </div>
        <h1 className="text-2xl font-black text-gray-900">Welcome to Wholly</h1>
        <p className="text-xs text-gray-500">
          Sign in with your phone number to join bulk staple orders.
        </p>
      </div>

      {/* 1-Click Demo Login Box for Portfolio Reviewers */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Quick Demo Logins (Portfolio Review)
        </div>
        <p className="text-[11px] text-emerald-700 leading-tight">
          Click either button below to test without typing credentials:
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleDemoSignIn('03211112233', '/')}
            disabled={loading}
            className="py-2 px-3 rounded-xl bg-white shadow-xs border border-emerald-200 hover:border-emerald-300 text-emerald-800 font-bold text-xs transition-colors text-center"
          >
            Test Buyer (Hamza)
          </button>
          <button
            type="button"
            onClick={() => handleDemoSignIn('03001234567', '/admin')}
            disabled={loading}
            className="py-2 px-3 rounded-xl bg-white shadow-xs border border-purple-200 hover:border-purple-300 text-purple-800 font-bold text-xs transition-colors text-center"
          >
            Test Admin (Abbas)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03001234567"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-emerald-600 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-emerald-600 font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Signing in...' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
        Don't have an account?{' '}
        <Link href="/register" className="font-bold text-emerald-600 hover:underline">
          Register now
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="w-full max-w-md h-96 bg-gray-100 rounded-3xl animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
