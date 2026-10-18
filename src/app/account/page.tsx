'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  ShoppingBag,
  ShieldCheck,
  Lock,
  Phone,
  Calendar,
  MapPin,
  Coins,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import WhatsAppShareButton from '@/components/WhatsAppShareButton';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'SETTINGS'>('ORDERS');
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account');
      return;
    }

    if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [profileRes, dealsRes] = await Promise.all([
        fetch('/api/me/profile'),
        fetch('/api/me/deals'),
      ]);

      if (profileRes.ok) {
        const pData = await profileRes.json();
        setProfile(pData);
        setName(pData.user.name || '');
        setPhone(pData.user.phone || '');
      }

      if (dealsRes.ok) {
        const dData = await dealsRes.json();
        setOrders(dData.reservations || []);
      }
    } catch (err) {
      console.error('Failed to load user account data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || 'Failed to update profile');
      } else {
        setProfileSuccess('Profile details updated successfully!');
        if (data.user) {
          setProfile((prev: any) => ({
            ...prev,
            user: { ...prev?.user, ...data.user },
          }));
        }
      }
    } catch {
      setProfileError('An unexpected error occurred. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || 'Failed to change password');
      } else {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordError('An unexpected error occurred while changing password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-6">
        <div className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="h-96 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const activeReservations = orders.filter((o) => o.status !== 'CANCELLED');
  const totalAdvancePaid = activeReservations.reduce((sum, o) => sum + (o.depositPaid || 0), 0);
  const totalWholesaleValue = activeReservations.reduce((sum, o) => sum + (o.deal?.totalCost || 0), 0);
  const estimatedSavings = Math.round(totalWholesaleValue * 0.18);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg border-2 border-white/20">
              {profile?.user?.name ? profile.user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {profile?.user?.name || session?.user?.name || 'Wholly Member'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {profile?.user?.role === 'ADMIN' ? 'Wholly Administrator' : 'Verified Buyer'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-200/90 font-medium">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {profile?.user?.phone || session?.user?.phone}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Member since {profile?.user?.createdAt ? new Date(profile.user.createdAt).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }) : '2026'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white text-emerald-950 hover:bg-emerald-50 shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
              Explore Live Pools
            </Link>
          </div>
        </div>

        {/* Dashboard Stat Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-emerald-200 font-semibold block">Total Orders</span>
            <span className="text-xl font-black text-white mt-0.5 block">{orders.length}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-emerald-200 font-semibold block">Active Pools</span>
            <span className="text-xl font-black text-emerald-300 mt-0.5 block">{activeReservations.length}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-emerald-200 font-semibold block">30% Advance Paid</span>
            <span className="text-xl font-black text-white mt-0.5 block">PKR {totalAdvancePaid.toLocaleString()}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-emerald-200 font-semibold block">Est. Wholesale Savings</span>
            <span className="text-xl font-black text-amber-300 mt-0.5 block flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              PKR {estimatedSavings.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeTab === 'ORDERS'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          My Orders & Reservations ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeTab === 'SETTINGS'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Profile & Security Settings
        </button>
      </div>

      {/* TAB 1: ORDERS & RESERVATIONS */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">No Orders Placed Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Join active staple grocery pools in your neighborhood to unlock wholesale prices with zero retail markup.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              >
                Browse Live Grocery Deals <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {orders.map((item) => {
                const { deal } = item;
                const isCollected = item.status === 'COLLECTED';
                const isNoShow = item.status === 'NO_SHOW';
                const isCancelled = item.status === 'CANCELLED';

                return (
                  <div
                    key={item.participationId}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                  >
                    {/* Left: Product & Pool Status */}
                    <div className="flex items-start gap-4">
                      <img
                        src={deal.product.imageUrl}
                        alt={deal.product.name}
                        className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-100"
                      />

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                            {deal.product.category}
                          </span>

                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                              isCancelled
                                ? 'bg-rose-50 text-rose-700'
                                : isCollected
                                ? 'bg-blue-50 text-blue-700'
                                : deal.status === 'OPEN'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-teal-50 text-teal-800'
                            }`}
                          >
                            Status: {isCancelled ? 'CANCELLED' : isCollected ? 'COLLECTED' : `Pool ${deal.status}`}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-slate-900 leading-tight">
                          {deal.product.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            {deal.pickupLocation}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            {deal.pickupTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quantity, Payment & Actions */}
                    <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 gap-3">
                      <div className="text-left lg:text-right space-y-0.5">
                        <span className="text-xs font-semibold text-slate-600 block">
                          Reserved: <strong className="text-slate-900 font-black">{item.quantity} {deal.product.unit}</strong>
                        </span>

                        <span className="text-xs text-slate-600 font-medium block">
                          Total Value: <strong>PKR {deal.totalCost.toLocaleString()}</strong> (@ PKR {deal.unitPrice.toLocaleString()}/unit)
                        </span>

                        {item.depositPaid > 0 && (
                          <span className="text-[11px] font-bold text-emerald-700 block">
                            ✓ 30% Advance Paid: PKR {item.depositPaid.toLocaleString()} (via {item.paymentMethod === 'CARD' ? 'Card' : item.paymentMethod})
                          </span>
                        )}

                        <div className="pt-1">
                          <span className="text-xs font-bold text-slate-800 flex items-center lg:justify-end gap-1">
                            <Coins className="w-3.5 h-3.5 text-amber-600" />
                            Remaining Cash on Pickup:
                          </span>
                          <span className="text-lg font-black text-slate-900">
                            PKR {item.balanceDue ? item.balanceDue.toLocaleString() : (deal.totalCost - (item.depositPaid || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 self-stretch sm:self-auto justify-end">
                        <Link
                          href={`/deals/${deal.id}`}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1"
                        >
                          View Pool <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROFILE & SECURITY SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Info Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <User className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">Personal Information</h2>
                <p className="text-xs text-slate-500">Update your display name and contact phone number.</p>
              </div>
            </div>

            {profileError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Pakistani Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03211234567"
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Used for SMS pickup notifications & WhatsApp coordination.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Account Role</label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold flex items-center justify-between">
                  <span>{profile?.user?.role === 'ADMIN' ? 'Administrator' : 'Household Buyer'}</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">
                    Active
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-75"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <Lock className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">Security & Password</h2>
                <p className="text-xs text-slate-500">Change your password to keep your account safe.</p>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full p-3 pr-10 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full p-3 pr-10 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors disabled:opacity-75"
                >
                  {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
