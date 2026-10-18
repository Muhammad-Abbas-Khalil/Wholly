'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ShieldCheck,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Users,
  Coins,
  Package,
  Clock,
  RefreshCw,
  Play,
  ArrowRight,
  Search,
  Phone,
  User,
  CreditCard,
  Smartphone,
  Banknote,
  TrendingUp,
  MapPin,
  Calendar,
  XCircle,
  RotateCcw,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [deals, setDeals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ROSTERS' | 'ALL_ORDERS' | 'MANAGEMENT'>('ROSTERS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'FULFILLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);

  // Modals & form state
  const [isCreatingDeal, setIsCreatingDeal] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // New Deal Form State
  const [dealForm, setDealForm] = useState({
    productId: '',
    deadline: '',
    pickupLocation: 'Wholly Hub @ Community Center, Block D, Model Town, Lahore',
    pickupTime: 'Saturday 4:00 PM - 7:00 PM',
    maxPerUser: 50,
    tokenPerUnit: 150,
    tiers: [
      { minUnits: 1, pricePerUnit: 3000, supplierCostPerUnit: 2600 },
      { minUnits: 10, pricePerUnit: 2850, supplierCostPerUnit: 2550 },
      { minUnits: 20, pricePerUnit: 2700, supplierCostPerUnit: 2500 },
    ],
  });

  // New Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    unit: '',
    category: 'Cooking Oil',
    imageUrl: '',
  });

  const fetchData = async () => {
    try {
      const [dealsRes, productsRes] = await Promise.all([
        fetch('/api/deals'),
        fetch('/api/products'),
      ]);

      if (dealsRes.ok) {
        const d = await dealsRes.json();
        setDeals(d.deals || []);
      }
      if (productsRes.ok) {
        const p = await productsRes.json();
        setProducts(p.products || []);
        if (p.products?.length > 0 && !dealForm.productId) {
          setDealForm((prev) => ({ ...prev, productId: p.products[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchData();
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [session, status]);

  const handleRunCron = async () => {
    setIsCronRunning(true);
    setCronMessage(null);
    try {
      const res = await fetch('/api/cron/close-deals');
      const data = await res.json();
      if (res.ok) {
        setCronMessage(`Cron finished: ${data.message} (${data.summary?.unlocked ?? 0} unlocked, ${data.summary?.failed ?? 0} failed)`);
        await fetchData();
      } else {
        setCronMessage(`Cron error: ${data.error}`);
      }
    } catch {
      setCronMessage('Failed to trigger cron');
    } finally {
      setIsCronRunning(false);
    }
  };

  const handleMarkFulfilled = async (dealId: string) => {
    if (!confirm('Mark this entire deal as fulfilled and ready for collection?')) return;
    setActionLoadingId(`deal-${dealId}`);
    try {
      const res = await fetch(`/api/admin/deals/${dealId}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_FULFILLED' }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateParticipant = async (dealId: string, participationId: string, newStatus: string) => {
    setActionLoadingId(`part-${participationId}`);
    try {
      const res = await fetch(`/api/admin/deals/${dealId}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PARTICIPANT',
          participationId,
          newStatus,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });
      if (res.ok) {
        setIsCreatingProduct(false);
        setProductForm({ name: '', description: '', unit: '', category: 'Cooking Oil', imageUrl: '' });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealForm),
      });
      if (res.ok) {
        setIsCreatingDeal(false);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Executive Platform Calculations
  const stats = useMemo(() => {
    let totalGMV = 0;
    let totalDepositsPaid = 0;
    let totalCashToCollect = 0;
    let totalPlatformProfit = 0;
    let totalUnitsClaimed = 0;
    const uniqueUserIds = new Set<string>();

    deals.forEach((deal) => {
      totalGMV += (deal.currentPrice || 0) * (deal.unitsClaimed || 0);
      const supplierCost = deal.currentTier?.supplierCostPerUnit || 0;
      const marginPerUnit = Math.max(0, (deal.currentPrice || 0) - supplierCost);
      totalPlatformProfit += marginPerUnit * (deal.unitsClaimed || 0);
      totalUnitsClaimed += deal.unitsClaimed || 0;

      if (Array.isArray(deal.participations)) {
        deal.participations.forEach((p: any) => {
          if (p.status !== 'CANCELLED') {
            uniqueUserIds.add(p.userId);
            const dep = p.depositPaid || 0;
            totalDepositsPaid += dep;
            const fullVal = (deal.currentPrice || 0) * (p.quantity || 0);
            totalCashToCollect += Math.max(0, fullVal - dep);
          }
        });
      }
    });

    const activePoolsCount = deals.filter((d) => d.status === 'OPEN').length;

    return {
      activePoolsCount,
      totalGMV,
      totalDepositsPaid,
      totalCashToCollect,
      totalPlatformProfit,
      totalUnitsClaimed,
      totalUniqueBuyers: uniqueUserIds.size,
    };
  }, [deals]);

  // Flattened Master Orders List across all deals
  const allMasterOrders = useMemo(() => {
    const orders: any[] = [];
    deals.forEach((deal) => {
      if (Array.isArray(deal.participations)) {
        deal.participations.forEach((p: any) => {
          const totalVal = (deal.currentPrice || 0) * (p.quantity || 0);
          const dep = p.depositPaid || 0;
          const balance = Math.max(0, totalVal - dep);

          orders.push({
            dealId: deal.id,
            dealStatus: deal.status,
            productName: deal.product?.name || 'Wholesale Staple',
            productCategory: deal.product?.category || '',
            productImage: deal.product?.imageUrl || '',
            productUnit: deal.product?.unit || 'unit',
            unitPrice: deal.currentPrice || 0,
            participationId: p.id,
            buyerId: p.userId,
            buyerName: p.user?.name || 'Anonymous Buyer',
            buyerPhone: p.user?.phone || 'No phone',
            quantity: p.quantity,
            totalValue: totalVal,
            depositPaid: dep,
            cashDue: balance,
            paymentMethod: p.paymentMethod || 'JAZZCASH',
            status: p.status,
            joinedAt: p.joinedAt,
            pickupLocation: deal.pickupLocation,
            pickupTime: deal.pickupTime,
          });
        });
      }
    });
    // Sort recent first
    return orders.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
  }, [deals]);

  // Filtered deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (statusFilter !== 'ALL' && deal.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchProduct = deal.product?.name?.toLowerCase().includes(q);
      const matchCategory = deal.product?.category?.toLowerCase().includes(q);
      const matchParticipant = deal.participations?.some(
        (p: any) =>
          p.user?.name?.toLowerCase().includes(q) ||
          p.user?.phone?.toLowerCase().includes(q)
      );

      return matchProduct || matchCategory || matchParticipant;
    });
  }, [deals, statusFilter, searchQuery]);

  // Filtered master orders
  const filteredMasterOrders = useMemo(() => {
    if (!searchQuery.trim()) return allMasterOrders;
    const q = searchQuery.toLowerCase();
    return allMasterOrders.filter(
      (o) =>
        o.buyerName.toLowerCase().includes(q) ||
        o.buyerPhone.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
    );
  }, [allMasterOrders, searchQuery]);

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-6">
        <div className="h-28 rounded-3xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-3xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Administrator Access Required</h2>
        <p className="text-xs text-gray-500">
          You must be logged in with Administrator privileges to access the Wholly Operations Center.
        </p>
        <Link
          href="/login?callbackUrl=/admin"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-700/20"
        >
          Login as Administrator
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Operations Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                Wholly Operations Command Center
              </span>
              <span className="text-xs text-slate-400">• Logged in as: {session?.user?.name || 'Administrator'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Wholesale Logistics & Fulfillment Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Track live community pools, inspect buyer fulfillment rosters, verify 30% advance deposits, and collect in-person cash on pickup.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCreatingProduct(true)}
              className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 backdrop-blur-xs transition-colors"
            >
              <Package className="w-4 h-4 text-purple-300" />
              + Add Product
            </button>

            <button
              onClick={() => setIsCreatingDeal(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              + Launch Pool
            </button>

            <button
              onClick={handleRunCron}
              disabled={isCronRunning}
              className="px-4 py-2.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Runs scheduled route /api/cron/close-deals"
            >
              <Play className={`w-3.5 h-3.5 ${isCronRunning ? 'animate-spin' : ''}`} />
              Run Deal Closer Cron
            </button>

            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-slate-300 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Executive KPI Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-purple-200 font-semibold block">Active Pools</span>
            <span className="text-xl font-black text-white mt-0.5 block">{stats.activePoolsCount}</span>
            <span className="text-[10px] text-purple-300 mt-1 block">Live in Lahore</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-purple-200 font-semibold block">Total Claimed Units</span>
            <span className="text-xl font-black text-emerald-300 mt-0.5 block">{stats.totalUnitsClaimed}</span>
            <span className="text-[10px] text-emerald-400 mt-1 block">Across all pools</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-purple-200 font-semibold block">Wholesale GMV</span>
            <span className="text-xl font-black text-white mt-0.5 block">PKR {stats.totalGMV.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Gross order value</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-purple-200 font-semibold block">30% Deposits Paid</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">PKR {stats.totalDepositsPaid.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-300 mt-1 block">In JazzCash / Card</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-amber-200 font-semibold block">Cash Due on Pickup</span>
            <span className="text-xl font-black text-amber-300 mt-0.5 block">PKR {stats.totalCashToCollect.toLocaleString()}</span>
            <span className="text-[10px] text-amber-400 mt-1 block">To collect at hub</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-purple-200 font-semibold block">Platform Profit</span>
            <span className="text-xl font-black text-purple-300 mt-0.5 block">PKR {stats.totalPlatformProfit.toLocaleString()}</span>
            <span className="text-[10px] text-purple-300 mt-1 block">Wholly net margin</span>
          </div>
        </div>
      </div>

      {cronMessage && (
        <div className="p-4 rounded-2xl bg-purple-50 text-purple-900 text-xs font-semibold border border-purple-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0 text-purple-600" />
            <span>{cronMessage}</span>
          </div>
          <button onClick={() => setCronMessage(null)} className="text-purple-600 hover:text-purple-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ROSTERS')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'ROSTERS'
                ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            Pools & Pickup Rosters ({deals.length})
          </button>

          <button
            onClick={() => setActiveTab('ALL_ORDERS')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'ALL_ORDERS'
                ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Master Orders Ledger ({allMasterOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('MANAGEMENT')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'MANAGEMENT'
                ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Create Pool & Product
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search buyer, phone, product..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-purple-600 font-medium"
          />
        </div>
      </div>

      {/* TAB 1: POOLS & BUYER COLLECTION ROSTER */}
      {activeTab === 'ROSTERS' && (
        <div className="space-y-6">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Filter Pools:</span>
            {(['ALL', 'OPEN', 'FULFILLED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Pools' : st === 'OPEN' ? 'Active / Open' : 'Fulfilled'}
              </button>
            ))}
          </div>

          {filteredDeals.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No matching deals found</h3>
              <p className="text-xs text-slate-500">Try adjusting your search query or status filter.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredDeals.map((deal) => {
                const participants: any[] = deal.participations || [];
                const activeParticipants = participants.filter((p) => p.status !== 'CANCELLED');
                const collectedCount = activeParticipants.filter((p) => p.status === 'COLLECTED').length;
                const totalDealValue = (deal.currentPrice || 0) * (deal.unitsClaimed || 0);
                const totalAdvanceCollected = activeParticipants.reduce((sum, p) => sum + (p.depositPaid || 0), 0);
                const totalCashDue = Math.max(0, totalDealValue - totalAdvanceCollected);
                const supplierCost = deal.currentTier?.supplierCostPerUnit || 0;
                const platformProfit = Math.max(0, (deal.currentPrice - supplierCost) * deal.unitsClaimed);
                const isExpanded = expandedDealId === deal.id || searchQuery.trim().length > 0;

                return (
                  <div
                    key={deal.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Deal Header Card */}
                    <div className="p-6 bg-slate-50/50 border-b border-slate-200/80">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <img
                            src={deal.product?.imageUrl}
                            alt={deal.product?.name}
                            className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-200"
                          />
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                                {deal.product?.category}
                              </span>
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                                  deal.status === 'OPEN'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : deal.status === 'FULFILLED'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                Status: {deal.status}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                Deadline: {new Date(deal.deadline).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <h3 className="text-lg font-black text-slate-900 leading-tight">
                              {deal.product?.name}
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

                        {/* Top Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
                          {deal.status !== 'FULFILLED' && (
                            <button
                              onClick={() => handleMarkFulfilled(deal.id)}
                              disabled={actionLoadingId === `deal-${deal.id}`}
                              className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Mark Pool Fulfilled
                            </button>
                          )}

                          <Link
                            href={`/deals/${deal.id}`}
                            target="_blank"
                            className="px-3.5 py-2 rounded-xl font-bold text-xs border border-slate-300 hover:bg-white text-slate-700 flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View Buyer Page
                          </Link>

                          <button
                            onClick={() => setExpandedDealId(isExpanded ? null : deal.id)}
                            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-purple-50 text-purple-800 hover:bg-purple-100 flex items-center gap-1 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                Hide Roster <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                View Roster ({activeParticipants.length}) <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Deal Economics Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 mt-4 border-t border-slate-200/80 text-xs">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold block">Wholesale Rate</span>
                          <span className="text-sm font-black text-slate-900 mt-0.5 block">
                            PKR {deal.currentPrice?.toLocaleString()} / unit
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold block">Units Reserved</span>
                          <span className="text-sm font-black text-emerald-700 mt-0.5 block">
                            {deal.unitsClaimed} {deal.product?.unit} ({activeParticipants.length} buyers)
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold block">30% Advance Secured</span>
                          <span className="text-sm font-black text-emerald-800 mt-0.5 block">
                            PKR {totalAdvanceCollected.toLocaleString()}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                          <span className="text-[10px] text-amber-700 font-bold block">Remaining Cash on Pickup</span>
                          <span className="text-sm font-black text-amber-900 mt-0.5 block">
                            PKR {totalCashDue.toLocaleString()}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200">
                          <span className="text-[10px] text-purple-700 font-bold block">Wholly Net Profit</span>
                          <span className="text-sm font-black text-purple-950 mt-0.5 block">
                            PKR {platformProfit.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Buyer Fulfillment Checklist Roster Table */}
                    {isExpanded && (
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <Users className="w-4 h-4 text-purple-700" />
                              Buyer Collection Roster & Cash Register
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Verify each buyer's 30% advance deposit, collect the remaining cash, and mark them collected as they arrive.
                            </p>
                          </div>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                            Collected: {collectedCount} / {activeParticipants.length}
                          </span>
                        </div>

                        {activeParticipants.length === 0 ? (
                          <div className="text-center py-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                            <p className="text-xs text-slate-500 font-medium">No buyers have joined this pool yet.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                                <tr>
                                  <th className="py-3 px-4">Buyer Details</th>
                                  <th className="py-3 px-4">Reserved Qty</th>
                                  <th className="py-3 px-4">30% Advance Paid</th>
                                  <th className="py-3 px-4">Cash Due on Pickup</th>
                                  <th className="py-3 px-4">Order Status</th>
                                  <th className="py-3 px-4 text-right">Counter Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {activeParticipants.map((p) => {
                                  const totalVal = (deal.currentPrice || 0) * (p.quantity || 0);
                                  const dep = p.depositPaid || 0;
                                  const cashDue = Math.max(0, totalVal - dep);
                                  const isCollected = p.status === 'COLLECTED';
                                  const isNoShow = p.status === 'NO_SHOW';
                                  const isReserved = p.status === 'RESERVED';
                                  const isActing = actionLoadingId === `part-${p.id}`;

                                  return (
                                    <tr
                                      key={p.id}
                                      className={`transition-colors ${
                                        isCollected
                                          ? 'bg-emerald-50/40'
                                          : isNoShow
                                          ? 'bg-rose-50/40'
                                          : 'hover:bg-slate-50/70'
                                      }`}
                                    >
                                      {/* Buyer Details */}
                                      <td className="py-3.5 px-4">
                                        <div className="font-bold text-slate-900 text-sm">
                                          {p.user?.name || 'Customer'}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                                          <Phone className="w-3 h-3 text-purple-600" />
                                          <a href={`tel:${p.user?.phone}`} className="hover:text-purple-700 hover:underline">
                                            {p.user?.phone}
                                          </a>
                                        </div>
                                      </td>

                                      {/* Units */}
                                      <td className="py-3.5 px-4 font-black text-slate-900">
                                        {p.quantity} {deal.product?.unit}
                                        <span className="block text-[10px] text-slate-500 font-normal">
                                          Total: PKR {totalVal.toLocaleString()}
                                        </span>
                                      </td>

                                      {/* 30% Advance Deposit */}
                                      <td className="py-3.5 px-4">
                                        <span className="font-bold text-emerald-700 block">
                                          PKR {dep.toLocaleString()}
                                        </span>
                                        <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                          {p.paymentMethod === 'CARD' ? 'Card' : p.paymentMethod || 'JazzCash'}
                                        </span>
                                      </td>

                                      {/* Cash Due on Pickup */}
                                      <td className="py-3.5 px-4">
                                        <span className="inline-flex items-center gap-1 font-black text-amber-950 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/80 text-xs">
                                          <Coins className="w-3.5 h-3.5 text-amber-600" />
                                          PKR {cashDue.toLocaleString()}
                                        </span>
                                      </td>

                                      {/* Status */}
                                      <td className="py-3.5 px-4">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                            isCollected
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : isNoShow
                                              ? 'bg-rose-100 text-rose-800'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}
                                        >
                                          {isCollected && <Check className="w-3 h-3" />}
                                          {isNoShow && <XCircle className="w-3 h-3" />}
                                          {p.status}
                                        </span>
                                      </td>

                                      {/* Admin Actions */}
                                      <td className="py-3.5 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          {isReserved && (
                                            <>
                                              <button
                                                onClick={() => handleUpdateParticipant(deal.id, p.id, 'COLLECTED')}
                                                disabled={isActing}
                                                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                                                title="Mark collected and cash received"
                                              >
                                                <Check className="w-3.5 h-3.5" />
                                                Mark Collected
                                              </button>

                                              <button
                                                onClick={() => handleUpdateParticipant(deal.id, p.id, 'NO_SHOW')}
                                                disabled={isActing}
                                                className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                                                title="Mark customer as no-show"
                                              >
                                                <XCircle className="w-3.5 h-3.5" />
                                                No-Show
                                              </button>
                                            </>
                                          )}

                                          {!isReserved && (
                                            <button
                                              onClick={() => handleUpdateParticipant(deal.id, p.id, 'RESERVED')}
                                              disabled={isActing}
                                              className="px-2.5 py-1.5 rounded-xl font-bold text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors disabled:opacity-50"
                                              title="Undo and reset to reserved"
                                            >
                                              <RotateCcw className="w-3 h-3" />
                                              Reset
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MASTER ORDERS LEDGER ACROSS ALL DEALS */}
      {activeTab === 'ALL_ORDERS' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-700" />
                Master Buyer Orders Ledger
              </h2>
              <p className="text-xs text-slate-500">
                All customer reservations across all pools. Fast search by customer phone number or name during pickup rush.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              Showing {filteredMasterOrders.length} orders
            </span>
          </div>

          {filteredMasterOrders.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 font-medium">No customer orders matching this search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Buyer Info</th>
                    <th className="py-3 px-4">Product / Deal</th>
                    <th className="py-3 px-4">Units</th>
                    <th className="py-3 px-4">30% Advance</th>
                    <th className="py-3 px-4">Cash Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMasterOrders.map((order) => {
                    const isCollected = order.status === 'COLLECTED';
                    const isNoShow = order.status === 'NO_SHOW';
                    const isReserved = order.status === 'RESERVED';
                    const isActing = actionLoadingId === `part-${order.participationId}`;

                    return (
                      <tr
                        key={order.participationId}
                        className={`transition-colors ${
                          isCollected
                            ? 'bg-emerald-50/40'
                            : isNoShow
                            ? 'bg-rose-50/40'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(order.joinedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{order.buyerName}</span>
                          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-purple-600" />
                            <a href={`tel:${order.buyerPhone}`} className="hover:text-purple-700 hover:underline">
                              {order.buyerPhone}
                            </a>
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={order.productImage}
                              alt={order.productName}
                              className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">{order.productName}</span>
                              <span className="text-[10px] text-purple-700 font-bold">{order.productCategory}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {order.quantity} {order.productUnit}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-emerald-700 block">PKR {order.depositPaid.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-500 font-medium">({order.paymentMethod})</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-black text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded text-xs">
                            PKR {order.cashDue.toLocaleString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isCollected
                                ? 'bg-emerald-100 text-emerald-800'
                                : isNoShow
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isReserved && (
                              <button
                                onClick={() => handleUpdateParticipant(order.dealId, order.participationId, 'COLLECTED')}
                                disabled={isActing}
                                className="px-3 py-1 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                Collected
                              </button>
                            )}
                            {!isReserved && (
                              <button
                                onClick={() => handleUpdateParticipant(order.dealId, order.participationId, 'RESERVED')}
                                disabled={isActing}
                                className="px-2.5 py-1 rounded-xl font-bold text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors disabled:opacity-50"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANAGEMENT (NEW POOL & NEW PRODUCT) */}
      {activeTab === 'MANAGEMENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* New Deal Card */}
          <div className="bg-white rounded-3xl border border-purple-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-purple-100">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <PlusCircle className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-black text-purple-950">Launch New Wholesale Pool</h2>
                <p className="text-xs text-slate-500">Configure factory wholesale volume tiers and pickup schedule.</p>
              </div>
            </div>

            <form onSubmit={handleCreateDealSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Staple Product</label>
                <select
                  required
                  value={dealForm.productId}
                  onChange={(e) => setDealForm({ ...dealForm, productId: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deal Expiry Deadline</label>
                <input
                  type="datetime-local"
                  required
                  value={dealForm.deadline}
                  onChange={(e) => setDealForm({ ...dealForm, deadline: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Community Pickup Location</label>
                <input
                  type="text"
                  required
                  value={dealForm.pickupLocation}
                  onChange={(e) => setDealForm({ ...dealForm, pickupLocation: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pickup Schedule Window</label>
                <input
                  type="text"
                  required
                  value={dealForm.pickupTime}
                  onChange={(e) => setDealForm({ ...dealForm, pickupTime: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Wholesale Tiers Configuration</label>
                <div className="space-y-2">
                  {dealForm.tiers.map((tier, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">Min Units</span>
                        <input
                          type="number"
                          value={tier.minUnits}
                          onChange={(e) => {
                            const newTiers = [...dealForm.tiers];
                            newTiers[idx].minUnits = Number(e.target.value);
                            setDealForm({ ...dealForm, tiers: newTiers });
                          }}
                          className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">Buyer Rate (PKR)</span>
                        <input
                          type="number"
                          value={tier.pricePerUnit}
                          onChange={(e) => {
                            const newTiers = [...dealForm.tiers];
                            newTiers[idx].pricePerUnit = Number(e.target.value);
                            setDealForm({ ...dealForm, tiers: newTiers });
                          }}
                          className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">Supplier Cost (PKR)</span>
                        <input
                          type="number"
                          value={tier.supplierCostPerUnit}
                          onChange={(e) => {
                            const newTiers = [...dealForm.tiers];
                            newTiers[idx].supplierCostPerUnit = Number(e.target.value);
                            setDealForm({ ...dealForm, tiers: newTiers });
                          }}
                          className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-700/20 transition-colors"
              >
                Publish Live Group Deal
              </button>
            </form>
          </div>

          {/* New Product Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <Package className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">Add New Staple Product</h2>
                <p className="text-xs text-slate-500">Register new bulk inventory items for group pools.</p>
              </div>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Guard Basmati Rice (10 kg)"
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Unit Specification</label>
                <input
                  type="text"
                  required
                  value={productForm.unit}
                  onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                  placeholder="e.g. 10 kg bag, 12 x 1L carton"
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold"
                >
                  <option value="Cooking Oil">Cooking Oil</option>
                  <option value="Rice & Grains">Rice & Grains</option>
                  <option value="Flour & Atta">Flour & Atta</option>
                  <option value="Dairy & Milk">Dairy & Milk</option>
                  <option value="Tea & Beverages">Tea & Beverages</option>
                  <option value="Sugar & Sweeteners">Sugar & Sweeteners</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Image URL</label>
                <input
                  type="url"
                  required
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Brief details about wholesale quality, grade, packaging..."
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-colors"
              >
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
