'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  LogOut, BookOpen, Menu, X, ChevronRight, Users, WifiOff,
} from 'lucide-react';
import InventoryPanel from './InventoryPanel';
import BillingPanel from './BillingPanel';
import ReportsPanel from './ReportsPanel';
import PublishersPanel from './PublishersPanel';
import { getStats, getPublisherStats, initBookStore, isStoreReady, onDataChange } from '@/lib/bookStore';

type Tab = 'dashboard' | 'inventory' | 'publishers' | 'billing' | 'reports';

interface Props {
  onLogout: () => void;
}

export default function BooksDashboard({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ totalBooks: 0, totalSold: 0, totalRemaining: 0, totalRevenue: 0, totalBills: 0, totalPaidBills: 0, totalUnpaidBills: 0, totalPendingAmount: 0, uniquePublishers: 0 });
  const [totalProfit, setTotalProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Track online / offline status — so cashiers know when working without internet.
  // navigator.onLine is unreliable: it stays true if device is on WiFi/LAN even when
  // that network has no internet (common at festival venues). So we probe a real URL
  // every 8 seconds. If the fetch fails → truly offline.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const checkConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        // Fetch own favicon — tiny, same origin, no CORS issue
        await fetch('/favicon.ico?_=' + Date.now(), { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeout);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    // Immediate check then every 8 seconds
    checkConnectivity();
    interval = setInterval(checkConnectivity, 8000);

    // Also use browser events for instant response when network interface drops
    const onOnline  = () => checkConnectivity();
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Initialize Firestore-backed store on mount
  useEffect(() => {
    initBookStore().then(() => {
      setLoading(false);
      setStats(getStats());
      const ps = getPublisherStats();
      setTotalProfit(ps.reduce((s, p) => s + p.profit, 0));
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      setStats(getStats());
      const ps = getPublisherStats();
      setTotalProfit(ps.reduce((s, p) => s + p.profit, 0));
    }
  }, [activeTab, loading]);

  // Real-time sync from other devices
  useEffect(() => {
    const unsub = onDataChange(() => {
      setStats(getStats());
      const ps = getPublisherStats();
      setTotalProfit(ps.reduce((s, p) => s + p.profit, 0));
    });
    return unsub;
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview' },
    { id: 'inventory', label: 'Inventory', icon: Package, desc: 'Manage books' },
    { id: 'publishers', label: 'Publishers', icon: Users, desc: 'Publisher pool' },
    { id: 'billing', label: 'Billing', icon: ShoppingCart, desc: 'Point of Sale' },
    { id: 'reports', label: 'Reports', icon: BarChart3, desc: 'Export data' },
  ];

  const quickActions = [
    { label: 'Add Books', desc: 'Enter new books to inventory', tab: 'inventory' as Tab, icon: Package, color: 'bg-blue-500' },
    { label: 'Publishers', desc: 'Manage publisher pool & profit %', tab: 'publishers' as Tab, icon: Users, color: 'bg-purple-500' },
    { label: 'New Sale', desc: 'Start billing a customer', tab: 'billing' as Tab, icon: ShoppingCart, color: 'bg-green-500' },
    { label: 'Export Report', desc: 'Download PDF or Excel', tab: 'reports' as Tab, icon: BarChart3, color: 'bg-orange-500' },
  ];

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Offline banner — shown when internet is lost */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="w-full z-[60] bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <WifiOff size={16} />
            Offline — billing still works. Data will sync automatically when internet is restored.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1">
      {/* Sidebar overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-200 md:translate-x-0 md:static md:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-5 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-maroon flex items-center justify-center">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-charcoal text-sm leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  Gramakam
                </h1>
                <p className="text-[11px] text-gray-500">Book Festival 2026</p>
              </div>
            </div>
            {/* Close btn on mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-maroon text-white shadow-md shadow-maroon/20'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-charcoal'
                }`}
              >
                <tab.icon size={20} />
                <div className="text-left">
                  <div className="font-medium">{tab.label}</div>
                  <div className={`text-[10px] ${activeTab === tab.id ? 'text-white/70' : 'text-gray-400'}`}>
                    {tab.desc}
                  </div>
                </div>
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-gray-100">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-lg font-bold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {!isOnline && (
                <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 font-semibold rounded-full">
                  <WifiOff size={11} /> Offline
                </span>
              )}
              <span className="hidden sm:inline">📚 {stats.totalBooks} books</span>
              <span className="hidden sm:inline mx-1">•</span>
              <span className="hidden sm:inline">🧾 {stats.totalBills} bills</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-4 md:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-10 h-10 border-3 border-maroon border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-medium">Loading data...</p>
              <p className="text-sm mt-1">Syncing with cloud storage</p>
            </div>
          ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardHome stats={stats} totalProfit={totalProfit} onNavigate={switchTab} quickActions={quickActions} />
              )}
              {activeTab === 'inventory' && <InventoryPanel />}
              {activeTab === 'publishers' && <PublishersPanel />}
              {activeTab === 'billing' && <BillingPanel />}
              {activeTab === 'reports' && <ReportsPanel />}
            </motion.div>
          </AnimatePresence>
          )}
        </main>
      </div>
      </div>
    </div>
  );
}

/* ========== Dashboard Home ========== */
function DashboardHome({
  stats,
  totalProfit,
  onNavigate,
  quickActions,
}: {
  stats: ReturnType<typeof getStats>;
  totalProfit: number;
  onNavigate: (tab: Tab) => void;
  quickActions: { label: string; desc: string; tab: Tab; icon: React.ElementType; color: string }[];
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-charcoal mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        Welcome to Book Festival Manager
      </h2>
      <p className="text-gray-500 text-sm mb-8">Gramakam Book Festival 2026 &mdash; Manage your inventory, billing, and reports.</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Books', val: stats.totalBooks, sub: `${stats.uniquePublishers} publishers`, color: 'border-blue-400' },
          { label: 'Books Sold', val: stats.totalSold, sub: `${stats.totalBills} bills`, color: 'border-green-400' },
          { label: 'Remaining', val: stats.totalRemaining, sub: 'in stock', color: 'border-yellow-400' },
          { label: 'Revenue', val: `₹${stats.totalRevenue.toFixed(0)}`, sub: 'from paid bills', color: 'border-purple-400' },
          { label: 'Our Profit', val: `₹${totalProfit.toFixed(0)}`, sub: 'from all publishers', color: 'border-green-500' },
          ...(stats.totalUnpaidBills > 0 ? [{ label: 'Pending Payment', val: `₹${stats.totalPendingAmount.toFixed(0)}`, sub: `${stats.totalUnpaidBills} unpaid bill${stats.totalUnpaidBills !== 1 ? 's' : ''}`, color: 'border-amber-400' }] : []),
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl p-5 border-l-4 ${s.color} shadow-sm`}>
            <p className="text-2xl md:text-3xl font-bold text-charcoal">{s.val}</p>
            <p className="text-sm font-medium text-gray-600 mt-1">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h3 className="text-lg font-semibold text-charcoal mb-3">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.tab}
            onClick={() => onNavigate(action.tab)}
            className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md text-left transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center`}>
                <action.icon size={20} className="text-white" />
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <h4 className="font-semibold text-charcoal">{action.label}</h4>
            <p className="text-sm text-gray-500 mt-0.5">{action.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
