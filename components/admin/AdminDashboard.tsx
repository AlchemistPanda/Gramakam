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
} from 'lucide-react';
import {
  getGalleryItems,
  addGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
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
} from '@/lib/services';
import type {
  GalleryItem,
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

type AdminTab = 'overview' | 'gallery' | 'feed' | 'contacts' | 'countdown' | 'merch' | 'media' | 'awards';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
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
type UploadStatus = 'pending' | 'compressing' | 'uploading' | 'done' | 'error';
interface UploadQueueEntry {
  id: string;
  file: File;
  name: string;
  status: UploadStatus;
  note: string;
}

function GalleryPanel() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk upload
  const [showUpload, setShowUpload] = useState(false);
  const [bulkYear, setBulkYear] = useState(new Date().getFullYear());
  const [queue, setQueue] = useState<UploadQueueEntry[]>([]);
  const [running, setRunning] = useState(false);

  // Edit modal
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    try {
      const data = await getGalleryItems();
      setItems(data);
    } catch { /* Firebase not configured */ }
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilePick = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setQueue(files.map((f) => ({
      id: `${Date.now()}_${Math.random()}`,
      file: f,
      name: f.name.replace(/\.[^.]+$/, ''),
      status: 'pending',
      note: formatFileSize(f.size),
    })));
  };

  const patchEntry = (id: string, patch: Partial<UploadQueueEntry>) =>
    setQueue((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const handleBulkUpload = async () => {
    if (!queue.length || running) return;
    setRunning(true);
    for (const entry of queue) {
      if (entry.status === 'done') continue;
      patchEntry(entry.id, { status: 'compressing', note: 'Compressing…' });
      try {
        const compressed = await compressImage(entry.file);
        patchEntry(entry.id, { status: 'uploading', note: `Uploading ${formatFileSize(compressed.size)}…` });
        const path = `gallery/${bulkYear}/${Date.now()}_${compressed.name}`;
        const imageUrl = await uploadImage(compressed, path);
        await addGalleryItem({ title: entry.name, imageUrl, year: bulkYear, category: '', type: 'image' });
        patchEntry(entry.id, { status: 'done', note: 'Done' });
      } catch {
        patchEntry(entry.id, { status: 'error', note: 'Failed' });
      }
    }
    setRunning(false);
    await loadItems();
  };

  const allDone = queue.length > 0 && queue.every((e) => e.status === 'done' || e.status === 'error');

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
    try {
      await deleteGalleryItem(id);
      await loadItems();
    } catch { alert('Delete failed.'); }
  };

  const statusIcon = (s: UploadStatus) => {
    if (s === 'done') return <CheckCircle size={14} className="text-green-500 shrink-0" />;
    if (s === 'error') return <X size={14} className="text-red-500 shrink-0" />;
    if (s === 'compressing' || s === 'uploading') return <Loader2 size={14} className="text-maroon animate-spin shrink-0" />;
    return <div className="w-3.5 h-3.5 rounded-full bg-gray-300 shrink-0" />;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Edit modal */}
      {editId && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditId(null); }}
        >
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

      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-lg text-charcoal">Gallery Management</h2>
        <button
          onClick={() => { setShowUpload(!showUpload); setQueue([]); }}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <Upload size={16} /> Bulk Upload
        </button>
      </div>

      {showUpload && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-charcoal mb-4">Bulk Upload Images</h3>
          <div className="flex items-end gap-4 mb-4 flex-wrap">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Year <span className="text-red-400">*</span></label>
              <input
                type="number"
                value={bulkYear}
                onChange={(e) => setBulkYear(parseInt(e.target.value))}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none"
              />
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-gray-500 mb-1">Select images (multiple)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilePick}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-maroon/10 file:text-maroon file:text-sm file:font-medium hover:file:bg-maroon/20 cursor-pointer"
              />
            </div>
          </div>

          {queue.length > 0 && (
            <div className="border border-gray-100 rounded-lg overflow-hidden mb-4 max-h-52 overflow-y-auto divide-y divide-gray-50">
              {queue.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                  {statusIcon(entry.status)}
                  <span className="flex-1 text-sm text-charcoal truncate">{entry.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{entry.note}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            {!allDone ? (
              <button
                onClick={handleBulkUpload}
                disabled={!queue.length || running}
                className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {running
                  ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                  : <><Upload size={14} /> Upload{queue.length > 0 ? ` ${queue.length} image${queue.length !== 1 ? 's' : ''}` : ''}</>
                }
              </button>
            ) : (
              <button onClick={() => { setShowUpload(false); setQueue([]); }} className="btn-primary text-sm flex items-center gap-2">
                <CheckCircle size={14} /> Done
              </button>
            )}
            <button
              onClick={() => { setShowUpload(false); setQueue([]); }}
              disabled={running}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-lg text-charcoal">Feed Posts</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} /> New Post
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
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

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center"><div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">
            <Newspaper size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No feed posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-4">
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
  const [subTab, setSubTab] = useState<'orders' | 'prebooks'>('orders');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="heading-lg text-charcoal mb-4">Merchandise</h2>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { id: 'orders' as const, label: 'Orders' },
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
      {subTab === 'prebooks' && <MerchPrebooksSubTab />}
    </motion.div>
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
  const idx = FULFILLMENT_FLOW.indexOf(current);
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
    o.items.map((i) => `${i.name}${i.size !== 'N/A' ? ` (${i.size})` : ''} x${i.quantity}`).join('; '),
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
function OrderCard({ order, onUpdate, onDelete }: {
  order: MerchOrder;
  onUpdate: () => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showShipForm, setShowShipForm] = useState(false);
  const [trackingId, setTrackingId] = useState(order.trackingId ?? '');
  const [trackingCarrier, setTrackingCarrier] = useState(order.trackingCarrier ?? '');
  const [notes, setNotes] = useState(order.adminNotes ?? '');
  const [showNotes, setShowNotes] = useState(false);

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.verified;
  const StatusIcon = cfg.icon;
  const next = getNextStatus(order.status);

  const advanceStatus = async (targetStatus?: MerchOrderStatus) => {
    const target = targetStatus ?? next;
    if (!target) return;
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
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <span className="font-medium text-charcoal">{order.customerName}</span>
            <span>₹{order.total}</span>
            <span>{order.items.map((i) => `${i.name.replace('Gramakam ', '')}${i.size !== 'N/A' ? ` (${i.size})` : ''} ×${i.quantity}`).join(', ')}</span>
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
                  <span className="text-gray-700">{item.name}{item.size !== 'N/A' ? ` (${item.size})` : ''} ×{item.quantity}</span>
                  <span className="font-medium text-maroon">₹{item.price * item.quantity}</span>
                </div>
              ))}
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

  const loadOrders = async () => {
    try { setOrders(await getMerchOrders()); } catch {}
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this order permanently?')) return;
    try { await deleteMerchOrder(id); await loadOrders(); } catch {}
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
            <OrderCard key={order.id} order={order} onUpdate={loadOrders} onDelete={handleDelete} />
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
    } catch {
      alert('Upload failed. Make sure Firebase is configured.');
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
            <input type="number" placeholder="Year" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className={inputCls} />
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
    } catch {
      alert('Upload failed. Make sure Firebase is configured.');
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
            <input type="number" placeholder="Year *" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className={inputCls} required />
            <input type="text" placeholder="Awardee Name *" value={awardeeName} onChange={(e) => setAwardeeName(e.target.value)} className={inputCls} required />
            <input type="text" placeholder="Award Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            <input type="number" placeholder="Cash Award Amount" value={cashAward} onChange={(e) => setCashAward(parseInt(e.target.value))} className={inputCls} />
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
