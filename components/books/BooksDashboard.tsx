'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  LogOut, BookOpen, Menu, X, ChevronRight, ChevronDown, Users, WifiOff, AlertTriangle, ClipboardList,
  Lock, ShieldCheck, PackageCheck,
} from 'lucide-react';
import InventoryPanel from './InventoryPanel';
import BillingPanel from './BillingPanel';
import ReportsPanel from './ReportsPanel';
import PublishersPanel from './PublishersPanel';
import RequestsPanel from './RequestsPanel';
import ReturnPanel from './ReturnPanel';
import { getStats, getPublisherStats, getBooks, initBookStore, onDataChange } from '@/lib/bookStore';

type Tab = 'dashboard' | 'inventory' | 'publishers' | 'billing' | 'reports' | 'requests' | 'returns';

const FREE_TABS: Tab[] = ['billing', 'requests'];
const PASSCODE      = '9090';
const ADMIN_CODE    = 'pandaboy';

interface Props {
  onLogout: () => void;
}

// ==================== PASSCODE MODAL ====================
function PasscodeLock({
  tabLabel,
  onUnlock,
  onAdminUnlock,
  onClose,
}: {
  tabLabel: string;
  onUnlock: () => void;
  onAdminUnlock: () => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const [shake, setShake]  = useState(false);
  const [error, setError]  = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const attempt = () => {
    if (value === PASSCODE) {
      onUnlock();
    } else if (value === ADMIN_CODE) {
      onAdminUnlock();
    } else {
      setShake(true);
      setError('Incorrect passcode. Try again.');
      setValue('');
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-maroon/10 flex items-center justify-center mb-3">
            <Lock size={26} className="text-maroon" />
          </div>
          <h2 className="text-xl font-bold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>Restricted Access</h2>
          <p className="text-sm text-gray-500 mt-1 text-center">Enter passcode to open <span className="font-semibold text-charcoal">{tabLabel}</span></p>
        </div>

        <motion.div animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}} transition={{ duration: 0.4 }}>
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && attempt()}
            className={`w-full text-center text-2xl tracking-[0.5em] px-4 py-4 border-2 rounded-2xl outline-none transition-colors font-mono ${
              error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-maroon'
            }`}
            placeholder="••••"
            maxLength={20}
          />
        </motion.div>

        {error && (
          <p className="text-xs text-red-500 font-medium text-center mt-2">{error}</p>
        )}

        <button
          onClick={attempt}
          className="w-full mt-5 bg-maroon text-white py-3.5 rounded-2xl font-semibold text-base hover:bg-opacity-90 active:scale-[0.98] transition-all"
        >
          Unlock
        </button>
      </motion.div>
    </div>
  );
}

export default function BooksDashboard({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('billing');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unlockedTabs, setUnlockedTabs] = useState<Tab[]>([...FREE_TABS]);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  const [stats, setStats] = useState({ totalBooks: 0, totalSold: 0, totalRemaining: 0, totalRevenue: 0, totalBills: 0, totalPaidBills: 0, totalUnpaidBills: 0, totalPendingAmount: 0, uniquePublishers: 0 });
  const [totalProfit, setTotalProfit] = useState(0);
  const [lowStockBooks, setLowStockBooks] = useState<{ id: string; title: string; localTitle?: string; remaining: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [syncPulse, setSyncPulse]   = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track online / offline status — so cashiers know when working without internet.
  // navigator.onLine is unreliable: it stays true if device is on WiFi/LAN even when
  // that network has no internet (common at festival venues). So we probe a real URL
  // every 8 seconds. If the fetch fails → truly offline.
  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        // Fetch own icon — tiny, same origin, no CORS issue
        await fetch('/icons/icon-192.png?_=' + Date.now(), { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeout);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    // Immediate check then every 8 seconds
    checkConnectivity();
    const intv = setInterval(checkConnectivity, 8000);

    // Also use browser events for instant response when network interface drops
    const onOnline  = () => checkConnectivity();
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      clearInterval(intv);
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
      setLowStockBooks(
        getBooks()
          .filter((b) => (b.quantity - b.sold) >= 0 && (b.quantity - b.sold) <= 3)
          .sort((a, b) => (a.quantity - a.sold) - (b.quantity - b.sold))
          .map((b) => ({ id: b.id, title: b.title, localTitle: b.localTitle, remaining: b.quantity - b.sold }))
      );
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStats(getStats());
      const ps = getPublisherStats();
      setTotalProfit(ps.reduce((s, p) => s + p.profit, 0));
      setLowStockBooks(
        getBooks()
          .filter((b) => (b.quantity - b.sold) >= 0 && (b.quantity - b.sold) <= 3)
          .sort((a, b) => (a.quantity - a.sold) - (b.quantity - b.sold))
          .map((b) => ({ id: b.id, title: b.title, localTitle: b.localTitle, remaining: b.quantity - b.sold }))
      );
    }
  }, [activeTab, loading]);

  // Real-time sync from other devices
  useEffect(() => {
    const unsub = onDataChange(() => {
      setStats(getStats());
      const ps = getPublisherStats();
      setTotalProfit(ps.reduce((s, p) => s + p.profit, 0));
      setLowStockBooks(
        getBooks()
          .filter((b) => (b.quantity - b.sold) >= 0 && (b.quantity - b.sold) <= 3)
          .sort((a, b) => (a.quantity - a.sold) - (b.quantity - b.sold))
          .map((b) => ({ id: b.id, title: b.title, localTitle: b.localTitle, remaining: b.quantity - b.sold }))
      );
      // Record sync timestamp and trigger pulse animation
      setLastSyncAt(new Date());
      setSyncPulse(true);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => setSyncPulse(false), 2000);
    });
    return () => {
      unsub();
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  // Periodically update the "synced X ago" text so it stays current
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (!lastSyncAt) return;
    const timer = setInterval(() => forceUpdate((n) => n + 1), 15_000);
    return () => clearInterval(timer);
  }, [lastSyncAt]);

  // Format last-synced time for display
  const formatSyncTime = useCallback(() => {
    if (!lastSyncAt) return '';
    const diff = Math.floor((Date.now() - lastSyncAt.getTime()) / 1000);
    if (diff < 10) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastSyncAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }, [lastSyncAt]);

  const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'billing',    label: 'Billing',    icon: ShoppingCart,    desc: 'Point of Sale' },
    { id: 'requests',   label: 'Requests',   icon: ClipboardList,   desc: 'Pre-order waitlist' },
    { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard, desc: 'Overview' },
    { id: 'inventory',  label: 'Inventory',  icon: Package,         desc: 'Manage books' },
    { id: 'publishers', label: 'Publishers', icon: Users,           desc: 'Publisher pool' },
    { id: 'reports',    label: 'Reports',    icon: BarChart3,       desc: 'Export data' },
    { id: 'returns',    label: 'Returns',    icon: PackageCheck,    desc: 'Pack-down returns' },
  ];

  const quickActions = [
    { label: 'Add Books', desc: 'Enter new books to inventory', tab: 'inventory' as Tab, icon: Package, color: 'bg-blue-500' },
    { label: 'Publishers', desc: 'Manage publisher pool & profit %', tab: 'publishers' as Tab, icon: Users, color: 'bg-purple-500' },
    { label: 'New Sale', desc: 'Start billing a customer', tab: 'billing' as Tab, icon: ShoppingCart, color: 'bg-green-500' },
    { label: 'Export Report', desc: 'Download PDF or Excel', tab: 'reports' as Tab, icon: BarChart3, color: 'bg-orange-500' },
  ];

  const isTabLocked = (tab: Tab) => !adminUnlocked && !FREE_TABS.includes(tab) && !unlockedTabs.includes(tab);

  const switchTab = (tab: Tab) => {
    if (isTabLocked(tab)) {
      setPendingTab(tab);
      setSidebarOpen(false);
      return;
    }
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const handleUnlock = () => {
    if (!pendingTab) return;
    setUnlockedTabs((prev) => [...prev, pendingTab]);
    setActiveTab(pendingTab);
    setPendingTab(null);
  };

  const handleAdminUnlock = () => {
    setAdminUnlocked(true);
    if (pendingTab) setActiveTab(pendingTab);
    setPendingTab(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
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
            <span>Offline — billing still works. Data will sync when internet is restored.</span>
            {lastSyncAt && (
              <span className="text-amber-200 text-xs ml-1">
                Last synced: {lastSyncAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 min-w-0 overflow-x-hidden">
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
                <div className="text-left flex-1">
                  <div className="font-medium">{tab.label}</div>
                  <div className={`text-[10px] ${activeTab === tab.id ? 'text-white/70' : 'text-gray-400'}`}>
                    {tab.desc}
                  </div>
                </div>
                {isTabLocked(tab.id) && (
                  <Lock size={13} className={activeTab === tab.id ? 'text-white/60' : 'text-gray-300'} />
                )}
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
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
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
              {adminUnlocked && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 font-semibold rounded-full">
                  <ShieldCheck size={11} /> Admin
                </span>
              )}
              {/* Connection & sync indicator */}
              {isOnline ? (
                <span className="flex items-center gap-1.5 text-gray-400">
                  <span className="relative flex h-2 w-2">
                    {syncPulse && <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />}
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  {syncPulse
                    ? <span className="text-green-600 hidden sm:inline">syncing…</span>
                    : lastSyncAt && <span className="hidden sm:inline">synced {formatSyncTime()}</span>
                  }
                </span>
              ) : (
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
        <main className="flex-1 p-4 md:p-6 min-w-0 overflow-x-hidden">
          {/* Passcode modal */}
          <AnimatePresence>
            {pendingTab && (
              <PasscodeLock
                tabLabel={tabs.find((t) => t.id === pendingTab)?.label ?? ''}
                onUnlock={handleUnlock}
                onAdminUnlock={handleAdminUnlock}
                onClose={() => setPendingTab(null)}
              />
            )}
          </AnimatePresence>

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
              className="min-w-0"
            >
              {activeTab === 'dashboard' && (
                <DashboardHome stats={stats} totalProfit={totalProfit} onNavigate={switchTab} quickActions={quickActions} lowStockBooks={lowStockBooks} />
              )}
              {activeTab === 'inventory' && <InventoryPanel />}
              {activeTab === 'publishers' && <PublishersPanel />}
              {activeTab === 'billing' && <BillingPanel />}
              {activeTab === 'reports' && <ReportsPanel />}
              {activeTab === 'requests' && <RequestsPanel />}
              {activeTab === 'returns' && <ReturnPanel />}
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
  lowStockBooks,
}: {
  stats: ReturnType<typeof getStats>;
  totalProfit: number;
  onNavigate: (tab: Tab) => void;
  quickActions: { label: string; desc: string; tab: Tab; icon: React.ElementType; color: string }[];
  lowStockBooks: { id: string; title: string; localTitle?: string; remaining: number }[];
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

      {/* Low Stock Alert — removed from here, now shown at bottom */}

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

      {/* Stock Alert — collapsible, collapsed by default */}
      <StockAlertSection lowStockBooks={lowStockBooks} onNavigate={onNavigate} />
    </div>
  );
}

/* ── Collapsible Stock Alert ──────────────────────────── */
const RAG_GROUPS = [
  { remaining: 0, label: 'Out of Stock',  headerClass: 'bg-red-600 text-white',        badgeClass: 'bg-red-200 text-red-900' },
  { remaining: 1, label: 'Only 1 Left',   headerClass: 'bg-red-100 text-red-800',      badgeClass: 'bg-red-200 text-red-800' },
  { remaining: 2, label: 'Only 2 Left',   headerClass: 'bg-amber-100 text-amber-800',  badgeClass: 'bg-amber-200 text-amber-800' },
  { remaining: 3, label: 'Only 3 Left',   headerClass: 'bg-yellow-100 text-yellow-800',badgeClass: 'bg-yellow-200 text-yellow-800' },
] as const;

function StockAlertSection({
  lowStockBooks,
  onNavigate,
}: {
  lowStockBooks: { id: string; title: string; localTitle?: string; remaining: number }[];
  onNavigate: (tab: Tab) => void;
}) {
  const [open, setOpen] = useState(false);
  if (lowStockBooks.length === 0) return null;

  const ragGroups = RAG_GROUPS
    .map((g) => ({ ...g, books: lowStockBooks.filter((b) => b.remaining === g.remaining) }))
    .filter((g) => g.books.length > 0);

  const outCount = lowStockBooks.filter((b) => b.remaining === 0).length;
  const lowCount = lowStockBooks.filter((b) => b.remaining > 0).length;

  const summaryText = [
    outCount > 0 && `${outCount} out of stock`,
    lowCount > 0 && `${lowCount} running low`,
  ].filter(Boolean).join(', ');

  return (
    <div className="mt-8">
      {/* Clickable header — always visible */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2 group"
      >
        <AlertTriangle size={17} className={`shrink-0 transition-colors ${outCount > 0 ? 'text-red-500' : 'text-amber-500'}`} />
        <span className="text-base font-bold text-charcoal">Stock Alert</span>
        <span className="text-sm font-normal text-gray-500 ml-1">{summaryText}</span>

        {/* pill counts */}
        {outCount > 0 && (
          <span className="ml-1 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {outCount} out
          </span>
        )}
        {lowCount > 0 && (
          <span className="ml-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {lowCount} low
          </span>
        )}

        <ChevronDown
          size={16}
          className={`ml-auto text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable body */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="stock-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3">
              {/* Manage link */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => onNavigate('inventory')}
                  className="text-xs text-maroon font-semibold hover:underline"
                >
                  Manage Inventory →
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {ragGroups.map((group, gi) => (
                  <div key={group.remaining} className={gi > 0 ? 'border-t border-gray-100' : ''}>
                    <div className={`flex items-center gap-2 px-4 py-2 ${group.headerClass}`}>
                      <span className="text-xs font-bold uppercase tracking-wide">{group.label}</span>
                      <span className="text-xs font-semibold opacity-70">
                        — {group.books.length} book{group.books.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 px-4 py-3">
                      {group.books.map((b) => (
                        <span
                          key={b.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                            group.remaining === 0 ? 'bg-red-50 border-red-200 text-red-700' :
                            group.remaining === 1 ? 'bg-red-50 border-red-100 text-red-600' :
                            group.remaining === 2 ? 'bg-amber-50 border-amber-100 text-amber-700' :
                            'bg-yellow-50 border-yellow-100 text-yellow-700'
                          }`}
                        >
                          {b.localTitle || b.title}
                          {group.remaining > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${group.badgeClass}`}>
                              {group.remaining} left
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
