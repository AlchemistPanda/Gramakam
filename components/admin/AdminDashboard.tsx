'use client';

import { useState, useEffect, FormEvent } from 'react';
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
  XCircle,
  CreditCard,
  Filter,
} from 'lucide-react';
import {
  getGalleryItems,
  addGalleryItem,
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
  getUpiPayments,
  getSiteConfig,
  updateSiteConfig,
  uploadImage,
} from '@/lib/services';
import type {
  GalleryItem,
  FeedPost,
  ContactSubmission,
  MerchPrebook,
  MerchOrder,
  UpiPayment,
} from '@/types';
import { formatDate } from '@/lib/utils';
import { compressImage, formatFileSize } from '@/lib/imageCompressor';

type AdminTab = 'overview' | 'gallery' | 'feed' | 'contacts' | 'countdown' | 'merch';

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
function GalleryPanel() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadItems = async () => {
    try {
      const data = await getGalleryItems();
      setItems(data);
    } catch { /* Firebase not configured */ }
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!imageFile || !title || !category) return;
    setUploading(true);
    try {
      const compressed = await compressImage(imageFile);
      const path = `gallery/${Date.now()}_${compressed.name}`;
      const imageUrl = await uploadImage(compressed, path);
      await addGalleryItem({ title, imageUrl, year, category, type: 'image' });
      setShowForm(false);
      setTitle(''); setCategory(''); setImageFile(null);
      await loadItems();
    } catch {
      alert('Upload failed. Make sure Firebase Storage is configured.');
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gallery item?')) return;
    try {
      await deleteGalleryItem(id);
      await loadItems();
    } catch { alert('Delete failed.'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-lg text-charcoal">Gallery Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} /> Upload Image
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-charcoal mb-4">Add Gallery Image</h3>
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none" required />
            <input type="text" placeholder="Category (e.g., Performance)" value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none" required />
            <input type="number" placeholder="Year" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-maroon outline-none" required />
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm" required />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={uploading} className="btn-primary text-sm disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
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
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs gap-1">
                  <span className="font-medium">{item.title}</span>
                  <span>{item.year} · {item.category}</span>
                  <button onClick={() => handleDelete(item.id)} className="mt-2 bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white text-xs flex items-center gap-1">
                    <Trash2 size={12} /> Delete
                  </button>
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
  const [subTab, setSubTab] = useState<'prebooks' | 'orders' | 'payments'>('orders');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="heading-lg text-charcoal mb-4">Merchandise</h2>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { id: 'orders' as const, label: 'Orders' },
          { id: 'prebooks' as const, label: 'Pre-bookings' },
          { id: 'payments' as const, label: 'Payments' },
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

      {subTab === 'prebooks' && <MerchPrebooksSubTab />}
      {subTab === 'orders' && <MerchOrdersSubTab />}
      {subTab === 'payments' && <MerchPaymentsSubTab />}
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

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-green-100 text-green-700',
  manual_verified: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
};

function MerchOrdersSubTab() {
  const [orders, setOrders] = useState<MerchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const loadOrders = async () => {
    try { setOrders(await getMerchOrders()); } catch {}
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const handleVerify = async (order: MerchOrder) => {
    if (!confirm(`Manually verify order ${order.orderId}?`)) return;
    try {
      await updateMerchOrderStatus(order.id, 'manual_verified', {
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'admin',
      });
      await loadOrders();
    } catch { alert('Failed to verify order.'); }
  };

  const handleReject = async (order: MerchOrder) => {
    if (!confirm(`Reject order ${order.orderId}? This cannot be undone.`)) return;
    try {
      await updateMerchOrderStatus(order.id, 'rejected', {
        rejectedAt: new Date().toISOString(),
      });
      await loadOrders();
    } catch { alert('Failed to reject order.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this order permanently?')) return;
    try { await deleteMerchOrder(id); await loadOrders(); } catch {}
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const verifiedCount = orders.filter((o) => o.status === 'verified' || o.status === 'manual_verified').length;
  const totalRevenue = orders
    .filter((o) => o.status === 'verified' || o.status === 'manual_verified')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
          <p className="text-xl font-bold text-charcoal">{orders.length}</p>
          <p className="text-xs text-gray-500">Total Orders</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
          <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
          <p className="text-xl font-bold text-green-600">{verifiedCount}</p>
          <p className="text-xs text-gray-500">Verified</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
          <p className="text-xl font-bold text-maroon">₹{totalRevenue}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4">
        <Filter size={14} className="text-gray-400" />
        {['all', 'pending', 'verified', 'manual_verified', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f ? 'bg-maroon text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'manual_verified' ? 'Manual' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <CreditCard size={36} className="mx-auto mb-2 text-gray-300" />
            <p>No orders {filter !== 'all' ? `with status "${filter}"` : 'yet'}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Order ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Items</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">UPI Ref</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{order.orderId}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-charcoal">{order.customerName}</p>
                      <p className="text-xs text-gray-400">+91 {order.customerMobile}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {order.items.map((item, i) => (
                        <span key={i}>
                          {item.name}{item.size !== 'N/A' ? ` (${item.size})` : ''} ×{item.quantity}
                          {i < order.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 font-semibold text-maroon">₹{order.total}</td>
                    <td className="px-4 py-3 font-mono text-xs">{order.upiRef}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status === 'manual_verified' ? 'Manual' : order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerify(order)}
                              className="p-1 text-green-500 hover:text-green-700"
                              title="Verify"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(order)}
                              className="p-1 text-red-400 hover:text-red-600"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MerchPaymentsSubTab() {
  const [payments, setPayments] = useState<UpiPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try { setPayments(await getUpiPayments()); } catch {}
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500">
          Payments captured by the Android SMS monitor app. These are matched against customer orders automatically.
        </p>
      </div>
      {loading ? (
        <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : payments.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <CreditCard size={36} className="mx-auto mb-2 text-gray-300" />
          <p>No UPI payments captured yet.</p>
          <p className="text-xs mt-1">Payments will appear here once the Android SMS app is running.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sender</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">UPI Ref</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Bank</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">SMS Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Matched</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Captured</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className={`border-b border-gray-50 ${p.matched ? 'bg-green-50/50' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-maroon">₹{p.amount}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.senderUpi}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.upiRef}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{p.bank}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.datetime}</td>
                  <td className="px-4 py-3">
                    {p.matched ? (
                      <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                        <CheckCircle size={12} /> {p.matchedOrderId ? `→ ${p.matchedOrderId}` : 'Yes'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.capturedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
