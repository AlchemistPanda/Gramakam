'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, CheckCircle, Clock, Phone, MapPin, BookOpen,
  Search, X, MessageCircle, User, StickyNote, ChevronDown, AlertTriangle,
} from 'lucide-react';
import {
  getBooks,
  getRequests,
  getRequestsFirestoreError,
  addRequest,
  deleteRequest,
  updateRequestStatus,
  onDataChange,
} from '@/lib/bookStore';
import type { BookRequest } from '@/types/books';

/* ── WhatsApp helper ─────────────────────────────────── */
function buildWhatsAppUrl(req: BookRequest): string {
  const clean = req.phone.replace(/\D/g, '');
  const number = clean.startsWith('91') ? clean : `91${clean}`;
  const msg = encodeURIComponent(
    `Hi ${req.customerName}! 📚 Great news — the book *${req.bookTitle}* is now back in stock at Gramakam 2026!\n\nCome pick it up or reply here to arrange delivery.\n\n— Gramakam Team`
  );
  return `https://wa.me/${number}?text=${msg}`;
}

/* ══ Main component ══════════════════════════════════════ */
export default function RequestsPanel() {
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'fulfilled'>('all');
  const [showForm, setShowForm] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  // Refresh whenever store changes
  useEffect(() => {
    setRequests(getRequests());
    setFirestoreError(getRequestsFirestoreError());
    const unsub = onDataChange(() => {
      setRequests(getRequests());
      setFirestoreError(getRequestsFirestoreError());
    });
    return unsub;
  }, []);

  const filtered = requests.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (
      r.customerName.toLowerCase().includes(q) ||
      r.bookTitle.toLowerCase().includes(q) ||
      r.phone.includes(q)
    );
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Firestore error banner */}
      {firestoreError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Could not load requests from Firestore</p>
            <p className="text-xs text-red-500 mt-0.5 font-mono break-all">{firestoreError}</p>
            <p className="text-xs text-red-600 mt-1">
              Go to <strong>Firebase Console → Firestore → Rules</strong> and make sure the <code>bookfest_requests</code> collection is allowed.
            </p>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>
            Pre-Order Requests
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Collect customer details when a book is out of stock — notify via WhatsApp when restocked.
          </p>
        </div>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="flex items-center gap-2 bg-maroon text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-maroon/90 transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Request'}
        </button>
      </div>

      {/* Add Request form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <AddRequestForm
              onSaved={() => {
                setRequests(getRequests());
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 text-xs font-semibold">
          {(['all', 'pending', 'fulfilled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                filter === s ? 'bg-white text-charcoal shadow-sm' : 'text-gray-500 hover:text-charcoal'
              }`}
            >
              {s}
              {s === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 bg-maroon text-white rounded-full px-1.5 py-0.5 text-[9px]">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search name, book, phone…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-maroon/50 bg-white"
          />
          {searchQ && (
            <button onClick={() => setSearchQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Request list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-500">
            {requests.length === 0 ? 'No requests yet' : 'No results for this filter'}
          </p>
          <p className="text-sm mt-1">
            {requests.length === 0
              ? 'Add one when a customer asks for an out-of-stock book'
              : 'Try a different filter or search term'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((req) => (
              <motion.div
                key={req.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <RequestCard
                  req={req}
                  onDelete={() => {
                    deleteRequest(req.id);
                    setRequests(getRequests());
                  }}
                  onToggleStatus={() => {
                    updateRequestStatus(req.id, req.status === 'pending' ? 'fulfilled' : 'pending');
                    setRequests(getRequests());
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ══ Add Request Form ════════════════════════════════════ */
function AddRequestForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [bookInput, setBookInput] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allBooks = getBooks();
  const suggestions = bookInput.trim().length >= 1
    ? allBooks.filter((b) =>
        b.title.toLowerCase().includes(bookInput.toLowerCase()) ||
        (b.localTitle && b.localTitle.includes(bookInput))
      ).slice(0, 8)
    : [];

  function handleBookSelect(title: string, id: string) {
    setBookInput(title);
    setSelectedBookId(id);
    setDropdownOpen(false);
  }

  function handleBookTyping(val: string) {
    setBookInput(val);
    setSelectedBookId(undefined); // clear match if user edits
    setDropdownOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimName = name.trim();
    const trimPhone = phone.trim();
    const trimBook = bookInput.trim();

    if (!trimName) { setError('Customer name is required.'); return; }
    if (!trimPhone) { setError('Phone number is required.'); return; }
    if (!trimBook) { setError('Book title is required.'); return; }

    addRequest({
      customerName: trimName,
      phone: trimPhone,
      bookTitle: trimBook,
      bookId: selectedBookId,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onSaved();
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-charcoal mb-4 flex items-center gap-2">
        <Plus size={16} className="text-maroon" />
        New Book Request
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Menon"
                className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-maroon/60 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9400186188"
                type="tel"
                inputMode="numeric"
                className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-maroon/60 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Book name — combobox */}
        <div ref={dropdownRef} className="relative">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Book Title <span className="text-red-500">*</span>
            <span className="ml-1.5 font-normal text-gray-400">(type to search inventory or enter manually)</span>
          </label>
          <div className="relative">
            <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={bookInput}
              onChange={(e) => handleBookTyping(e.target.value)}
              onFocus={() => bookInput.trim() && setDropdownOpen(true)}
              placeholder="Search inventory or type book name…"
              className="w-full pl-8 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-maroon/60 bg-gray-50 focus:bg-white transition-colors"
            />
            {bookInput && (
              <button
                type="button"
                onClick={() => { setBookInput(''); setSelectedBookId(undefined); setDropdownOpen(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Matched from inventory badge */}
          {selectedBookId && (
            <p className="mt-1 text-[11px] text-green-700 font-semibold flex items-center gap-1">
              <CheckCircle size={11} />
              Matched from inventory
            </p>
          )}
          {bookInput && !selectedBookId && (
            <p className="mt-1 text-[11px] text-amber-600 font-medium">
              Not in inventory — will be saved as free text
            </p>
          )}

          {/* Dropdown suggestions */}
          <AnimatePresence>
            {dropdownOpen && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.1 }}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto"
              >
                {suggestions.map((b) => {
                  const remaining = b.quantity - b.sold;
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => handleBookSelect(b.title, b.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-charcoal">{b.title}</p>
                          {b.localTitle && (
                            <p className="text-xs text-gray-500 mt-0.5">{b.localTitle}</p>
                          )}
                        </div>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          remaining === 0 ? 'bg-red-100 text-red-700' :
                          remaining <= 3  ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {remaining === 0 ? 'Out of stock' : `${remaining} left`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Address / Location
            <span className="ml-1.5 font-normal text-gray-400">(optional)</span>
          </label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Flat 4B, Sunrise Apartments, Thrissur"
              rows={2}
              className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-maroon/60 bg-gray-50 focus:bg-white transition-colors resize-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Notes
            <span className="ml-1.5 font-normal text-gray-400">(optional)</span>
          </label>
          <div className="relative">
            <StickyNote size={14} className="absolute left-3 top-3 text-gray-400" />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra info — preferred edition, urgency, etc."
              rows={2}
              className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-maroon/60 bg-gray-50 focus:bg-white transition-colors resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-charcoal transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-semibold bg-maroon text-white rounded-xl hover:bg-maroon/90 transition-colors shadow-sm"
          >
            Save Request
          </button>
        </div>
      </form>
    </div>
  );
}

/* ══ Request Card ════════════════════════════════════════ */
function RequestCard({
  req,
  onDelete,
  onToggleStatus,
}: {
  req: BookRequest;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isFulfilled = req.status === 'fulfilled';

  const date = new Date(req.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all ${
      isFulfilled ? 'border-green-100 opacity-75' : 'border-gray-100'
    }`}>
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-charcoal text-base">{req.customerName}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                isFulfilled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {isFulfilled ? 'Fulfilled' : 'Pending'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{date}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* WhatsApp notify */}
            <a
              href={buildWhatsAppUrl(req)}
              target="_blank"
              rel="noopener noreferrer"
              title="Send WhatsApp message"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <MessageCircle size={13} />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Mark fulfilled / pending */}
            <button
              onClick={onToggleStatus}
              title={isFulfilled ? 'Mark as pending' : 'Mark as fulfilled'}
              className={`p-1.5 rounded-xl transition-colors ${
                isFulfilled
                  ? 'text-gray-400 hover:bg-gray-100'
                  : 'text-green-600 hover:bg-green-50'
              }`}
            >
              <CheckCircle size={17} />
            </button>

            {/* Delete */}
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={onDelete}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Delete request"
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen size={13} className="text-maroon shrink-0" />
            <span className="font-semibold text-charcoal">{req.bookTitle}</span>
            {req.bookId && (
              <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded-full">inventory</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={13} className="text-gray-400 shrink-0" />
            <a href={`tel:${req.phone}`} className="hover:text-maroon transition-colors">
              {req.phone}
            </a>
          </div>

          {req.address && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
              <span>{req.address}</span>
            </div>
          )}

          {req.notes && (
            <div className="flex items-start gap-2 text-sm text-gray-500 italic">
              <StickyNote size={13} className="text-gray-300 shrink-0 mt-0.5" />
              <span>{req.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
