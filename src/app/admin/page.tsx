'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [deals, setDeals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingDeal, setIsCreatingDeal] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);
  const [isCronRunning, setIsCronRunning] = useState(false);

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
        setCronMessage(`Cron finished: ${data.message} (${data.summary.unlocked} unlocked, ${data.summary.failed} failed)`);
        fetchData();
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
    try {
      const res = await fetch(`/api/admin/deals/${dealId}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_FULFILLED' }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateParticipant = async (dealId: string, participationId: string, newStatus: string) => {
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
        fetchData();
      }
    } catch (e) {
      console.error(e);
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
        fetchData();
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
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-64 rounded-3xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
        <ShieldCheck className="w-12 h-12 text-purple-600 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Admin Access Required</h2>
        <p className="text-xs text-gray-500">
          You must be logged in as an Administrator to access the Wholly control center.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
        >
          Login as Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-purple-100 text-purple-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              Control Center
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mt-1">Admin Operations</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Curate deals, manage pickup fulfillment, and close expired wholesale pools.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsCreatingProduct(true)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Package className="w-4 h-4 text-gray-500" />
            + New Product
          </button>

          <button
            onClick={() => setIsCreatingDeal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            + Create Deal
          </button>

          <button
            onClick={handleRunCron}
            disabled={isCronRunning}
            className="px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
            title="Runs scheduled route /api/cron/close-deals"
          >
            <Play className={`w-3.5 h-3.5 ${isCronRunning ? 'animate-spin' : ''}`} />
            Run Deal Closer Cron
          </button>
        </div>
      </div>

      {cronMessage && (
        <div className="p-4 rounded-2xl bg-purple-50 text-purple-900 text-xs font-semibold border border-purple-200 flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0 text-purple-600" />
          {cronMessage}
        </div>
      )}

      {/* New Product Modal / Box */}
      {isCreatingProduct && (
        <div className="bg-white rounded-3xl border border-gray-300 p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Add New Staple Product</h2>
            <button
              onClick={() => setIsCreatingProduct(false)}
              className="text-xs font-bold text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreateProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Product Name</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="e.g. Guard Basmati Rice (10 kg)"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Unit Description</label>
              <input
                type="text"
                required
                value={productForm.unit}
                onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                placeholder="e.g. 10 kg bag, 5 L tin"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Category</label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white"
              >
                <option value="Cooking Oil">Cooking Oil</option>
                <option value="Rice & Grains">Rice & Grains</option>
                <option value="Tea & Beverages">Tea & Beverages</option>
                <option value="Sugar & Sweeteners">Sugar & Sweeteners</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Image URL</label>
              <input
                type="url"
                required
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-gray-700 block mb-1">Description</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Deal Modal / Box */}
      {isCreatingDeal && (
        <div className="bg-white rounded-3xl border border-purple-200 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-purple-900">Launch New Group Deal</h2>
            <button
              onClick={() => setIsCreatingDeal(false)}
              className="text-xs font-bold text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateDealSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Product</label>
                <select
                  required
                  value={dealForm.productId}
                  onChange={(e) => setDealForm({ ...dealForm, productId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Deadline Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={dealForm.deadline}
                  onChange={(e) => setDealForm({ ...dealForm, deadline: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Pickup Location</label>
                <input
                  type="text"
                  required
                  value={dealForm.pickupLocation}
                  onChange={(e) => setDealForm({ ...dealForm, pickupLocation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Pickup Schedule</label>
                <input
                  type="text"
                  required
                  value={dealForm.pickupTime}
                  onChange={(e) => setDealForm({ ...dealForm, pickupTime: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Max Units / Person</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={dealForm.maxPerUser}
                  onChange={(e) => setDealForm({ ...dealForm, maxPerUser: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-emerald-800 block mb-1">Advance Booking Deposit / Unit (PKR)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={dealForm.tokenPerUnit}
                  onChange={(e) => setDealForm({ ...dealForm, tokenPerUnit: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-emerald-300 bg-white text-slate-900 font-bold"
                />
              </div>
            </div>

            {/* Tiers Configuration */}
            <div>
              <span className="font-bold text-gray-800 block mb-2">Wholesale Tiers Configuration</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {dealForm.tiers.map((tier, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                    <span className="font-bold text-gray-700 block">Tier {idx + 1}</span>
                    <div>
                      <span className="text-[10px] text-gray-500">Min Units:</span>
                      <input
                        type="number"
                        value={tier.minUnits}
                        onChange={(e) => {
                          const newTiers = [...dealForm.tiers];
                          newTiers[idx].minUnits = Number(e.target.value);
                          setDealForm({ ...dealForm, tiers: newTiers });
                        }}
                        className="w-full p-1.5 rounded border border-slate-300 bg-white text-slate-900 font-semibold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500">Buyer Price (PKR):</span>
                      <input
                        type="number"
                        value={tier.pricePerUnit}
                        onChange={(e) => {
                          const newTiers = [...dealForm.tiers];
                          newTiers[idx].pricePerUnit = Number(e.target.value);
                          setDealForm({ ...dealForm, tiers: newTiers });
                        }}
                        className="w-full p-1.5 rounded border border-slate-300 bg-white text-slate-900 font-semibold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500">Supplier Cost (PKR):</span>
                      <input
                        type="number"
                        value={tier.supplierCostPerUnit}
                        onChange={(e) => {
                          const newTiers = [...dealForm.tiers];
                          newTiers[idx].supplierCostPerUnit = Number(e.target.value);
                          setDealForm({ ...dealForm, tiers: newTiers });
                        }}
                        className="w-full p-1.5 rounded border border-slate-300 bg-white text-slate-900 font-semibold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700"
              >
                Publish Deal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deals Management List */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-gray-900">Active & Historical Pools</h2>

        <div className="grid grid-cols-1 gap-6">
          {deals.map((deal) => {
            return (
              <div
                key={deal.id}
                className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={deal.product.imageUrl}
                      alt={deal.product.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{deal.product.name}</h3>
                      <p className="text-xs text-gray-500">
                        {deal.unitsClaimed} units claimed • Status:{' '}
                        <span className="font-bold text-purple-700">{deal.status}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {deal.status !== 'FULFILLED' && (
                      <button
                        onClick={() => handleMarkFulfilled(deal.id)}
                        className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Fulfilled
                      </button>
                    )}
                    <Link
                      href={`/deals/${deal.id}`}
                      className="px-3.5 py-1.5 rounded-xl font-semibold text-xs border border-gray-300 hover:bg-gray-50 text-gray-700"
                    >
                      View Live Page
                    </Link>
                  </div>
                </div>

                {/* Deal Progress & Revenue */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-gray-50">
                    <span className="text-gray-500 block">Current Wholesale Rate</span>
                    <span className="font-black text-gray-900 text-sm">
                      PKR {deal.currentPrice?.toLocaleString()} / unit
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50">
                    <span className="text-gray-500 block">Participants Joined</span>
                    <span className="font-black text-gray-900 text-sm">
                      {deal.participantCount} buyers ({deal.unitsClaimed} units)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50 text-purple-900">
                    <span className="text-purple-700 font-semibold block">Platform Margin (Profit)</span>
                    <span className="font-black text-purple-950 text-sm">
                      PKR {(deal.currentTier ? (deal.currentTier.pricePerUnit - deal.currentTier.supplierCostPerUnit) * deal.unitsClaimed : 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
