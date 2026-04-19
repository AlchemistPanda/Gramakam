'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Newspaper,
  Mail,
  Clock,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  Plus,
  Trash2,
  Edit,
  Eye,
  Save,
  CheckCircle,
  CreditCard,
  Filter,
  ExternalLink,
  Trophy,
  Download,
  Package,
  Truck,
  MapPin,
  ChevronDown,
  ChevronUp,
  Copy,
  Phone,
  MailIcon,
  Search,
  Upload,
  Loader2,
  Printer,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Camera,
} from 'lucide-react';
import {
  connectPrinter,
  disconnectPrinter,
  printOrderLabel,
  type PrinterStatus,
} from '@/lib/blePrinter';
import {
  getGalleryItems,
  getGalleryHashes,
  hashFile,
  backfillGallerySizes,
  addGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  getWorkshopGalleryItems,
  getWorkshopGalleryHashes,
  addWorkshopGalleryItem,
  deleteWorkshopGalleryItem,
  getFeedPosts,
  addFeedPost,
  updateFeedPost,
  deleteFeedPost,
  getContactSubmissions,
  markContactRead,
  deleteContact,
  getPrebookEntries,
  deletePrebook,
  getMerchOrders,
  updateMerchOrderStatus,
  deleteMerchOrder,
  getSiteConfig,
  updateSiteConfig,
  uploadImage,
  getMediaItems,
  addMediaItem,
  deleteMediaItem,
  getAwards,
  addAward,
  deleteAward,
  getStockDocs,
  setStockDoc,
  setStockCount,
  setSizeStock,
  addStockCount,
  addSizeStock,
  type StockDoc,
} from '@/lib/services';
import { PRODUCTS } from '@/lib/products';
import type {
  GalleryItem,
  WorkshopGalleryItem,
  FeedPost,
  ContactSubmission,
  MerchPrebook,
  MerchOrder,
  MerchOrderStatus,
  MediaItem,
  Award,
  DeliveryAddress,
} from '@/types';
import { formatDate } from '@/lib/utils';
import { compressImage, formatFileSize } from '@/lib/imageCompressor';

type AdminTab = 'overview' | 'gallery' | 'workshop' | 'feed' | 'contacts' | 'countdown' | 'merch' | 'media' | 'awards';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    { id: 'workshop', label: 'Workshop Gallery', icon: Camera },
    { id: 'feed', label: 'Feed Posts', icon: Newspaper },
    { id: 'media', label: 'Media & News', icon: Filter },
    { id: 'awards', label: 'Awards', icon: Trophy },
    { id: 'contacts', label: 'Contact Messages', icon: Mail },
    { id: 'countdown', label: 'Countdown', icon: Clock },
    { id: 'merch', label: 'Merchandise', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-charcoal text-white p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          Gramakam Admin
        </h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-charcoal text-white transform transition-transform duration-300 lg:transform-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-6 hidden lg:block">
            <h1 className="text-xl font-bold text-cream" style={{ fontFamily: 'var(--font-heading)' }}>
              Gramakam
            </h1>
            <p className="text-gray-400 text-xs mt-1">Admin Dashboard</p>
          </div>

          <nav className="px-4 py-6 lg:py-0 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-maroon text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 lg:p-10 min-h-screen">
          {activeTab === 'overview' && <OverviewPanel />}
          {activeTab === 'gallery' && <GalleryPanel />}
          {activeTab === 'workshop' && <WorkshopGalleryPanel />}
          {activeTab === 'feed' && <FeedPanel />}
          {activeTab === 'media' && <MediaPanel />}
          {activeTab === 'awards' && <AwardsPanel />}
          {activeTab === 'contacts' && <ContactsPanel />}
          {activeTab === 'countdown' && <CountdownPanel />}
          {activeTab === 'merch' && <MerchPanel />}
        </main>
      </div>
    </div>
  );
}

// ===== OVERVIEW PANEL =====
function OverviewPanel() {
  const [stats, setStats] = useState({ gallery: 0, feed: 0, contacts: 0, prebooks: 0, orders: 0, pendingOrders: 0 });

  useEffect(() => {
    async function loadStats() {
      try {
        const [gallery, feed, contacts, prebooks, orders] = await Promise.all([
          getGalleryItems(),
          getFeedPosts(),
          getContactSubmissions(),
          getPrebookEntries(),
          getMerchOrders(),
        ]);
        setStats({
          gallery: gallery.length,
          feed: feed.length,
          contacts: contacts.length,
          prebooks: prebooks.length,
          orders: orders.length,
          pendingOrders: orders.filter((o) => o.status === 'pending').length,
        });
      } catch {
        // Firebase not configured
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { label: 'Gallery Items', value: stats.gallery, icon: ImageIcon, color: 'bg-blue-100 text-blue-600' },
    { label: 'Feed Posts', value: stats.feed, icon: Newspaper, color: 'bg-green-100 text-green-600' },
    { label: 'Contact Messages', value: stats.contacts, icon: Mail, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Merch Pre-books', value: stats.prebooks, icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
    { label: 'Merch Orders', value: stats.orders, icon: CreditCard, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="heading-lg text-charcoal mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-charcoal">{stat.value}</p>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ===== GALLERY PANEL =====
type UploadStatus = 'pending' | 'hashing' | 'duplicate' | 'compressing' | 'uploading' | 'done' | 'error' | 'cancelled';

interface UploadQueueEntry {
  id: string;
  file: File;
  name: string;
  status: UploadStatus;
  note: string;
  originalSize: number;
  compressedSize?: number;
  hash?: string;
}

// Global upload state — persists across panel re-renders so queue survives tab switches
let globalQueue: UploadQueueEntry[] = [];
let globalRunning = false;
let globalAbort = false;
let globalYear = new Date().getFullYear();

function GalleryPanel() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [bulkYear, setBulkYear] = useState(globalYear);
  const [queue, setQueue] = useState<UploadQueueEntry[]>(globalQueue);
  const [running, setRunning] = useState(globalRunning);

  // Backfill sizes
  const [backfilling, setBackfilling] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState<{ done: number; total: number } | null>(null);

  // Edit modal
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const syncQueue = (next: UploadQueueEntry[]) => { globalQueue = next; setQueue([...next]); };
  const patchEntry = (id: string, patch: Partial<UploadQueueEntry>) => {
    globalQueue = globalQueue.map((e) => e.id === id ? { ...e, ...patch } : e);
    setQueue([...globalQueue]);
  };

  const loadItems = async () => {
    try { setItems(await getGalleryItems()); } catch {}
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync running state from global on mount (if upload was in progress)
  useEffect(() => { setRunning(globalRunning); }, []);

  const handleFilePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // New picks are ADDED to the queue (scheduled), not replacing it
    const newEntries: UploadQueueEntry[] = files.map((f) => ({
      id: `${Date.now()}_${Math.random()}`,
      file: f,
      name: f.name.replace(/\.[^.]+$/, ''),
      status: 'pending' as UploadStatus,
      note: formatFileSize(f.size),
      originalSize: f.size,
    }));
    syncQueue([...globalQueue, ...newEntries]);
    // Reset input so same files can be re-added after clearing
    e.target.value = '';
  };

  const handleBulkUpload = async () => {
    if (!globalQueue.length || globalRunning) return;
    globalRunning = true;
    globalAbort = false;
    globalYear = bulkYear;
    setRunning(true);

    // Fetch existing hashes once before the loop
    let existingHashes: Set<string> = new Set();
    try { existingHashes = await getGalleryHashes(); } catch {}

    for (const entry of globalQueue) {
      if (globalAbort) {
        // Mark remaining pending as cancelled
        if (entry.status === 'pending') patchEntry(entry.id, { status: 'cancelled', note: 'Cancelled' });
        continue;
      }
      if (entry.status === 'done' || entry.status === 'duplicate' || entry.status === 'cancelled') continue;

      try {
        // Hash for duplicate detection
        patchEntry(entry.id, { status: 'hashing', note: 'Checking duplicate…' });
        const hash = await hashFile(entry.file);
        if (existingHashes.has(hash)) {
          patchEntry(entry.id, { status: 'duplicate', note: 'Duplicate — skipped', hash });
          continue;
        }

        // Compress
        patchEntry(entry.id, { status: 'compressing', note: 'Compressing…', hash });
        const compressed = await compressImage(entry.file);

        // Upload
        patchEntry(entry.id, { status: 'uploading', note: `Uploading ${formatFileSize(compressed.size)}…`, compressedSize: compressed.size });
        const path = `gallery/${bulkYear}/${Date.now()}_${compressed.name}`;
        const imageUrl = await uploadImage(compressed, path);
        await addGalleryItem({
          title: entry.name, imageUrl, year: bulkYear,
          category: '', type: 'image',
          fileSize: compressed.size,
          originalSize: entry.originalSize,
          fileHash: hash,
        });

        // Track hash so subsequent duplicates in the same batch are caught
        existingHashes.add(hash);
        patchEntry(entry.id, { status: 'done', note: `Done · ${formatFileSize(compressed.size)}`, compressedSize: compressed.size });
      } catch {
        patchEntry(entry.id, { status: 'error', note: 'Failed' });
      }
    }

    globalRunning = false;
    setRunning(false);
    await loadItems();
  };

  const handleCancel = () => {
    globalAbort = true;
    // Mark all pending immediately
    globalQueue = globalQueue.map((e) =>
      e.status === 'pending' ? { ...e, status: 'cancelled' as UploadStatus, note: 'Cancelled' } : e
    );
    setQueue([...globalQueue]);
  };

  const handleClearQueue = () => {
    if (globalRunning) return;
    globalQueue = [];
    setQueue([]);
  };

  const removeEntry = (id: string) => {
    if (globalRunning) return;
    syncQueue(globalQueue.filter((e) => e.id !== id));
  };

  const done = queue.filter((e) => e.status === 'done').length;
  const duplicates = queue.filter((e) => e.status === 'duplicate').length;
  const errors = queue.filter((e) => e.status === 'error').length;
  const pending = queue.filter((e) => e.status === 'pending').length;
  const allSettled = queue.length > 0 && queue.every((e) => ['done', 'error', 'duplicate', 'cancelled'].includes(e.status));
  const progressPct = queue.length ? Math.round(((done + duplicates + errors) / queue.length) * 100) : 0;

  const totalGallerySize = items.reduce((sum, i) => sum + (i.fileSize ?? 0), 0);
  const missingSizeCount = items.filter((i) => !i.fileSize).length;

  const handleBackfillSizes = async () => {
    if (backfilling) return;
    setBackfilling(true);
    setBackfillProgress({ done: 0, total: 0 });
    try {
      await backfillGallerySizes((done, total) => setBackfillProgress({ done, total }));
      await loadItems();
    } catch { alert('Backfill failed.'); }
    setBackfilling(false);
    setBackfillProgress(null);
  };

  const openEdit = (item: GalleryItem) => {
    setEditId(item.id);
    setEditTitle(item.title);
    setEditCategory(item.category ?? '');
    setEditDescription(item.description ?? '');
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await updateGalleryItem(editId, { title: editTitle, category: editCategory, description: editDescription });
      setItems((prev) => prev.map((i) =>
        i.id === editId ? { ...i, title: editTitle, category: editCategory, description: editDescription } : i
      ));
      setEditId(null);
    } catch { alert('Save failed.'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gallery item?')) return;
    try { await deleteGalleryItem(id); await loadItems(); } catch { alert('Delete failed.'); }
  };

  const statusIcon = (s: UploadStatus) => {
    if (s === 'done') return <CheckCircle size={14} className="text-green-500 shrink-0" />;
    if (s === 'duplicate') return <Copy size={14} className="text-amber-500 shrink-0" />;
    if (s === 'error') return <X size={14} className="text-red-500 shrink-0" />;
    if (s === 'cancelled') return <X size={14} className="text-gray-400 shrink-0" />;
    if (s === 'hashing' || s === 'compressing' || s === 'uploading') return <Loader2 size={14} className="text-maroon animate-spin shrink-0" />;
    return <div className="w-3.5 h-3.5 rounded-full bg-gray-300 shrink-0" />;
  };

  const statusBg = (s: UploadStatus) => {
    if (s === 'done') return 'bg-green-50';
    if (s === 'duplicate') return 'bg-amber-50';
    if (s === 'error') return 'bg-red-50';
    if (s === 'cancelled') return 'bg-gray-50';
    if (s === 'hashing' || s === 'compressing' || s === 'uploading') return 'bg-blue-50';
    return '';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Edit modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setEditId(null); }}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-charcoal">Edit Gallery Item</h3>
              <button onClick={() => setEditId(null)}><X size={18} className="text-gray-400 hover:text-charcoal" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Category</label>
                <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="e.g. Performance, Backstage…" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSaveEdit} disabled={saving} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
                <Save size={14} /> {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditId(null)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="heading-lg text-charcoal">Gallery Management</h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-xs text-gray-400">
              {items.length} images
              {totalGallerySize > 0 && (
                <> · Total size: <span className="font-medium text-gray-600">{formatFileSize(totalGallerySize)}</span></>
              )}
              {missingSizeCount > 0 && (
                <span className="text-amber-500 ml-1">· {missingSizeCount} without size data</span>
              )}
            </p>
            {missingSizeCount > 0 && !backfilling && (
              <button
                onClick={handleBackfillSizes}
                className="text-xs text-maroon hover:underline flex items-center gap-1"
              >
                <Download size={11} /> Calculate missing sizes
              </button>
            )}
            {backfilling && backfillProgress && (
              <span className="text-xs text-maroon flex items-center gap-1">
                <Loader2 size={11} className="animate-spin" />
                {backfillProgress.done}/{backfillProgress.total} images…
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} className="btn-primary text-sm flex items-center gap-2">
          <Upload size={16} /> {running ? 'View Queue' : 'Bulk Upload'}
        </button>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal">Bulk Upload Queue</h3>
            {running && (
              <span className="flex items-center gap-1.5 text-xs text-maroon font-medium">
                <Loader2 size={12} className="animate-spin" /> Uploading…
              </span>
            )}
          </div>

          {/* Year + file picker */}
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Year</label>
              <input
                type="number"
                value={bulkYear}
                onChange={(e) => { const y = parseInt(e.target.value) || new Date().getFullYear(); setBulkYear(y); globalYear = y; }}
                disabled={running}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none disabled:opacity-50"
              />
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-gray-500 mb-1">
                Add images {queue.length > 0 && <span className="text-maroon">(adds to queue)</span>}
              </label>
              <input
                type="file" accept="image/*" multiple
                onChange={handleFilePick}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-maroon/10 file:text-maroon file:text-sm file:font-medium hover:file:bg-maroon/20 cursor-pointer"
              />
            </div>
          </div>

          {/* Progress bar */}
          {queue.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{done} done · {duplicates} duplicate{duplicates !== 1 ? 's' : ''} skipped · {errors} failed · {pending} pending</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-maroon rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Queue list */}
          {queue.length > 0 && (
            <div className="border border-gray-100 rounded-lg overflow-hidden max-h-64 overflow-y-auto divide-y divide-gray-50">
              {queue.map((entry) => (
                <div key={entry.id} className={`flex items-center gap-3 px-4 py-2.5 ${statusBg(entry.status)}`}>
                  {statusIcon(entry.status)}
                  <span className="flex-1 text-sm text-charcoal truncate">{entry.name}</span>
                  <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                    {formatFileSize(entry.originalSize)}
                    {entry.compressedSize && entry.compressedSize !== entry.originalSize && (
                      <span className="text-green-600 ml-1">→ {formatFileSize(entry.compressedSize)}</span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">{entry.note}</span>
                  {!running && entry.status !== 'done' && (
                    <button onClick={() => removeEntry(entry.id)} className="shrink-0 text-gray-300 hover:text-red-400 transition-colors ml-1">
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap">
            {!allSettled ? (
              <button
                onClick={handleBulkUpload}
                disabled={!queue.filter((e) => e.status === 'pending').length || running}
                className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {running
                  ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                  : <><Upload size={14} /> Upload {pending} image{pending !== 1 ? 's' : ''}</>
                }
              </button>
            ) : (
              <button onClick={() => { setShowUpload(false); handleClearQueue(); }} className="btn-primary text-sm flex items-center gap-2">
                <CheckCircle size={14} /> Done
              </button>
            )}

            {running ? (
              <button onClick={handleCancel} className="btn-secondary text-sm text-red-500 border-red-200 hover:border-red-400 flex items-center gap-2">
                <X size={14} /> Cancel remaining
              </button>
            ) : (
              <>
                {queue.length > 0 && !allSettled && (
                  <button onClick={handleClearQueue} className="btn-secondary text-sm flex items-center gap-2">
                    <Trash2 size={14} /> Clear queue
                  </button>
                )}
                <button onClick={() => setShowUpload(false)} className="btn-secondary text-sm">
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Gallery grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <ImageIcon size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No gallery items yet</p>
            <p className="text-sm mt-1">Upload images using the button above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4">
            {items.map((item) => (
              <div key={item.id} className="relative group rounded-lg overflow-hidden aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs gap-1 p-2">
                  <span className="font-medium text-center line-clamp-2">{item.title || <span className="italic opacity-60">No title</span>}</span>
                  <span className="opacity-70">{item.year}{item.category ? ` · ${item.category}` : ''}</span>
                  {item.fileSize && <span className="opacity-50">{formatFileSize(item.fileSize)}</span>}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openEdit(item)} className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                      <Edit size={11} /> Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="bg-red-500/80 hover:bg-red-600 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                      <Trash2 size={11} /> Del
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ===== WORKSHOP GALLERY PANEL =====

let globalWsQueue: UploadQueueEntry[] = [];
let globalWsRunning = false;
let globalWsAbort = false;
let globalWsYear = new Date().getFullYear();

function WorkshopGalleryPanel() {
  const [items, setItems] = useState<WorkshopGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'upload' | 'pick'>('upload');
  const [showUpload, setShowUpload] = useState(false);
  const [wsYear, setWsYear] = useState(globalWsYear);
  const [queue, setQueue] = useState<UploadQueueEntry[]>(globalWsQueue);
  const [running, setRunning] = useState(globalWsRunning);

  // Gallery picker state
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<Set<string>>(new Set());
  const [pickerYear, setPickerYear] = useState(globalWsYear);
  const [pickerAdding, setPickerAdding] = useState(false);

  const syncQueue = (next: UploadQueueEntry[]) => { globalWsQueue = next; setQueue([...next]); };
  const patchEntry = (id: string, patch: Partial<UploadQueueEntry>) => {
    globalWsQueue = globalWsQueue.map((e) => e.id === id ? { ...e, ...patch } : e);
    setQueue([...globalWsQueue]);
  };

  const loadItems = async () => {
    try { setItems(await getWorkshopGalleryItems()); } catch {}
    setLoading(false);
  };

  const loadGalleryItems = async () => {
    if (galleryItems.length > 0) return;
    setGalleryLoading(true);
    try { setGalleryItems(await getGalleryItems()); } catch {}
    setGalleryLoading(false);
  };

  useEffect(() => { loadItems(); }, []);
  useEffect(() => { setRunning(globalWsRunning); }, []);

  const handleFilePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newEntries: UploadQueueEntry[] = files.map((f) => ({
      id: `${Date.now()}_${Math.random()}`,
      file: f,
      name: f.name.replace(/\.[^.]+$/, ''),
      status: 'pending' as UploadStatus,
      note: formatFileSize(f.size),
      originalSize: f.size,
    }));
    syncQueue([...globalWsQueue, ...newEntries]);
    e.target.value = '';
  };

  const handleBulkUpload = async () => {
    if (!globalWsQueue.length || globalWsRunning) return;
    globalWsRunning = true;
    globalWsAbort = false;
    globalWsYear = wsYear;
    setRunning(true);

    let existingHashes: Set<string> = new Set();
    try { existingHashes = await getWorkshopGalleryHashes(); } catch {}

    for (const entry of globalWsQueue) {
      if (globalWsAbort) {
        if (entry.status === 'pending') patchEntry(entry.id, { status: 'cancelled', note: 'Cancelled' });
        continue;
      }
      if (entry.status === 'done' || entry.status === 'duplicate' || entry.status === 'cancelled') continue;

      try {
        patchEntry(entry.id, { status: 'hashing', note: 'Checking duplicate…' });
        const hash = await hashFile(entry.file);
        if (existingHashes.has(hash)) {
          patchEntry(entry.id, { status: 'duplicate', note: 'Duplicate — skipped', hash });
          continue;
        }

        patchEntry(entry.id, { status: 'compressing', note: 'Compressing…', hash });
        const compressed = await compressImage(entry.file);

        patchEntry(entry.id, { status: 'uploading', note: `Uploading ${formatFileSize(compressed.size)}…`, compressedSize: compressed.size });
        const path = `workshop_gallery/${wsYear}/${Date.now()}_${compressed.name}`;
        const imageUrl = await uploadImage(compressed, path);
        await addWorkshopGalleryItem({
          imageUrl, year: wsYear,
          fileSize: compressed.size,
          originalSize: entry.originalSize,
          fileHash: hash,
        });

        existingHashes.add(hash);
        patchEntry(entry.id, { status: 'done', note: `Done · ${formatFileSize(compressed.size)}`, compressedSize: compressed.size });
      } catch {
        patchEntry(entry.id, { status: 'error', note: 'Failed' });
      }
    }

    globalWsRunning = false;
    setRunning(false);
    await loadItems();
  };

  const handleCancel = () => {
    globalWsAbort = true;
    globalWsQueue = globalWsQueue.map((e) =>
      e.status === 'pending' ? { ...e, status: 'cancelled' as UploadStatus, note: 'Cancelled' } : e
    );
    setQueue([...globalWsQueue]);
  };

  const handleClearQueue = () => {
    if (globalWsRunning) return;
    globalWsQueue = [];
    setQueue([]);
  };

  const removeEntry = (id: string) => {
    if (globalWsRunning) return;
    syncQueue(globalWsQueue.filter((e) => e.id !== id));
  };

  const handlePickFromGallery = async () => {
    if (selectedGallery.size === 0 || pickerAdding) return;
    setPickerAdding(true);
    try {
      for (const galleryId of selectedGallery) {
        const galleryItem = galleryItems.find((g) => g.id === galleryId);
        if (galleryItem) {
          await addWorkshopGalleryItem({
            imageUrl: galleryItem.imageUrl,
            year: pickerYear,
            alt: galleryItem.title,
            fileSize: galleryItem.fileSize,
            originalSize: galleryItem.originalSize,
            fileHash: galleryItem.fileHash,
          });
        }
      }
      setSelectedGallery(new Set());
      setShowPicker(false);
      await loadItems();
    } catch {
      alert('Failed to add photos. Please try again.');
    } finally {
      setPickerAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workshop image?')) return;
    try { await deleteWorkshopGalleryItem(id); await loadItems(); } catch { alert('Delete failed.'); }
  };

  const done = queue.filter((e) => e.status === 'done').length;
  const duplicates = queue.filter((e) => e.status === 'duplicate').length;
  const errors = queue.filter((e) => e.status === 'error').length;
  const pending = queue.filter((e) => e.status === 'pending').length;
  const allSettled = queue.length > 0 && queue.every((e) => ['done', 'error', 'duplicate', 'cancelled'].includes(e.status));
  const progressPct = queue.length ? Math.round(((done + duplicates + errors) / queue.length) * 100) : 0;

  const totalSize = items.reduce((sum, i) => sum + (i.fileSize ?? 0), 0);
  const yearGroups = items.reduce((acc, item) => {
    if (!acc[item.year]) acc[item.year] = [];
    acc[item.year].push(item);
    return acc;
  }, {} as Record<number, WorkshopGalleryItem[]>);
  const sortedYears = Object.keys(yearGroups).map(Number).sort((a, b) => b - a);

  const statusIcon = (s: UploadStatus) => {
    if (s === 'done') return <CheckCircle size={14} className="text-green-500 shrink-0" />;
    if (s === 'duplicate') return <Copy size={14} className="text-amber-500 shrink-0" />;
    if (s === 'error') return <X size={14} className="text-red-500 shrink-0" />;
    if (s === 'cancelled') return <X size={14} className="text-gray-400 shrink-0" />;
    if (s === 'hashing' || s === 'compressing' || s === 'uploading') return <Loader2 size={14} className="text-maroon animate-spin shrink-0" />;
    return <div className="w-3.5 h-3.5 rounded-full bg-gray-300 shrink-0" />;
  };

  const statusBg = (s: UploadStatus) => {
    if (s === 'done') return 'bg-green-50';
    if (s === 'duplicate') return 'bg-amber-50';
    if (s === 'error') return 'bg-red-50';
    if (s === 'cancelled') return 'bg-gray-50';
    if (s === 'hashing' || s === 'compressing' || s === 'uploading') return 'bg-blue-50';
    return '';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Gallery Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowPicker(false); }}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="font-semibold text-charcoal">Pick from Gallery</h3>
              <button onClick={() => setShowPicker(false)}><X size={18} className="text-gray-400 hover:text-charcoal" /></button>
            </div>
            <div className="mb-4 shrink-0">
              <label className="block text-xs text-gray-500 mb-1">Assign to year</label>
              <input type="number" value={pickerYear} onChange={(e) => setPickerYear(parseInt(e.target.value) || new Date().getFullYear())} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none" />
            </div>
            {galleryLoading ? (
              <div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-maroon" /></div>
            ) : (
              <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg p-4 min-h-0">
                <div className="grid grid-cols-3 gap-3">
                  {galleryItems.map((item) => (
                    <div key={item.id} className="relative">
                      <label className="cursor-pointer block relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imageUrl} alt={item.title} className="w-full h-24 object-cover rounded-lg border-2" style={{ borderColor: selectedGallery.has(item.id) ? '#8B3A3A' : '#e5e7eb' }} />
                        <input type="checkbox" checked={selectedGallery.has(item.id)} onChange={(e) => {
                          const newSelected = new Set(selectedGallery);
                          if (e.target.checked) newSelected.add(item.id);
                          else newSelected.delete(item.id);
                          setSelectedGallery(newSelected);
                        }} className="absolute top-1 left-1 w-4 h-4" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-4 shrink-0">
              <button onClick={handlePickFromGallery} disabled={selectedGallery.size === 0 || pickerAdding} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
                {pickerAdding ? <><Loader2 size={14} className="animate-spin" /> Adding…</> : <>Add {selectedGallery.size > 0 ? selectedGallery.size : ''} selected</>}
              </button>
              <button onClick={() => setShowPicker(false)} disabled={pickerAdding} className="btn-secondary text-sm disabled:opacity-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="heading-lg text-charcoal">Workshop Gallery Management</h2>
          <p className="text-xs text-gray-400 mt-1">{items.length} images · Total size: <span className="font-medium text-gray-600">{formatFileSize(totalSize)}</span></p>
        </div>
        <button onClick={() => { setShowUpload(!showUpload); if (!showUpload) loadGalleryItems(); }} className="btn-primary text-sm flex items-center gap-2">
          <Upload size={16} /> {running ? 'View Queue' : 'Add Photos'}
        </button>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setMode('upload')}
                className={`pb-3 px-1 font-medium text-sm transition-colors ${mode === 'upload' ? 'text-maroon border-b-2 border-maroon' : 'text-gray-500 hover:text-charcoal'}`}
              >
                Upload New
              </button>
              <button
                onClick={() => { setMode('pick'); loadGalleryItems(); }}
                className={`pb-3 px-1 font-medium text-sm transition-colors ${mode === 'pick' ? 'text-maroon border-b-2 border-maroon' : 'text-gray-500 hover:text-charcoal'}`}
              >
                Pick from Gallery
              </button>
            </div>
            {running && (
              <span className="flex items-center gap-1.5 text-xs text-maroon font-medium">
                <Loader2 size={12} className="animate-spin" /> Uploading…
              </span>
            )}
          </div>

          {mode === 'upload' ? (
            <>
              <div className="flex items-end gap-4 flex-wrap">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year</label>
                  <input type="number" value={wsYear} onChange={(e) => { const y = parseInt(e.target.value) || new Date().getFullYear(); setWsYear(y); globalWsYear = y; }} disabled={running} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none disabled:opacity-50" />
                </div>
                <div className="flex-1 min-w-48">
                  <label className="block text-xs text-gray-500 mb-1">Add images {queue.length > 0 && <span className="text-maroon">(adds to queue)</span>}</label>
                  <input type="file" accept="image/*" multiple onChange={handleFilePick} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-maroon/10 file:text-maroon file:text-sm file:font-medium hover:file:bg-maroon/20 cursor-pointer" />
                </div>
              </div>

              {queue.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{done} done · {duplicates} duplicate{duplicates !== 1 ? 's' : ''} · {errors} failed · {pending} pending</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-maroon rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              )}

              {queue.length > 0 && (
                <div className="border border-gray-100 rounded-lg overflow-hidden max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {queue.map((entry) => (
                    <div key={entry.id} className={`flex items-center gap-3 px-4 py-2.5 ${statusBg(entry.status)}`}>
                      {statusIcon(entry.status)}
                      <span className="flex-1 text-sm text-charcoal truncate">{entry.name}</span>
                      <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{formatFileSize(entry.originalSize)}{entry.compressedSize && entry.compressedSize !== entry.originalSize && <span className="text-green-600 ml-1">→ {formatFileSize(entry.compressedSize)}</span>}</span>
                      <span className="text-xs text-gray-400 shrink-0">{entry.note}</span>
                      {!running && entry.status !== 'done' && <button onClick={() => removeEntry(entry.id)} className="shrink-0 text-gray-300 hover:text-red-400 transition-colors ml-1"><X size={12} /></button>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                {!allSettled ? (
                  <button onClick={handleBulkUpload} disabled={!queue.filter((e) => e.status === 'pending').length || running} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
                    {running ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload {pending} image{pending !== 1 ? 's' : ''}</>}
                  </button>
                ) : (
                  <button onClick={() => { setShowUpload(false); handleClearQueue(); }} className="btn-primary text-sm flex items-center gap-2">
                    <CheckCircle size={14} /> Done
                  </button>
                )}
                {running ? (
                  <button onClick={handleCancel} className="btn-secondary text-sm text-red-500 border-red-200 hover:border-red-400 flex items-center gap-2">
                    <X size={14} /> Cancel
                  </button>
                ) : (
                  <>
                    {queue.length > 0 && !allSettled && (
                      <button onClick={handleClearQueue} className="btn-secondary text-sm flex items-center gap-2">
                        <Trash2 size={14} /> Clear
                      </button>
                    )}
                    <button onClick={() => setShowUpload(false)} className="btn-secondary text-sm">Close</button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setShowPicker(true)} className="btn-primary text-sm flex items-center gap-2">
                <Search size={14} /> Browse & Select from Gallery
              </button>
              <p className="text-xs text-gray-500">Showing {galleryItems.length} gallery items. Click "Browse & Select" to pick photos to add to workshop gallery.</p>
            </>
          )}
        </div>
      )}

      {/* Items grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : sortedYears.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Camera size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No workshop images yet</p>
            <p className="text-sm mt-1">Upload new images or pick from the gallery.</p>
          </div>
        ) : (
          <div className="space-y-8 p-6">
            {sortedYears.map((year) => (
              <div key={year}>
                <h3 className="text-lg font-bold text-maroon mb-4 pb-2 border-b border-maroon/20">
                  Workshop {year}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {yearGroups[year].map((item) => (
                    <div key={item.id} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.alt || 'Workshop image'} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 transition-colors">
                          <Trash2 size={20} />
                        </button>
                      </div>
                      {item.fileSize && <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{formatFileSize(item.fileSize)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ===== FEED PANEL =====
function FeedPanel() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0]);
  const [embedUrl, setEmbedUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPosts = async () => {
    try { setPosts(await getFeedPosts()); } catch {}
    setLoading(false);
  };

  useEffect(() => { loadPosts(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const resetForm = () => {
    setTitle(''); setDescription(''); setEmbedUrl(''); setImageFile(null);
    setPostDate(new Date().toISOString().split('T')[0]);
    setEditingId(null); setShowForm(false);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setSaving(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const compressed = await compressImage(imageFile);
        const path = `feed/${Date.now()}_${compressed.name}`;
        imageUrl = await uploadImage(compressed, path);
      }

      if (editingId) {
        const updateData: Partial<FeedPost> = { title, description, date: postDate };
        if (imageUrl) updateData.imageUrl = imageUrl;
        if (embedUrl) updateData.embedUrl = embedUrl;
        await updateFeedPost(editingId, updateData);
      } else {
        await addFeedPost({
          title,
          description,
          date: postDate,
          ...(imageUrl && { imageUrl }),
          ...(embedUrl && { embedUrl }),
        });
      }
      resetForm();
      await loadPosts();
    } catch { alert('Save failed. Check Firebase config.'); }
    setSaving(false);
  };

  const handleEdit = (post: FeedPost) => {
    setEditingId(post.id);
    setTitle(post.title);
    setDescription(post.description);
    setPostDate(typeof post.date === 'string' ? post.date.split('T')[0] : new Date(post.date).toISOString().split('T')[0]);
    setEmbedUrl(post.embedUrl || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try { await deleteFeedPost(id); await loadPosts(); } catch { alert('Delete failed.'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-lg text-charcoal">Feed Posts</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} /> New Post
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 w-full">
          <h3 className="font-semibold text-charcoal mb-4">{editingId ? 'Edit Post' : 'Create Post'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <input type="text" placeholder="Post Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none" required />
            <textarea placeholder="Description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none resize-none" required />
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Post Date</label>
              <input type="date" value={postDate} onChange={(e) => setPostDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none" required />
            </div>
            <input type="url" placeholder="Embed URL (Instagram/Facebook, optional)" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none" />
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm" />
            {imageFile && (
              <p className="text-xs text-gray-500">Original: {formatFileSize(imageFile.size)} — will be auto-compressed before upload</p>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                {saving ? 'Compressing & Saving...' : editingId ? 'Update Post' : 'Create Post'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3 w-full">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center w-full"><div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500 w-full">
            <Newspaper size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No feed posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-4 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {post.imageUrl && <img src={post.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-charcoal text-sm">{post.title}</h4>
                <p className="text-gray-500 text-xs mt-1 truncate">{post.description}</p>
                <p className="text-gray-400 text-xs mt-1">{formatDate(post.date)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleEdit(post)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ===== CONTACTS PANEL =====
function ContactsPanel() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContacts = async () => {
    try { setContacts(await getContactSubmissions()); } catch {}
    setLoading(false);
  };

  useEffect(() => { loadContacts(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const handleMarkRead = async (id: string) => {
    try { await markContactRead(id); await loadContacts(); } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try { await deleteContact(id); await loadContacts(); } catch {}
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="heading-lg text-charcoal mb-6">Contact Submissions</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : contacts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Mail size={36} className="mx-auto mb-2 text-gray-300" />
            <p>No contact submissions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Message</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className={`border-b border-gray-50 ${!c.read ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.message}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!c.read && (
                          <button onClick={() => handleMarkRead(c.id)} className="p-1 text-blue-500 hover:text-blue-700" title="Mark read"><Eye size={14} /></button>
                        )}
                        <button onClick={() => handleDelete(c.id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ===== COUNTDOWN PANEL =====
function CountdownPanel() {
  const [date, setDate] = useState('2026-04-08');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getSiteConfig();
        if (config?.countdownDate) {
          setDate(config.countdownDate.slice(0, 10));
        }
      } catch {}
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSiteConfig({ countdownDate: `${date}T00:00:00+05:30` });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save. Check Firebase config.');
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="heading-lg text-charcoal mb-6">Countdown Settings</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
        <div className="mb-6">
          <label className="block text-sm font-medium text-charcoal mb-2">Festival Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none" />
          <p className="text-gray-500 text-xs mt-2">This date drives the countdown timer on the homepage.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Date'}
        </button>
        {saved && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 text-sm mt-3">
            ✓ Countdown date saved successfully!
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

// ===== MERCH PANEL (with sub-tabs) =====
function MerchPanel() {
  const [subTab, setSubTab] = useState<'orders' | 'prebooks' | 'stock'>('orders');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="heading-lg text-charcoal mb-4">Merchandise</h2>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { id: 'orders' as const, label: 'Orders' },
          { id: 'stock' as const, label: 'Stock & Availability' },
          { id: 'prebooks' as const, label: 'Pre-bookings' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              subTab === tab.id
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-gray-500 hover:text-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'orders' && <MerchOrdersSubTab />}
      {subTab === 'stock' && <MerchStockSubTab />}
      {subTab === 'prebooks' && <MerchPrebooksSubTab />}
    </motion.div>
  );
}

// ===== Stock management sub-tab =====
function MerchStockSubTab() {
  const [stockDocs, setStockDocs] = useState<Record<string, StockDoc>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  // 'add' = add to existing stock, 'set' = set absolute value
  const [stockMode, setStockMode] = useState<'add' | 'set'>('add');
  // Per-size edit values: { "tshirt::36 (S)": "10", "slingbag": "50" }
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const formatResumedDate = (value: unknown): string => {
    try {
      // Supports ISO strings and Firestore Timestamp-like objects.
      const date =
        value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)
          ? ((value as { toDate: () => Date }).toDate())
          : new Date(String(value ?? ''));
      if (Number.isNaN(date.getTime())) return 'Unknown date';
      return date.toLocaleDateString('en-IN');
    } catch {
      return 'Unknown date';
    }
  };

  const loadStock = async () => {
    try {
      const docs = await getStockDocs();
      setStockDocs(docs);
      // Initialize edit values
      const vals: Record<string, string> = {};
      PRODUCTS.forEach((p) => {
        const doc = docs[p.id];
        if (p.sizes && p.sizes.length > 0) {
          // Per-size values
          p.sizes.forEach((size) => {
            const sizeCount = doc?.sizes?.[size] ?? doc?.count ?? -1;
            vals[`${p.id}::${size}`] = sizeCount === -1 ? '' : String(sizeCount);
          });
        } else {
          const count = doc?.count ?? -1;
          vals[p.id] = count === -1 ? '' : String(count);
        }
      });
      setEditValues(vals);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadStock(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const getProductStatus = (productId: string): 'paused' | 'unlimited' | 'limited' => {
    const doc = stockDocs[productId];
    if (!doc) return 'unlimited';
    if (doc.count === 0) return 'paused';
    // Check if all sizes are unlimited
    const product = PRODUCTS.find((p) => p.id === productId);
    if (product?.sizes && doc.sizes) {
      const allUnlimited = product.sizes.every((s) => (doc.sizes?.[s] ?? doc.count) === -1);
      if (allUnlimited && doc.count === -1) return 'unlimited';
      return 'limited';
    }
    return doc.count === -1 ? 'unlimited' : 'limited';
  };

  const handleSaveSizeStock = async (productId: string, size: string) => {
    const key = `${productId}::${size}`;
    const val = editValues[key]?.trim();
    const quantity = val === '' ? 0 : parseInt(val, 10);
    if (isNaN(quantity) || quantity < 0) {
      alert('Enter a valid non-negative number.');
      return;
    }
    if (stockMode === 'add' && quantity === 0) return;

    // Confirmation with before → after preview
    const current = stockDocs[productId]?.sizes?.[size] ?? stockDocs[productId]?.count ?? -1;
    const after = stockMode === 'add'
      ? (current === -1 ? quantity : current + quantity)
      : quantity;
    const currentLabel = current === -1 ? '∞ (unlimited)' : String(current);
    const msg = stockMode === 'add'
      ? `Add ${quantity} units to ${size}?\n\nCurrent: ${currentLabel}\nAfter:     ${after}\n\nThis cannot be undone.`
      : `Override ${size} stock to exactly ${quantity}?\n\nCurrent: ${currentLabel}\nAfter:     ${quantity}`;
    if (!confirm(msg)) return;

    setSaving(key);
    try {
      if (stockMode === 'set') {
        // Directly set the stock to this value
        await setSizeStock(productId, size, quantity);
        setStockDocs((prev) => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            count: prev[productId]?.count ?? -1,
            sizes: { ...prev[productId]?.sizes, [size]: quantity },
          },
        }));
      } else {
        // Add to existing stock
        const next = await addSizeStock(productId, size, quantity);
        setStockDocs((prev) => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            count: prev[productId]?.count ?? -1,
            sizes: { ...prev[productId]?.sizes, [size]: next },
          },
        }));
      }
      setEditValues((prev) => ({ ...prev, [key]: '' }));
    } catch {
      alert('Failed to update stock.');
    }
    setSaving(null);
  };

  const handleSaveProductStock = async (productId: string) => {
    const val = editValues[productId]?.trim();
    const quantity = val === '' ? 0 : parseInt(val, 10);
    if (isNaN(quantity) || quantity < 0) {
      alert('Enter a valid non-negative number.');
      return;
    }
    if (stockMode === 'add' && quantity === 0) return;

    // Confirmation with before → after preview
    const current = stockDocs[productId]?.count ?? -1;
    const after = stockMode === 'add'
      ? (current === -1 ? quantity : current + quantity)
      : quantity;
    const currentLabel = current === -1 ? '∞ (unlimited)' : String(current);
    const productName = PRODUCTS.find((p) => p.id === productId)?.name ?? productId;
    const msg = stockMode === 'add'
      ? `Add ${quantity} units to ${productName}?\n\nCurrent: ${currentLabel}\nAfter:     ${after}\n\nThis cannot be undone.`
      : `Override ${productName} stock to exactly ${quantity}?\n\nCurrent: ${currentLabel}\nAfter:     ${quantity}`;
    if (!confirm(msg)) return;

    setSaving(productId);
    try {
      if (stockMode === 'set') {
        // Directly set the stock to this value
        await setStockCount(productId, quantity);
        setStockDocs((prev) => ({
          ...prev,
          [productId]: { ...prev[productId], count: quantity },
        }));
      } else {
        // Add to existing stock
        const next = await addStockCount(productId, quantity);
        setStockDocs((prev) => ({
          ...prev,
          [productId]: { ...prev[productId], count: next },
        }));
      }
      setEditValues((prev) => ({ ...prev, [productId]: '' }));
    } catch {
      alert('Failed to update stock.');
    }
    setSaving(null);
  };

  const handlePauseAll = async (productId: string) => {
    setSaving(productId + '_pause');
    try {
      await setStockDoc(productId, { count: 0 });
      setStockDocs((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], count: 0 },
      }));
    } catch {
      alert('Failed to pause selling.');
    }
    setSaving(null);
  };

  const handleResumeAll = async (productId: string) => {
    setSaving(productId + '_resume');
    try {
      // Set count to -1 (unlimited) and record the resume timestamp
      await setStockDoc(productId, { count: -1, resumedFromOutOfStock: new Date().toISOString() });
      setStockDocs((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], count: -1, resumedFromOutOfStock: new Date().toISOString() },
      }));
    } catch {
      alert('Failed to resume selling.');
    }
    setSaving(null);
  };

  const handleClearWarning = async (productId: string) => {
    setSaving(productId + '_clear');
    try {
      const { doc: firestoreDoc, updateDoc: firestoreUpdateDoc, deleteField } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      if (db) {
        const ref = firestoreDoc(db, 'merch_stock', productId);
        await firestoreUpdateDoc(ref, { resumedFromOutOfStock: deleteField() });
        setStockDocs((prev) => {
          const updated = { ...prev[productId] };
          delete updated.resumedFromOutOfStock;
          return { ...prev, [productId]: updated };
        });
      }
    } catch {
      alert('Failed to clear warning.');
    }
    setSaving(null);
  };

  if (loading) {
    return <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Stock Mode Toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-600">Mode:</span>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setStockMode('add')}
            className={`px-4 py-2 text-xs font-semibold transition-colors ${
              stockMode === 'add'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            + Add Stock
          </button>
          <button
            onClick={() => setStockMode('set')}
            className={`px-4 py-2 text-xs font-semibold transition-colors border-l border-gray-200 ${
              stockMode === 'set'
                ? 'bg-amber-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Override
          </button>
        </div>
        <span className={`text-xs px-2 py-1 rounded-md ${
          stockMode === 'add'
            ? 'bg-green-50 text-green-700'
            : 'bg-amber-50 text-amber-700'
        }`}>
          {stockMode === 'add'
            ? '➕ Enter how many units you are adding to existing stock'
            : '⚠️ Override: sets stock to this exact number, ignoring current count'}
        </span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">How Stock Works</p>
        <ul className="list-disc ml-5 space-y-1 text-xs text-blue-700">
          <li><strong>Unlimited</strong> — leave stock empty. That size/product is always available.</li>
          <li><strong>Set (Exact)</strong> — enter the exact stock count. Use this to correct mistakes.</li>
          <li><strong>Add (+)</strong> — enter newly arrived quantity. Adds to the current stock.</li>
          <li><strong>Pause All</strong> — pauses entire product. Shows &quot;Out of Stock&quot; to customers.</li>
          <li><strong>Resume</strong> — resumes selling. Orders placed after resume are <span className="text-orange-600 font-bold">flagged</span> so you know they came after a stock-out.</li>
        </ul>
      </div>

      {PRODUCTS.map((product) => {
        const status = getProductStatus(product.id);
        const doc = stockDocs[product.id];
        const hasSizes = product.sizes && product.sizes.length > 0;
        const hasWarning = !!doc?.resumedFromOutOfStock;

        return (
          <div
            key={product.id}
            className={`bg-white rounded-xl border shadow-sm p-5 ${status === 'paused' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}
          >
            {/* Product header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-charcoal">{product.name}</h3>
                  <span className="text-sm text-gray-500">₹{product.price}</span>
                  {status === 'paused' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 uppercase">Selling Paused</span>
                  )}
                  {status === 'unlimited' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-600 uppercase">Unlimited</span>
                  )}
                </div>
                {hasWarning && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                      ⚠ Resumed from out-of-stock on {formatResumedDate(doc?.resumedFromOutOfStock)}
                    </span>
                    <button
                      onClick={() => handleClearWarning(product.id)}
                      disabled={saving !== null}
                      className="text-[10px] text-gray-400 hover:text-charcoal underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {status !== 'paused' ? (
                  <button
                    onClick={() => handlePauseAll(product.id)}
                    disabled={saving !== null}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X size={12} /> Pause All
                  </button>
                ) : (
                  <button
                    onClick={() => handleResumeAll(product.id)}
                    disabled={saving !== null}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-50"
                  >
                    <CheckCircle size={12} /> Resume All
                  </button>
                )}
              </div>
            </div>

            {/* Per-size stock (for products with sizes) */}
            {hasSizes && status !== 'paused' && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">Stock per Size</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.sizes!.map((size) => {
                    const key = `${product.id}::${size}`;
                    const sizeStock = doc?.sizes?.[size] ?? doc?.count ?? -1;
                    const sizeOos = sizeStock === 0;
                    return (
                      <div
                        key={size}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${sizeOos ? 'border-red-200 bg-red-50/50' : 'border-gray-100 bg-gray-50/50'}`}
                      >
                        <span className={`text-sm font-semibold w-20 ${sizeOos ? 'text-red-600' : 'text-charcoal'}`}>{size}</span>
                        {/* Current stock badge */}
                        {sizeStock !== -1 && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            sizeOos ? 'bg-red-100 text-red-600' : sizeStock <= 5 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {sizeOos ? '0 left' : `${sizeStock} left`}
                          </span>
                        )}
                        {sizeStock === -1 && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600 shrink-0">∞</span>
                        )}
                        <div className="flex items-center gap-1">
                          {stockMode === 'add' && <span className="text-green-600 font-bold text-sm">+</span>}
                          <input
                            type="number"
                            min="0"
                            placeholder={stockMode === 'add' ? 'qty' : 'set to'}
                            value={editValues[key] ?? ''}
                            onChange={(e) => setEditValues((prev) => ({ ...prev, [key]: e.target.value }))}
                            className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-maroon outline-none text-center"
                          />
                        </div>
                        <button
                          onClick={() => handleSaveSizeStock(product.id, size)}
                          disabled={saving === key}
                          className={`px-2 py-1.5 text-white text-[10px] font-semibold rounded-md disabled:opacity-50 ${
                            stockMode === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600'
                          }`}
                        >
                          {saving === key ? <Loader2 size={10} className="animate-spin" /> : stockMode === 'add' ? '+ Add' : 'Override'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Single stock input for products without sizes */}
            {!hasSizes && status !== 'paused' && (
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3">
                  {/* Current stock badge */}
                  {doc && doc.count !== -1 && (
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-lg shrink-0 ${
                      doc.count === 0 ? 'bg-red-100 text-red-600' : doc.count <= 10 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {doc.count === 0 ? 'Out of Stock' : `${doc.count} in stock`}
                    </span>
                  )}
                  {(!doc || doc.count === -1) && (
                    <span className="text-sm font-bold px-3 py-1.5 rounded-lg bg-green-100 text-green-600 shrink-0">∞ Unlimited</span>
                  )}
                  <div className="flex items-center gap-1">
                    {stockMode === 'add' && <span className="text-green-600 font-bold text-lg leading-none">+</span>}
                    <input
                      type="number"
                      min="0"
                      placeholder={stockMode === 'add' ? 'qty to add' : 'set to'}
                      value={editValues[product.id] ?? ''}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, [product.id]: e.target.value }))}
                      className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleSaveProductStock(product.id)}
                    disabled={saving === product.id}
                    className={`px-3 py-2 text-white text-xs font-semibold rounded-lg disabled:opacity-50 ${
                      stockMode === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                  >
                    {saving === product.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : stockMode === 'add'
                      ? <><Plus size={12} /> Add Stock</>
                      : <><Save size={12} /> Override</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MerchPrebooksSubTab() {
  const [entries, setEntries] = useState<MerchPrebook[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = async () => {
    try { setEntries(await getPrebookEntries()); } catch {}
    setLoading(false);
  };

  useEffect(() => { loadEntries(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pre-booking?')) return;
    try { await deletePrebook(id); await loadEntries(); } catch {}
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {loading ? (
        <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : entries.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <ShoppingBag size={36} className="mx-auto mb-2 text-gray-300" />
          <p>No pre-bookings yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mobile</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Size</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Qty</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium">{entry.name}</td>
                  <td className="px-4 py-3 text-gray-600">{entry.mobile ? `+91 ${entry.mobile}` : '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{entry.email}</td>
                  <td className="px-4 py-3">{entry.item}</td>
                  <td className="px-4 py-3">{entry.size}</td>
                  <td className="px-4 py-3">{entry.quantity}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(entry.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(entry.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===== MERCH ORDERS — helpers =====

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  verified:  { label: 'New Order',  color: 'text-blue-700',   bg: 'bg-blue-100',   icon: CreditCard },
  packed:    { label: 'Packed',     color: 'text-amber-700',  bg: 'bg-amber-100',  icon: Package },
  shipped:   { label: 'Shipped',    color: 'text-purple-700', bg: 'bg-purple-100', icon: Truck },
  delivered: { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  rejected:  { label: 'Rejected',   color: 'text-red-700',    bg: 'bg-red-100',    icon: X },
};

const FULFILLMENT_FLOW: MerchOrderStatus[] = ['verified', 'packed', 'shipped', 'delivered'];

function getNextStatus(current: MerchOrderStatus): MerchOrderStatus | null {
  const normalized = current === 'manual_verified' ? 'verified' : current;
  const idx = FULFILLMENT_FLOW.indexOf(normalized);
  if (idx === -1 || idx >= FULFILLMENT_FLOW.length - 1) return null;
  return FULFILLMENT_FLOW[idx + 1];
}

function formatAddress(addr?: DeliveryAddress): string {
  if (!addr) return '';
  return [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
}

function exportOrdersCSV(orders: MerchOrder[]) {
  const headers = [
    'Order ID', 'Date', 'Status',
    'Customer Name', 'Email', 'Mobile',
    'Addr Line1', 'Addr Line2', 'City', 'State', 'Pincode',
    'Items', 'Total', 'Payment ID', 'Payment Method',
    'Tracking Carrier', 'Tracking ID', 'Admin Notes',
  ];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = orders.map((o) => [
    o.orderId,
    typeof o.createdAt === 'string' ? o.createdAt : new Date(o.createdAt as Date).toISOString(),
    o.status,
    o.customerName,
    o.customerEmail,
    o.customerMobile,
    o.deliveryAddress?.line1 ?? '',
    o.deliveryAddress?.line2 ?? '',
    o.deliveryAddress?.city ?? '',
    o.deliveryAddress?.state ?? '',
    o.deliveryAddress?.pincode ?? '',
    o.items.map((i) => `${i.name ?? i.productId ?? '?'}${i.size !== 'N/A' ? ` (${i.size})` : ''} x${i.quantity}`).join('; '),
    String(o.total),
    o.razorpayPaymentId ?? o.upiRef ?? '',
    o.paymentMethod ?? '',
    o.trackingCarrier ?? '',
    o.trackingId ?? '',
    o.adminNotes ?? '',
  ].map(escape).join(','));

  const csv = [headers.map(escape).join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `merch-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Unique product IDs across all orders
function getProductIds(orders: MerchOrder[]): string[] {
  const ids = new Set<string>();
  orders.forEach((o) => o.items.forEach((i) => ids.add(i.productId)));
  return Array.from(ids);
}

// Friendly product names
const PRODUCT_NAMES: Record<string, string> = {
  tshirt: 'T-Shirt',
  slingbag: 'Sling Bag',
};

// ===== Single order card =====
function OrderCard({ order, onUpdate, onDelete, onPrint }: {
  order: MerchOrder;
  onUpdate: () => void;
  onDelete: (id: string) => void;
  onPrint?: (order: MerchOrder) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showShipForm, setShowShipForm] = useState(false);
  const [trackingId, setTrackingId] = useState(order.trackingId ?? '');
  const [trackingCarrier, setTrackingCarrier] = useState(order.trackingCarrier ?? '');
  const [notes, setNotes] = useState(order.adminNotes ?? '');
  const [showNotes, setShowNotes] = useState(false);
  const [emailSent, setEmailSent] = useState<'sent' | 'failed' | null>(null);

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.verified;
  const StatusIcon = cfg.icon;
  const next = getNextStatus(order.status);

  const advanceStatus = async (targetStatus?: MerchOrderStatus) => {
    const target = targetStatus ?? next;
    if (!target) return;
    const LABELS: Partial<Record<MerchOrderStatus, string>> = {
      packed: 'Packed',
      shipped: 'Shipped',
      delivered: 'Delivered',
    };
    if (!confirm(`Mark order ${order.orderId} as ${LABELS[target] ?? target}?`)) return;
    setUpdating(true);
    try {
      const extra: Partial<MerchOrder> = {};
      if (target === 'packed') extra.packedAt = new Date().toISOString();
      if (target === 'shipped') {
        extra.shippedAt = new Date().toISOString();
        extra.trackingId = trackingId.trim() || undefined;
        extra.trackingCarrier = trackingCarrier.trim() || undefined;
      }
      if (target === 'delivered') extra.deliveredAt = new Date().toISOString();
      await updateMerchOrderStatus(order.id, target, extra);

      // Send status-change email and notify admin of result
      if (order.customerEmail && (target === 'packed' || target === 'shipped' || target === 'delivered')) {
        try {
          const emailRes = await fetch('/api/status-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: order.customerEmail,
              customerName: order.customerName,
              orderId: order.orderId,
              status: target,
              trackingCarrier: target === 'shipped' ? trackingCarrier.trim() : undefined,
              trackingId: target === 'shipped' ? trackingId.trim() : undefined,
            }),
          });
          if (emailRes.ok) {
            setEmailSent('sent');
            // Persist that email was sent for this status
            try {
              await updateMerchOrderStatus(order.id, target, {
                [`emailSentFor_${target}`]: new Date().toISOString(),
              } as unknown as Partial<MerchOrder>);
            } catch { /* best-effort persist */ }
            setTimeout(() => setEmailSent(null), 4000);
          } else {
            setEmailSent('failed');
            const errBody = await emailRes.json().catch(() => ({}));
            console.error('[admin] Status email API error:', emailRes.status, errBody);
            alert(`Status updated but email failed to send (${errBody.error ?? emailRes.status})`);
            setTimeout(() => setEmailSent(null), 6000);
          }
        } catch (emailErr) {
          setEmailSent('failed');
          console.error('[admin] Status email network error:', emailErr);
          alert('Status updated but email could not be sent (network error)');
          setTimeout(() => setEmailSent(null), 6000);
        }
      }

      onUpdate();
    } catch { alert('Failed to update order.'); }
    setUpdating(false);
    setShowShipForm(false);
  };

  const saveNotes = async () => {
    setUpdating(true);
    try {
      await updateMerchOrderStatus(order.id, order.status, { adminNotes: notes.trim() });
      onUpdate();
    } catch { alert('Failed to save notes.'); }
    setUpdating(false);
    setShowNotes(false);
  };

  const copyAddress = () => {
    const addr = formatAddress(order.deliveryAddress);
    if (addr) navigator.clipboard.writeText(`${order.customerName}\n${addr}\nPh: +91 ${order.customerMobile}`);
  };

  return (
    <div className={`bg-white rounded-xl border shadow-sm transition-all ${expanded ? 'border-maroon/30 shadow-md' : 'border-gray-100'}`}>
      {/* Compact row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
          <StatusIcon size={14} className={cfg.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-charcoal">{order.orderId}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            {order.trackingId && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                {order.trackingCarrier && `${order.trackingCarrier}: `}{order.trackingId}
              </span>
            )}
            {order.stockWarning && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600 border border-orange-200" title={order.stockWarningItems?.join(', ')}>
                ⚠ Post-restock
              </span>
            )}
            {emailSent === 'sent' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-600 border border-green-200 flex items-center gap-1 animate-pulse">
                <MailIcon size={10} /> Email sent ✓
              </span>
            )}
            {emailSent === 'failed' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 flex items-center gap-1">
                <MailIcon size={10} /> Email failed ✗
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <span className="font-medium text-charcoal">{order.customerName}</span>
            <span>₹{order.total}</span>
            <span>{order.items.map((i) => `${(i.name ?? i.productId ?? '?').replace('Gramakam ', '')}${i.size !== 'N/A' ? ` (${i.size})` : ''} ×${i.quantity}`).join(', ')}</span>
          </div>
        </div>

        <div className="text-xs text-gray-400 shrink-0 hidden sm:block">{formatDate(order.createdAt)}</div>
        {expanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Customer</p>
              <p className="text-sm font-medium text-charcoal">{order.customerName}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} /> +91 {order.customerMobile}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1"><MailIcon size={10} /> {order.customerEmail}</p>
            </div>

            {/* Delivery address */}
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Delivery Address</p>
                {order.deliveryAddress && (
                  <button onClick={copyAddress} className="text-gray-400 hover:text-maroon" title="Copy address">
                    <Copy size={10} />
                  </button>
                )}
              </div>
              {order.deliveryAddress ? (
                <div className="text-xs text-gray-600 leading-relaxed">
                  <p>{order.deliveryAddress.line1}</p>
                  {order.deliveryAddress.line2 && <p>{order.deliveryAddress.line2}</p>}
                  <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} — <span className="font-mono">{order.deliveryAddress.pincode}</span></p>
                </div>
              ) : (
                <p className="text-xs text-gray-300 italic">No address provided</p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Items</p>
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-700">{item.name ?? item.productId ?? '?'}{item.size !== 'N/A' ? ` (${item.size})` : ''} ×{item.quantity}</span>
                  <span className="font-medium text-maroon">₹{(item.price ?? 0) * item.quantity}</span>
                </div>
              ))}
              {(order as any).discount > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Bulk Discount</span>
                  <span>−₹{(order as any).discount}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-1 flex justify-between text-xs font-semibold">
                <span>Total</span>
                <span className="text-maroon">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Payment info */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
            <span>Payment: <span className="font-medium text-charcoal">{order.paymentMethod === 'razorpay' ? 'Razorpay' : 'UPI Manual'}</span></span>
            {order.razorpayPaymentId && <span>Payment ID: <span className="font-mono text-charcoal">{order.razorpayPaymentId}</span></span>}
            {order.verifiedAt && <span>Verified: {new Date(order.verifiedAt).toLocaleString('en-IN')}</span>}
            {order.packedAt && <span>Packed: {new Date(order.packedAt).toLocaleString('en-IN')}</span>}
            {order.shippedAt && <span>Shipped: {new Date(order.shippedAt).toLocaleString('en-IN')}</span>}
            {order.deliveredAt && <span>Delivered: {new Date(order.deliveredAt).toLocaleString('en-IN')}</span>}
          </div>

          {/* Email sent indicators */}
          {(() => {
            const o = order as unknown as Record<string, unknown>;
            const packed = !!o.emailSentFor_packed;
            const shipped = !!o.emailSentFor_shipped;
            const delivered = !!o.emailSentFor_delivered;
            if (!packed && !shipped && !delivered) return null;
            return (
              <div className="flex items-center gap-3 text-[10px] text-green-600">
                <MailIcon size={11} className="shrink-0" />
                {packed && <span>📦 Packed email sent</span>}
                {shipped && <span>🚚 Shipped email sent</span>}
                {delivered && <span>✅ Delivered email sent</span>}
              </div>
            );
          })()}

          {/* Tracking info (if shipped) */}
          {order.trackingId && (
            <div className="bg-purple-50 rounded-lg p-3 text-xs flex items-center gap-2">
              <Truck size={14} className="text-purple-600" />
              <span className="text-purple-700 font-medium">
                {order.trackingCarrier && `${order.trackingCarrier} — `}Tracking: <span className="font-mono">{order.trackingId}</span>
              </span>
            </div>
          )}

          {/* Admin notes */}
          {order.adminNotes && !showNotes && (
            <div className="bg-yellow-50 rounded-lg p-3 text-xs text-yellow-800">
              <span className="font-semibold">Notes:</span> {order.adminNotes}
            </div>
          )}

          {/* Ship form (shown when advancing to shipped) */}
          {showShipForm && (
            <div className="bg-purple-50 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-purple-800">Enter Shipping Details</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Carrier (e.g. India Post, DTDC)"
                  value={trackingCarrier}
                  onChange={(e) => setTrackingCarrier(e.target.value)}
                  className="px-3 py-2 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                />
                <input
                  type="text"
                  placeholder="Tracking ID"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="px-3 py-2 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => advanceStatus('shipped')}
                  disabled={updating}
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Mark as Shipped'}
                </button>
                <button onClick={() => setShowShipForm(false)} className="px-4 py-2 text-xs text-gray-500 hover:text-charcoal">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Notes form */}
          {showNotes && (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Add admin notes..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon outline-none"
              />
              <div className="flex gap-2">
                <button onClick={saveNotes} disabled={updating} className="px-3 py-1.5 bg-charcoal text-white text-xs rounded-lg hover:bg-charcoal/80 disabled:opacity-50">
                  {updating ? 'Saving...' : 'Save Notes'}
                </button>
                <button onClick={() => setShowNotes(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-charcoal">Cancel</button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {/* Next status action */}
            {next && !showShipForm && (
              next === 'shipped' ? (
                <button
                  onClick={() => setShowShipForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700"
                >
                  <Truck size={13} /> Ship Order
                </button>
              ) : (
                <button
                  onClick={() => advanceStatus()}
                  disabled={updating}
                  className="flex items-center gap-1.5 px-4 py-2 bg-maroon text-white text-xs font-semibold rounded-lg hover:bg-maroon-dark disabled:opacity-50"
                >
                  {updating ? 'Updating...' : (
                    <>
                      {next === 'packed' && <><Package size={13} /> Mark as Packed</>}
                      {next === 'delivered' && <><CheckCircle size={13} /> Mark Delivered</>}
                    </>
                  )}
                </button>
              )
            )}

            {!showNotes && (
              <button
                onClick={() => setShowNotes(true)}
                className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-charcoal border border-gray-200 rounded-lg hover:border-gray-300"
              >
                <Edit size={12} /> Notes
              </button>
            )}

            {onPrint && (
              <button
                onClick={() => onPrint(order)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 hover:text-charcoal border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                title="Print address label"
              >
                <Printer size={12} /> Print Label
              </button>
            )}

            <button
              onClick={() => onDelete(order.id)}
              className="flex items-center gap-1 px-3 py-2 text-xs text-red-400 hover:text-red-600 border border-red-100 rounded-lg hover:border-red-300 ml-auto"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Main orders sub-tab =====
function MerchOrdersSubTab() {
  const [orders, setOrders] = useState<MerchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [itemFilter, setItemFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // BLE printer state
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>('disconnected');
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [printError, setPrintError] = useState<string | null>(null);

  const handleConnectPrinter = async () => {
    if (printerStatus === 'connected') {
      disconnectPrinter();
      setPrinterStatus('disconnected');
      setPrinterName(null);
      return;
    }
    setPrintError(null);
    try {
      await connectPrinter((status, name) => {
        setPrinterStatus(status);
        if (name) setPrinterName(name);
        if (status === 'disconnected') setPrinterName(null);
      });
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const handlePrint = async (order: MerchOrder) => {
    if (printerStatus !== 'connected') {
      alert('Please connect a printer first.');
      return;
    }
    setPrinterStatus('printing');
    setPrintError(null);
    try {
      await printOrderLabel(order);
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : 'Print failed');
      alert(`Print failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPrinterStatus('connected');
    }
  };

  const loadOrders = async () => {
    try { setOrders(await getMerchOrders()); } catch {}
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const handleDelete = async (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    // Restore stock only when the order actually consumed inventory
    const needsRestore =
      (order as MerchOrder & { stockDeducted?: boolean }).stockDeducted === true &&
      ((order.status !== 'rejected' && order.status !== 'pending') || (order.status === 'pending' && !(order as MerchOrder & { stockRestored?: boolean }).stockRestored));

    const confirmMsg = needsRestore
      ? 'Delete this order permanently? Stock will be restored for the items.'
      : 'Delete this order permanently?';
    if (!confirm(confirmMsg)) return;

    try {
      if (needsRestore) {
        const { restoreStock } = await import('@/lib/services');
        await restoreStock(
          order.items.map((i) => ({
            productId: i.productId,
            size: i.size !== 'N/A' ? i.size : undefined,
            quantity: i.quantity,
          }))
        );
      }
      await deleteMerchOrder(id);
      await loadOrders();
    } catch {
      alert('Failed to delete order.');
    }
  };

  // Counts per status
  const counts: Record<string, number> = {};
  orders.forEach((o) => {
    const key = o.status === 'manual_verified' ? 'verified' : o.status;
    counts[key] = (counts[key] ?? 0) + 1;
  });

  const totalRevenue = orders
    .filter((o) => o.status !== 'rejected' && o.status !== 'pending')
    .reduce((sum, o) => sum + o.total, 0);

  // Unique product IDs for item filter
  const productIds = getProductIds(orders);

  // Apply filters
  let filtered = orders;
  if (statusFilter !== 'all') {
    filtered = filtered.filter((o) =>
      statusFilter === 'verified' ? (o.status === 'verified' || o.status === 'manual_verified') : o.status === statusFilter
    );
  }
  if (itemFilter !== 'all') {
    filtered = filtered.filter((o) => o.items.some((i) => i.productId === itemFilter));
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((o) =>
      o.orderId.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerMobile.includes(q) ||
      o.trackingId?.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-4">
      {/* BLE Printer bar */}
      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {printerStatus === 'connected' ? (
            <BluetoothConnected size={16} className="text-green-500 shrink-0" />
          ) : printerStatus === 'connecting' || printerStatus === 'printing' ? (
            <Bluetooth size={16} className="text-blue-400 animate-pulse shrink-0" />
          ) : printerStatus === 'error' ? (
            <BluetoothOff size={16} className="text-red-400 shrink-0" />
          ) : (
            <BluetoothOff size={16} className="text-gray-300 shrink-0" />
          )}
          <span className="text-xs font-medium text-charcoal truncate">
            {printerStatus === 'connected' && printerName
              ? printerName
              : printerStatus === 'connecting'
              ? 'Connecting...'
              : printerStatus === 'printing'
              ? 'Printing...'
              : printerStatus === 'error'
              ? 'Connection error'
              : 'No printer connected'}
          </span>
          {printerStatus === 'connected' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 shrink-0">Ready</span>
          )}
          {printError && (
            <span className="text-[10px] text-red-500 ml-1 max-w-[200px] truncate shrink" title={printError}>{printError}</span>
          )}
        </div>
        <button
          onClick={handleConnectPrinter}
          disabled={printerStatus === 'connecting' || printerStatus === 'printing'}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 disabled:opacity-50 ${
            printerStatus === 'connected'
              ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
              : 'bg-maroon text-white hover:bg-maroon/80'
          }`}
        >
          {printerStatus === 'connected' ? (
            <><BluetoothOff size={13} /> Disconnect</>
          ) : printerStatus === 'connecting' ? (
            <><Loader2 size={13} className="animate-spin" /> Connecting...</>
          ) : (
            <><Bluetooth size={13} /> Connect Printer</>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Total',     value: orders.length,        color: 'text-charcoal' },
          { label: 'New',       value: counts.verified ?? 0, color: 'text-blue-600' },
          { label: 'Packed',    value: counts.packed ?? 0,   color: 'text-amber-600' },
          { label: 'Shipped',   value: counts.shipped ?? 0,  color: 'text-purple-600' },
          { label: 'Delivered', value: counts.delivered ?? 0, color: 'text-green-600' },
          { label: 'Revenue',   value: `₹${totalRevenue}`,  color: 'text-maroon' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg p-2.5 border border-gray-100 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter & Search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          <Filter size={13} className="text-gray-400" />
          {[
            { key: 'all', label: 'All' },
            { key: 'verified', label: 'New' },
            { key: 'packed', label: 'Packed' },
            { key: 'shipped', label: 'Shipped' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'rejected', label: 'Rejected' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.key ? 'bg-maroon text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}{f.key !== 'all' && counts[f.key] ? ` (${counts[f.key]})` : ''}
            </button>
          ))}
        </div>

        {/* Item filter */}
        {productIds.length > 1 && (
          <div className="flex items-center gap-1.5">
            <ShoppingBag size={13} className="text-gray-400" />
            <button
              onClick={() => setItemFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                itemFilter === 'all' ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Items
            </button>
            {productIds.map((pid) => (
              <button
                key={pid}
                onClick={() => setItemFilter(pid)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  itemFilter === pid ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {PRODUCT_NAMES[pid] ?? pid}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search + Export */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders, name, mobile, tracking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon outline-none"
          />
        </div>
        <button
          onClick={() => exportOrdersCSV(filtered)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-charcoal text-white text-xs font-medium hover:bg-charcoal/80 transition-colors shrink-0"
        >
          <Download size={13} /> Export CSV ({filtered.length})
        </button>
      </div>

      {/* Order cards */}
      {loading ? (
        <div className="p-12 text-center"><div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
          <CreditCard size={36} className="mx-auto mb-2 text-gray-300" />
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onUpdate={loadOrders} onDelete={handleDelete} onPrint={handlePrint} />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== MEDIA PANEL =====
function MediaPanel() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [type, setType] = useState<'newspaper' | 'link'>('newspaper');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');

  const loadItems = async () => {
    try {
      const data = await getMediaItems();
      setItems(data);
    } catch { /* Firebase not configured */ }
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const resetForm = () => {
    setTitle(''); setDescription(''); setSource('');
    setYear(new Date().getFullYear());
    setDate(new Date().toISOString().slice(0, 10));
    setImageFile(null); setLinkUrl('');
    setType('newspaper');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (type === 'newspaper' && imageFile) {
        const compressed = await compressImage(imageFile);
        const path = `media/${Date.now()}_${compressed.name}`;
        imageUrl = await uploadImage(compressed, path);
      }
      await addMediaItem({
        type,
        title,
        description: description || undefined,
        source: source || undefined,
        year,
        date,
        imageUrl,
        linkUrl: type === 'link' ? linkUrl : undefined,
      });
      resetForm();
      await loadItems();
    } catch (err: any) {
      console.error('Media save error:', err);
      alert(`Upload failed: ${err.message || 'Unknown error'}. Check console for details.`);
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media item?')) return;
    try {
      await deleteMediaItem(id);
      await loadItems();
    } catch { alert('Delete failed.'); }
  };

  const inputCls = 'px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none w-full';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-lg text-charcoal">Media &amp; News</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-charcoal mb-4">Add Media Item</h3>

          {/* Type toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setType('newspaper')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                type === 'newspaper' ? 'bg-maroon text-white border-maroon' : 'border-gray-300 text-gray-600'
              }`}
            >
              Newspaper Cutting
            </button>
            <button
              type="button"
              onClick={() => setType('link')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                type === 'link' ? 'bg-maroon text-white border-maroon' : 'border-gray-300 text-gray-600'
              }`}
            >
              News Link
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Title *" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} required />
            <input type="text" placeholder="Source (e.g., Mathrubhumi)" value={source} onChange={(e) => setSource(e.target.value)} className={inputCls} />
            <input type="number" placeholder="Year" value={year || ''} onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : new Date().getFullYear())} className={inputCls} />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} md:col-span-2 resize-none`} rows={2} />
            {type === 'newspaper' ? (
              <div className="md:col-span-2">
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className={inputCls} required />
              </div>
            ) : (
              <div className="md:col-span-2">
                <input type="url" placeholder="Article URL *" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className={inputCls} required />
              </div>
            )}
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={uploading} className="btn-primary text-sm disabled:opacity-50">
                {uploading ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Newspaper size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No media items yet</p>
            <p className="text-sm mt-1">Add newspaper cuttings or news links using the button above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                {item.imageUrl ? (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                    <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <ExternalLink size={20} className="text-blue-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-charcoal text-sm truncate">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.type === 'newspaper' ? 'Newspaper' : 'News Link'}
                    {item.source && ` · ${item.source}`}
                    {` · ${item.year}`}
                  </p>
                  {item.linkUrl && (
                    <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block mt-0.5">
                      {item.linkUrl}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ===== AWARDS PANEL =====
function AwardsPanel() {
  const [items, setItems] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [year, setYear] = useState(new Date().getFullYear());
  const [awardeeName, setAwardeeName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cashAward, setCashAward] = useState(10001);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const loadItems = async () => {
    try {
      const data = await getAwards();
      setItems(data);
    } catch { /* Firebase not configured */ }
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const resetForm = () => {
    setYear(new Date().getFullYear());
    setAwardeeName('');
    setTitle('');
    setDescription('');
    setCashAward(10001);
    setImageFile(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardeeName) return;
    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const compressed = await compressImage(imageFile);
        const path = `awards/${Date.now()}_${compressed.name}`;
        imageUrl = await uploadImage(compressed, path);
      }
      await addAward({
        year,
        awardeeName,
        title: title || undefined,
        description: description || undefined,
        cashAward,
        imageUrl,
      });
      resetForm();
      await loadItems();
    } catch (err: any) {
      console.error('Award save error:', err);
      alert(`Upload failed: ${err.message || 'Unknown error'}. Check console for details.`);
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this award?')) return;
    try {
      await deleteAward(id);
      await loadItems();
    } catch { alert('Delete failed.'); }
  };

  const inputCls = 'px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none w-full';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-lg text-charcoal">Awards Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} /> Add Award
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-charcoal mb-4">Add New Award</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="number" placeholder="Year *" value={year || ''} onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : new Date().getFullYear())} className={inputCls} required />
            <input type="text" placeholder="Awardee Name *" value={awardeeName} onChange={(e) => setAwardeeName(e.target.value)} className={inputCls} required />
            <input type="text" placeholder="Award Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            <input type="number" placeholder="Cash Award Amount" value={cashAward || ''} onChange={(e) => setCashAward(e.target.value ? parseInt(e.target.value) : 0)} className={inputCls} />
            <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} md:col-span-2 resize-none`} rows={2} />
            <div className="md:col-span-2">
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className={inputCls} />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={uploading} className="btn-primary text-sm disabled:opacity-50">
                {uploading ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Trophy size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No awards yet</p>
            <p className="text-sm mt-1">Add awards using the button above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                {item.imageUrl ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                    <Image src={item.imageUrl} alt={item.awardeeName} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <Trophy size={24} className="text-gold" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-charcoal">{item.awardeeName}</p>
                  {item.title && <p className="text-sm text-maroon">{item.title}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    {item.year}
                    {item.cashAward && ` • ₹${item.cashAward.toLocaleString()}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
