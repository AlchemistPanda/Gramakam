'use client';

import { useState, useEffect, FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, Trash2, Edit, Search, Users, Percent,
  Phone, X, Save, Building2,
} from 'lucide-react';
import type { Publisher } from '@/types/books';
import {
  getPublishers,
  addPublisher,
  updatePublisher,
  deletePublisher,
  getPublisherStats,
  onDataChange,
} from '@/lib/bookStore';

export default function PublishersPanel() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [pubStats, setPubStats] = useState<ReturnType<typeof getPublisherStats>>([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [profitPercent, setProfitPercent] = useState('');
  const [contact, setContact] = useState('');

  const reload = () => {
    const allPubs = getPublishers();
    const q = query.toLowerCase().trim();
    setPublishers(
      q ? allPubs.filter((p) => p.name.toLowerCase().includes(q) || p.contact?.toLowerCase().includes(q)) : allPubs
    );
    setPubStats(getPublisherStats());
  };

  useEffect(() => { reload(); }, [query]);

  // Real-time sync
  useEffect(() => {
    const unsub = onDataChange(() => reload());
    return unsub;
  }, [query]);

  const resetForm = () => {
    setName('');
    setProfitPercent('');
    setContact('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const pct = parseFloat(profitPercent) || 0;

    if (editingId) {
      updatePublisher(editingId, { name: name.trim(), profitPercent: pct, contact: contact.trim() || undefined });
    } else {
      // Check for duplicate
      const exists = getPublishers().find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
      if (exists) {
        alert(`Publisher "${name}" already exists!`);
        return;
      }
      addPublisher(name.trim(), pct, contact.trim() || undefined);
    }
    resetForm();
    reload();
  };

  const handleEdit = (pub: Publisher) => {
    setEditingId(pub.id);
    setName(pub.name);
    setProfitPercent(pub.profitPercent?.toString() || '0');
    setContact(pub.contact || '');
    setShowForm(true);
  };

  const handleDelete = (pub: Publisher) => {
    // Check if publisher has books
    const stats = pubStats.find((s) => s.publisher === pub.name);
    const bookCount = stats?.totalBooks || 0;
    const msg = bookCount > 0
      ? `"${pub.name}" has ${bookCount} books in inventory. Delete publisher anyway? (Books will remain but lose publisher link)`
      : `Delete publisher "${pub.name}"?`;
    if (!confirm(msg)) return;
    deletePublisher(pub.id);
    reload();
  };

  const getStatsForPub = (pubName: string) => {
    return pubStats.find((s) => s.publisher === pubName);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>
          Publisher Pool
        </h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-maroon text-white rounded-xl text-sm font-medium hover:bg-maroon/90 transition-colors shadow-md shadow-maroon/20"
        >
          <Plus size={16} /> Add Publisher
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search publishers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon transition-all"
        />
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-charcoal flex items-center gap-2">
                  <Building2 size={18} />
                  {editingId ? 'Edit Publisher' : 'Add New Publisher'}
                </h3>
                <button type="button" onClick={resetForm} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Publisher Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. DC Books"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Profit % <span className="text-gray-400">(our share of revenue)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={profitPercent}
                      onChange={(e) => setProfitPercent(e.target.value)}
                      placeholder="e.g. 15"
                      min="0"
                      max="100"
                      step="0.5"
                      className="w-full px-3 py-2.5 pr-8 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon"
                    />
                    <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Contact (optional)</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Phone or email"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-maroon text-white rounded-xl text-sm font-medium hover:bg-maroon/90 transition-colors">
                  <Save size={15} /> {editingId ? 'Update' : 'Add Publisher'}
                </button>
                <button type="button" onClick={resetForm} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publishers Grid */}
      {publishers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">No publishers yet</p>
          <p className="text-sm mt-1">Click &quot;Add Publisher&quot; to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publishers.map((pub) => {
            const stats = getStatsForPub(pub.name);
            return (
              <div key={pub.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Building2 size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-charcoal">{pub.name}</h4>
                      {pub.contact && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone size={10} /> {pub.contact}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(pub)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Edit"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(pub)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Profit Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    pub.profitPercent > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Percent size={11} />
                    {pub.profitPercent > 0 ? `${pub.profitPercent}% profit` : 'No profit % set'}
                  </span>
                </div>

                {/* Stats */}
                {stats ? (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-lg font-bold text-indigo-600">{stats.titleCount}</p>
                      <p className="text-[10px] text-gray-500">Titles</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-lg font-bold text-charcoal">{stats.totalBooks}</p>
                      <p className="text-[10px] text-gray-500">Stock</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-lg font-bold text-green-600">{stats.totalSold}</p>
                      <p className="text-[10px] text-gray-500">Sold</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-lg font-bold text-purple-600">₹{stats.profit.toFixed(0)}</p>
                      <p className="text-[10px] text-gray-500">Profit</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">No books added yet</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
