import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, HeartHandshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Wholly — Buy Together, Pay Wholesale in Pakistan',
  description:
    'Join group-buying deals on household staples across Pakistan. Pool orders with neighbors to unlock wholesale prices with cash on pickup.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased light" style={{ colorScheme: 'light' }}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>

          <footer className="border-t border-slate-200 bg-white py-10 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    W
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Wholly (Pakistan)</p>
                    <p className="text-xs text-slate-500">Buy together, pay wholesale • Cash at pickup</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Verified Wholesale Suppliers
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-emerald-600" />
                    Community Powered
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  © 2026 Wholly. Built for portfolio showcase.
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
