'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, CheckCircle, PackageCheck,
  FileSpreadsheet, RotateCcw, Trash2, Plus,
} from 'lucide-react';
import type { Book } from '@/types/books';
import {
  getBooks,
  getReturnEntries, setReturnEntry, deleteReturnEntry, clearReturnEntries,
  onDataChange,
} from '@/lib/bookStore';

// ─── Status helpers ──────────────────────────────────────────────────────────

type Status = 'not_found' | 'partial' | 'complete' | 'extra';
type StatusFilter = 'all' | Status;

function getStatus(expected: number, found: number | undefined): Status {
  if (found === undefined || found === 0) return expected === 0 ? 'complete' : 'not_found';
  if (found === expected) return 'complete';
  if (found < expected) return 'partial';
  return 'extra';
}

const STATUS_COLORS: Record<Status, { row: string; badge: string; label: string }> = {
  complete:  { row: 'bg-green-50',     badge: 'bg-green-100 text-green-700',   label: '✓ Complete'  },
  extra:     { row: 'bg-yellow-50',    badge: 'bg-yellow-100 text-yellow-700', label: '⚠ Extra'     },
  partial:   { row: 'bg-orange-50',    badge: 'bg-orange-100 text-orange-700', label: '◐ Partial'   },
  not_found: { row: 'bg-red-50/60',    badge: 'bg-red-100 text-red-700',       label: '✕ Not Found' },
};

const STATUS_ORDER: Record<Status, number> = { not_found: 0, partial: 1, extra: 2, complete: 3 };

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReturnPanel() {
  const [books, setBooks]                     = useState<Book[]>([]);
  const [publishers, setPublishers]           = useState<string[]>([]);
  const [entries, setEntries]                 = useState<Record<string, number>>({});
  const [selectedPublisher, setSelectedPublisher] = useState<string>('__all__');
  const [statusFilter, setStatusFilter]       = useState<StatusFilter>('all');

  // Search
  const [query, setQuery]                     = useState('');
  const [results, setResults]                 = useState<Book[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Entry modal
  const [selectedBook, setSelectedBook]       = useState<Book | null>(null);
  const [foundInput, setFoundInput]           = useState('');

  // ── Data loading ──────────────────────────────────────────────────────────

  const reload = () => {
    const allBooks = getBooks();
    setBooks(allBooks);
    const entryMap = getReturnEntries();
    const found: Record<string, number> = {};
    for (const [id, e] of Object.entries(entryMap)) found[id] = e.found;
    setEntries(found);
    setPublishers([...new Set(allBooks.map(b => b.publisher))].sort());
  };

  useEffect(() => { reload(); }, []);
  useEffect(() => { const unsub = onDataChange(() => reload()); return unsub; }, []);

  // ── Search ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!query.trim()) { setResults([]); setHighlightedIndex(-1); return; }
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matched = books.filter((b) => {
      const fields = [
        b.title.toLowerCase(),
        (b.localTitle ?? '').toLowerCase(),
        b.publisher.toLowerCase(),
        (b.isbn ?? '').toLowerCase(),
        (b.category ?? '').toLowerCase(),
      ];
      const priceStr = b.price.toString();
      return terms.every((term) => {
        const isNum = /^\d+(\.\d+)?$/.test(term);
        return isNum
          ? (priceStr === term || fields.some(f => f.includes(term)))
          : fields.some(f => f.includes(term));
      });
    }).slice(0, 15);
    setResults(matched);
    setHighlightedIndex(-1);
  }, [query, books]);

  useEffect(() => {
    if (highlightedIndex < 0 || !resultsRef.current) return;
    const items = resultsRef.current.querySelectorAll<HTMLElement>('[data-result-item]');
    items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  // ── Entry modal ───────────────────────────────────────────────────────────

  const openBookEntry = (book: Book) => {
    setSelectedBook(book);
    setFoundInput(String(entries[book.id] ?? ''));
    setQuery('');
    setResults([]);
    setHighlightedIndex(-1);
  };

  const confirmEntry = () => {
    if (!selectedBook) return;
    const val = Math.max(0, parseInt(foundInput) || 0);
    setReturnEntry(selectedBook.id, val);
    setEntries(prev => ({ ...prev, [selectedBook.id]: val }));
    setSelectedBook(null);
    setFoundInput('');
    searchRef.current?.focus();
  };

  const removeEntry = (bookId: string) => {
    deleteReturnEntry(bookId);
    setEntries(prev => { const n = { ...prev }; delete n[bookId]; return n; });
    setSelectedBook(null);
    setFoundInput('');
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const publisherBooks =
    selectedPublisher === '__all__'
      ? books
      : books.filter(b => b.publisher === selectedPublisher);

  const filteredBooks = publisherBooks.filter(b => {
    if (statusFilter === 'all') return true;
    const expected = Math.max(0, b.quantity - b.sold);
    return getStatus(expected, entries[b.id]) === statusFilter;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    const ea = Math.max(0, a.quantity - a.sold);
    const eb = Math.max(0, b.quantity - b.sold);
    const sa = STATUS_ORDER[getStatus(ea, entries[a.id])];
    const sb = STATUS_ORDER[getStatus(eb, entries[b.id])];
    return sa - sb || a.publisher.localeCompare(b.publisher) || a.title.localeCompare(b.title);
  });

  const summaryBooks = publisherBooks;
  const totalExpected   = summaryBooks.reduce((s, b) => s + Math.max(0, b.quantity - b.sold), 0);
  const totalFound      = summaryBooks.reduce((s, b) => s + (entries[b.id] ?? 0), 0);

  const countByStatus = (st: Status) =>
    summaryBooks.filter(b => {
      const e = Math.max(0, b.quantity - b.sold);
      return getStatus(e, entries[b.id]) === st;
    }).length;

  const completeCount  = countByStatus('complete');
  const partialCount   = countByStatus('partial');
  const extraCount     = countByStatus('extra');
  const notFoundCount  = countByStatus('not_found');
  const completionPct  =
    summaryBooks.length > 0
      ? Math.round(((completeCount + extraCount) / summaryBooks.length) * 100)
      : 0;

  // ── Export ────────────────────────────────────────────────────────────────

  const exportReport = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const pubsToExport = selectedPublisher === '__all__' ? publishers : [selectedPublisher];

    for (const pub of pubsToExport) {
      const pubBooks = books
        .filter(b => b.publisher === pub)
        .sort((a, b) => a.title.localeCompare(b.title));

      const rows = pubBooks.map((b, i) => {
        const expected = Math.max(0, b.quantity - b.sold);
        const found    = entries[b.id] ?? 0;
        const diff     = found - expected;
        const status   = getStatus(expected, entries[b.id]);
        const statusLabel =
          status === 'complete'  ? 'Complete'                    :
          status === 'extra'     ? `Extra (+${diff})`            :
          status === 'partial'   ? `Partial (${found}/${expected})` :
          'Not Found';
        return {
          '#': i + 1,
          'Book Title': b.title,
          'Local Title': b.localTitle ?? '',
          'Price (₹)': b.price,
          'Expected': expected,
          'Found': entries[b.id] !== undefined ? found : '',
          'Difference': entries[b.id] !== undefined ? diff : '',
          'Status': statusLabel,
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 4 }, { wch: 36 }, { wch: 36 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 22 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, pub.slice(0, 31));
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const suffix  = selectedPublisher === '__all__' ? 'all' : selectedPublisher;
    XLSX.writeFile(wb, `gramakam-returns-${suffix}-${dateStr}.xlsx`);
  };

  // ── Clear ─────────────────────────────────────────────────────────────────

  const handleClear = () => {
    const label = selectedPublisher === '__all__' ? 'ALL publishers' : selectedPublisher;
    if (!window.confirm(`Clear all return entries for ${label}? This cannot be undone.`)) return;
    if (selectedPublisher === '__all__') {
      clearReturnEntries();
      setEntries({});
    } else {
      const ids = books.filter(b => b.publisher === selectedPublisher).map(b => b.id);
      const newEntries = { ...entries };
      ids.forEach(id => { deleteReturnEntry(id); delete newEntries[id]; });
      setEntries(newEntries);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h2
            className="text-2xl font-bold text-charcoal"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Book Returns &amp; Pack-Down
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Count physical copies found per book and generate publisher return reports
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportReport}
            disabled={books.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet size={16} />
            Export Report
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
        {[
          { label: 'Total Books', val: summaryBooks.length,   color: 'bg-gray-100 text-gray-700'    },
          { label: 'Expected',    val: totalExpected,         color: 'bg-blue-100 text-blue-700'    },
          { label: 'Found',       val: totalFound,            color: 'bg-indigo-100 text-indigo-700'},
          { label: 'Complete',    val: completeCount + extraCount, color: 'bg-green-100 text-green-700' },
          { label: 'Remaining',   val: notFoundCount + partialCount, color: 'bg-red-100 text-red-700' },
          { label: 'Done',        val: `${completionPct}%`,  color: 'bg-purple-100 text-purple-700'},
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 ${s.color} text-center`}>
            <p className="text-xl font-bold">{s.val}</p>
            <p className="text-xs font-medium opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Publisher tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {[
          { id: '__all__', name: 'All Publishers', pct: -1 },
          ...publishers.map(p => {
            const pb = books.filter(b => b.publisher === p);
            const c  = pb.filter(b => {
              const e = Math.max(0, b.quantity - b.sold);
              const s = getStatus(e, entries[b.id]);
              return s === 'complete' || s === 'extra';
            }).length;
            return { id: p, name: p, pct: pb.length > 0 ? Math.round((c / pb.length) * 100) : 100 };
          }),
        ].map(pub => (
          <button
            key={pub.id}
            onClick={() => setSelectedPublisher(pub.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              selectedPublisher === pub.id
                ? 'bg-maroon text-white border-maroon shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-maroon/50 hover:text-maroon'
            }`}
          >
            <span>{pub.name}</span>
            {pub.id !== '__all__' && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                selectedPublisher === pub.id
                  ? 'bg-white/20 text-white'
                  : pub.pct === 100
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {pub.pct}%
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search by book name, price, publisher, ISBN to log found copies…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIndex(p => Math.min(p + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIndex(p => Math.max(p - 1, -1));
            } else if (e.key === 'Enter' && highlightedIndex >= 0) {
              e.preventDefault();
              openBookEntry(results[highlightedIndex]);
            } else if (e.key === 'Escape') {
              setQuery(''); setResults([]); setHighlightedIndex(-1);
            }
          }}
          className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-maroon focus:border-maroon outline-none bg-white text-base"
        />

        {/* Search results dropdown */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden max-h-80 overflow-y-auto"
            >
              {results.map((book, idx) => {
                const expected = Math.max(0, book.quantity - book.sold);
                const found    = entries[book.id];
                const status   = getStatus(expected, found);
                const sc       = STATUS_COLORS[status];
                return (
                  <button
                    key={book.id}
                    data-result-item=""
                    onClick={() => openBookEntry(book)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 text-left border-b border-gray-50 last:border-0 transition-colors ${
                      idx === highlightedIndex ? 'bg-maroon/[0.07]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      {book.localTitle ? (
                        <>
                          <p className="font-semibold text-charcoal truncate">{book.localTitle}</p>
                          <p className="text-xs text-gray-500 truncate">{book.title} · {book.publisher}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-charcoal truncate">{book.title}</p>
                          <p className="text-xs text-gray-500 truncate">{book.publisher}</p>
                        </>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-maroon">₹{book.price}</p>
                      <p className="text-xs text-gray-400">Exp: {expected}</p>
                    </div>
                    <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${sc.badge}`}>
                      {found !== undefined ? `Found: ${found}` : sc.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Found count entry card */}
      <AnimatePresence>
        {selectedBook && (() => {
          const expected = Math.max(0, selectedBook.quantity - selectedBook.sold);
          const current  = entries[selectedBook.id] ?? 0;
          const inputVal = Math.max(0, parseInt(foundInput) || 0);
          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border-2 border-maroon/30 rounded-2xl p-5 mb-4 shadow-sm"
            >
              {/* Book info */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  {selectedBook.localTitle && (
                    <p className="font-bold text-lg text-charcoal">{selectedBook.localTitle}</p>
                  )}
                  <p className="font-semibold text-charcoal">{selectedBook.title}</p>
                  <p className="text-sm text-gray-500">{selectedBook.publisher} · ₹{selectedBook.price}</p>
                </div>
                <button
                  onClick={() => { setSelectedBook(null); setFoundInput(''); }}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="bg-blue-50 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-xs text-blue-500 font-medium">Expected</p>
                  <p className="text-2xl font-bold text-blue-700">{expected}</p>
                </div>
                {entries[selectedBook.id] !== undefined && (
                  <div className="bg-green-50 rounded-xl px-4 py-2.5 text-center">
                    <p className="text-xs text-green-500 font-medium">Previously logged</p>
                    <p className="text-2xl font-bold text-green-700">{current}</p>
                  </div>
                )}
                <div className="flex-1 min-w-[140px] text-center">
                  <p className="text-xs text-gray-500 font-medium mb-1">After this entry</p>
                  {inputVal > expected ? (
                    <p className="text-lg font-bold text-yellow-600">+{inputVal - expected} extra</p>
                  ) : inputVal === expected ? (
                    <p className="text-lg font-bold text-green-600">✓ Complete!</p>
                  ) : inputVal > 0 ? (
                    <p className="text-lg font-bold text-orange-600">{expected - inputVal} still missing</p>
                  ) : (
                    <p className="text-gray-300 text-lg">—</p>
                  )}
                </div>
              </div>

              {/* Input controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFoundInput(v => String(Math.max(0, (parseInt(v) || 0) - 1)))}
                  className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-maroon hover:text-maroon transition-colors text-xl font-bold text-gray-600"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={foundInput}
                  onChange={e => setFoundInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmEntry()}
                  placeholder="0"
                  autoFocus
                  className="flex-1 text-center text-2xl font-bold py-2.5 border-2 border-gray-200 rounded-xl focus:border-maroon outline-none"
                />
                <button
                  onClick={() => setFoundInput(v => String((parseInt(v) || 0) + 1))}
                  className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-maroon hover:text-maroon transition-colors text-xl font-bold text-gray-600"
                >
                  +
                </button>
                <button
                  onClick={() => setFoundInput(String(expected))}
                  title="Set to expected count"
                  className="px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 font-medium whitespace-nowrap"
                >
                  All {expected}
                </button>
                <button
                  onClick={confirmEntry}
                  className="flex-1 btn-primary rounded-xl flex items-center justify-center gap-2 py-2.5"
                >
                  <CheckCircle size={16} />
                  Confirm
                </button>
              </div>

              {entries[selectedBook.id] !== undefined && (
                <button
                  onClick={() => removeEntry(selectedBook.id)}
                  className="mt-3 text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={12} />
                  Remove entry for this book
                </button>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Status filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {([
          { id: 'all' as const,       label: `All (${publisherBooks.length})`,    activeClass: 'bg-gray-700 text-white'    },
          { id: 'not_found' as const, label: `Not Found (${countByStatus('not_found')})`, activeClass: 'bg-red-500 text-white'  },
          { id: 'partial' as const,   label: `Partial (${countByStatus('partial')})`,   activeClass: 'bg-orange-500 text-white'},
          { id: 'complete' as const,  label: `Complete (${countByStatus('complete')})`,  activeClass: 'bg-green-500 text-white' },
          { id: 'extra' as const,     label: `Extra (${countByStatus('extra')})`,        activeClass: 'bg-yellow-500 text-white'},
        ]).map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.id
                ? f.activeClass
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Book table */}
      {sortedBooks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <PackageCheck size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No books to show</p>
          <p className="text-sm mt-1">Try a different publisher or filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-gray-500 font-semibold w-8">#</th>
                  <th className="px-3 py-3 text-left text-gray-500 font-semibold">Book</th>
                  {selectedPublisher === '__all__' && (
                    <th className="px-3 py-3 text-left text-gray-500 font-semibold">Publisher</th>
                  )}
                  <th className="px-3 py-3 text-center text-gray-500 font-semibold">Expected</th>
                  <th className="px-3 py-3 text-center text-gray-500 font-semibold">Found</th>
                  <th className="px-3 py-3 text-center text-gray-500 font-semibold">Diff</th>
                  <th className="px-3 py-3 text-center text-gray-500 font-semibold">Status</th>
                  <th className="px-3 py-3 text-center text-gray-500 font-semibold w-14">Edit</th>
                </tr>
              </thead>
              <tbody>
                {sortedBooks.map((book, i) => {
                  const expected = Math.max(0, book.quantity - book.sold);
                  const found    = entries[book.id];
                  const status   = getStatus(expected, found);
                  const sc       = STATUS_COLORS[status];
                  const diff     = (found ?? 0) - expected;
                  return (
                    <tr key={book.id} className={`border-b border-gray-50 last:border-0 ${sc.row}`}>
                      <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        {book.localTitle ? (
                          <>
                            <p className="font-medium text-charcoal">{book.localTitle}</p>
                            <p className="text-xs text-gray-500">{book.title}</p>
                          </>
                        ) : (
                          <p className="font-medium text-charcoal">{book.title}</p>
                        )}
                        <p className="text-xs text-gray-400">₹{book.price}</p>
                      </td>
                      {selectedPublisher === '__all__' && (
                        <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[140px] truncate">{book.publisher}</td>
                      )}
                      <td className="px-3 py-2.5 text-center font-semibold text-blue-600">{expected}</td>
                      <td className="px-3 py-2.5 text-center font-semibold">
                        {found !== undefined ? found : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs font-bold">
                        {found !== undefined ? (
                          <span className={
                            diff > 0 ? 'text-yellow-600' :
                            diff < 0 ? 'text-red-500' :
                            'text-green-600'
                          }>
                            {diff > 0 ? `+${diff}` : diff === 0 ? '✓' : diff}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${sc.badge}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => openBookEntry(book)}
                          className="p-1.5 text-gray-400 hover:text-maroon hover:bg-maroon/10 rounded-lg transition-colors"
                          title="Log found count"
                        >
                          <Plus size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
