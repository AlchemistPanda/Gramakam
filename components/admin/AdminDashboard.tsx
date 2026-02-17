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
  Upload,
  ExternalLink,
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
  getSiteConfig,
  updateSiteConfig,
  uploadImage,
} from '@/lib/services';
import type {
  GalleryItem,
  FeedPost,
  ContactSubmission,
  MerchPrebook,
} from '@/types';
import { formatDate } from '@/lib/utils';

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
    { id: 'merch', label: 'Merch Pre-books', icon: ShoppingBag },
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
  const [stats, setStats] = useState({ gallery: 0, feed: 0, contacts: 0, prebooks: 0 });

  useEffect(() => {
    async function loadStats() {
      try {
        const [gallery, feed, contacts, prebooks] = await Promise.all([
          getGalleryItems(),
          getFeedPosts(),
          getContactSubmissions(),
          getPrebookEntries(),
        ]);
        setStats({
          gallery: gallery.length,
          feed: feed.length,
          contacts: contacts.length,
          prebooks: prebooks.length,
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

  useEffect(() => { loadItems(); }, []);

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!imageFile || !title || !category) return;
    setUploading(true);
    try {
      const path = `gallery/${Date.now()}_${imageFile.name}`;
      const imageUrl = await uploadImage(imageFile, path);
      await addGalleryItem({ title, imageUrl, year, category, type: 'image' });
      setShowForm(false);
      setTitle(''); setCategory(''); setImageFile(null);
      await loadItems();
    } catch (err) {
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

  useEffect(() => { loadPosts(); }, []);

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
        const path = `feed/${Date.now()}_${imageFile.name}`;
        imageUrl = await uploadImage(imageFile, path);
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
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                {saving ? 'Saving...' : editingId ? 'Update Post' : 'Create Post'}
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

  useEffect(() => { loadContacts(); }, []);

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

// ===== MERCH PANEL =====
function MerchPanel() {
  const [entries, setEntries] = useState<MerchPrebook[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = async () => {
    try { setEntries(await getPrebookEntries()); } catch {}
    setLoading(false);
  };

  useEffect(() => { loadEntries(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pre-booking?')) return;
    try { await deletePrebook(id); await loadEntries(); } catch {}
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="heading-lg text-charcoal mb-6">Merchandise Pre-bookings</h2>
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
    </motion.div>
  );
}
