'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, FileSpreadsheet, Download, Upload, TrendingUp, BarChart3,
  IndianRupee, Package, BookOpen, Users, Percent, Trash2, Calendar, Award,
  Banknote, Smartphone, Phone,
} from 'lucide-react';
import {
  getStats,
  getPublisherStats,
  getBooks,
  getBills,
  getRequests,
  exportAllData,
  importData,
  clearAllData,
  onDataChange,
} from '@/lib/bookStore';
import type { Bill, Book } from '@/types/books';

// ========== Chart data helpers ==========

function getDailySalesData(bills: Bill[]) {
  const map: Record<string, { sold: number; revenue: number; label: string }> = {};
  for (const bill of bills) {
    const d = new Date(bill.createdAt);
    // Build key from LOCAL date so IST midnight-to-5:30am bills aren't split across two UTC days
    const localKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }); // e.g. "Fri, 20 Feb"
    const qty = bill.items.reduce((s, i) => s + i.quantity, 0);
    if (!map[localKey]) map[localKey] = { sold: 0, revenue: 0, label };
    map[localKey].sold += qty;
    map[localKey].revenue += bill.grandTotal;
  }
  // Sort chronologically by local YYYY-MM-DD key
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ day: v.label, sold: v.sold, revenue: v.revenue }));
}

function getPublisherSalesData(pubStats: ReturnType<typeof getPublisherStats>) {
  return pubStats
    .filter((p) => p.totalSold > 0)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 12);
}

function getTopBooksData(books: Book[]) {
  return [...books]
    .filter((b) => b.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10);
}

// ========== Reusable horizontal bar chart ==========

function BarChart({ data, color }: { data: { label: string; value: number; sub?: string }[]; color: string }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-charcoal truncate max-w-[60%]" title={d.label}>{d.label}</span>
            <span className="text-xs font-bold text-gray-600 ml-2 shrink-0">{d.value}{d.sub ? <span className="text-[10px] font-normal text-gray-400 ml-1">{d.sub}</span> : null}</span>
          </div>
          <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${color}`}
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / maxVal) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="text-center text-gray-400 text-sm py-6">No data yet</p>}
    </div>
  );
}

export default function ReportsPanel() {
  const [stats, setStats] = useState({ totalBooks: 0, totalSold: 0, totalRemaining: 0, totalRevenue: 0, totalBills: 0, uniquePublishers: 0 });
  const [pubStats, setPubStats] = useState<ReturnType<typeof getPublisherStats>>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [restoreStatus, setRestoreStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);

  const reload = () => {
    setStats(getStats());
    setPubStats(getPublisherStats());
    setBills(getBills());
    setBooks(getBooks());
  };

  useEffect(() => { reload(); }, []);

  // Real-time sync
  useEffect(() => {
    const unsub = onDataChange(() => { reload(); });
    return unsub;
  }, []);

  // ========== PDF Export ==========
  const exportPDF = async (type: 'inventory' | 'sales' | 'publisher') => {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();
    const now = new Date().toLocaleString('en-IN');

    // Header
    doc.setFontSize(18);
    doc.text('GRAMAKAM Book Festival 2026', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${now}`, 14, 28);
    doc.setTextColor(0);

    if (type === 'inventory') {
      doc.setFontSize(14);
      doc.text('Book Inventory Report', 14, 40);
      const books = getBooks();
      autoTable(doc, {
        startY: 46,
        head: [['#', 'Title', 'Publisher', 'Price', 'Stock', 'Sold', 'Remaining']],
        body: books.map((b, i) => [
          i + 1, b.title, b.publisher, `₹${b.price.toFixed(2)}`, b.quantity, b.sold, b.quantity - b.sold,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [128, 0, 32] },
      });
    } else if (type === 'sales') {
      doc.setFontSize(14);
      doc.text('Sales Report', 14, 40);
      const bills = getBills();
      autoTable(doc, {
        startY: 46,
        head: [['Bill #', 'Date', 'Items', 'Subtotal', 'Discount', 'Total']],
        body: bills.map((b) => [
          b.billNumber,
          new Date(b.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
          b.items.reduce((s, i) => s + i.quantity, 0),
          `₹${b.total.toFixed(2)}`,
          b.discount > 0 ? `₹${b.discount.toFixed(2)}` : '-',
          `₹${b.grandTotal.toFixed(2)}`,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [128, 0, 32] },
      });
      // Summary
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.text(`Total Bills: ${bills.length}`, 14, finalY);
      doc.text(`Total Revenue: ₹${stats.totalRevenue.toFixed(2)}`, 14, finalY + 7);
    } else {
      doc.setFontSize(14);
      doc.text('Publisher-wise Report', 14, 40);
      autoTable(doc, {
        startY: 46,
        head: [['Publisher', 'Total Books', 'Sold', 'Remaining', 'Revenue', 'Profit %', 'Our Profit']],
        body: pubStats.map((p) => [
          p.publisher, p.totalBooks, p.totalSold, p.totalRemaining, `₹${p.revenue.toFixed(2)}`, `${p.profitPercent}%`, `₹${p.profit.toFixed(2)}`,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [128, 0, 32] },
      });
      // Profit summary
      const pubFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      const totalProfit = pubStats.reduce((s, p) => s + p.profit, 0);
      doc.setFontSize(11);
      doc.text(`Total Revenue: ₹${pubStats.reduce((s, p) => s + p.revenue, 0).toFixed(2)}`, 14, pubFinalY);
      doc.text(`Total Profit: ₹${totalProfit.toFixed(2)}`, 14, pubFinalY + 7);
    }

    doc.save(`gramakam-${type}-report.pdf`);
  };

  // ========== Excel Export ==========
  const exportExcel = async (type: 'inventory' | 'sales' | 'publisher') => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    if (type === 'inventory') {
      const books = getBooks();
      const data = books.map((b, i) => ({
        '#': i + 1,
        'Title': b.title,
        'Publisher': b.publisher,
        'Category': b.category || '',
        'Price (₹)': b.price,
        'Total Stock': b.quantity,
        'Sold': b.sold,
        'Remaining': b.quantity - b.sold,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    } else if (type === 'sales') {
      const bills = getBills();
      // Bills sheet
      const billData = bills.map((b) => ({
        'Bill #': b.billNumber,
        'Date': new Date(b.createdAt).toLocaleString('en-IN'),
        'Customer': b.customerName || '',
        'Phone': b.customerPhone || '',
        'Status': b.status === 'unpaid' ? 'Unpaid' : 'Paid',
        'Payment': b.paymentMethod ? (b.paymentMethod === 'cash' ? 'Cash' : 'UPI') : '',
        'Items Count': b.items.reduce((s, i) => s + i.quantity, 0),
        'Subtotal (₹)': b.total,
        'Discount (₹)': b.discount,
        'Total (₹)': b.grandTotal,
      }));
      const ws1 = XLSX.utils.json_to_sheet(billData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Bills');
      // Line items sheet
      const lineItems = bills.flatMap((b) =>
        b.items.map((item) => ({
          'Bill #': b.billNumber,
          'Date': new Date(b.createdAt).toLocaleString('en-IN'),
          'Book Title': item.title,
          'Publisher': item.publisher,
          'Price (₹)': item.price,
          'Quantity': item.quantity,
          'Amount (₹)': item.price * item.quantity,
        }))
      );
      const ws2 = XLSX.utils.json_to_sheet(lineItems);
      XLSX.utils.book_append_sheet(wb, ws2, 'Line Items');
    } else {
      const data = pubStats.map((p) => ({
        'Publisher': p.publisher,
        'Total Books': p.totalBooks,
        'Sold': p.totalSold,
        'Remaining': p.totalRemaining,
        'Revenue (₹)': p.revenue,
        'Profit %': p.profitPercent,
        'Our Profit (₹)': p.profit,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'By Publisher');
    }

    XLSX.writeFile(wb, `gramakam-${type}-report.xlsx`);
  };

  // ========== Customer List Export ==========
  const exportCustomers = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // Collect from bills (sorted newest first)
    const allBills = getBills().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const allRequests = getRequests().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Deduplicate by normalised phone; prefer bill entry with most recent date
    const map = new Map<string, { name: string; phone: string; source: string; date: string }>();

    for (const b of allBills) {
      if (!b.customerName && !b.customerPhone) continue;
      const key = (b.customerPhone || b.customerName || '').trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: b.customerName || '',
          phone: b.customerPhone || '',
          source: 'Billing',
          date: new Date(b.createdAt).toLocaleDateString('en-IN'),
        });
      }
    }

    for (const r of allRequests) {
      const key = (r.phone || r.customerName || '').trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: r.customerName || '',
          phone: r.phone || '',
          source: 'Pre-order Request',
          date: new Date(r.createdAt).toLocaleDateString('en-IN'),
        });
      }
    }

    const rows = Array.from(map.values()).map((c, i) => ({
      '#': i + 1,
      'Customer Name': c.name,
      'Phone': c.phone,
      'Source': c.source,
      'First Seen': c.date,
    }));

    if (rows.length === 0) {
      alert('No customers with name/phone data found yet.');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    // Widen columns
    ws['!cols'] = [{ wch: 5 }, { wch: 28 }, { wch: 16 }, { wch: 20 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `gramakam-customers-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ========== JSON Backup ==========
  const downloadBackup = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gramakam-bookfest-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ========== Restore Backup ==========
  const handleRestoreFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      let preview: { books?: unknown[]; bills?: unknown[] };
      try { preview = JSON.parse(json); } catch { setRestoreStatus({ type: 'error', text: 'Invalid JSON file.' }); return; }
      if (!preview.books || !preview.bills) { setRestoreStatus({ type: 'error', text: 'File does not look like a Gramakam backup (missing books or bills).' }); return; }
      const bookCount = Array.isArray(preview.books) ? preview.books.length : 0;
      const billCount = Array.isArray(preview.bills) ? preview.bills.length : 0;
      const ok = window.confirm(
        `Restore backup?\n\nThis will REPLACE all current data with:\n• ${bookCount} books\n• ${billCount} bills\n\nCurrent data will be overwritten. Continue?`
      );
      if (!ok) { setRestoreStatus(null); return; }
      const success = importData(json);
      if (success) {
        reload();
        setRestoreStatus({ type: 'success', text: `Restored ${bookCount} books and ${billCount} bills successfully.` });
      } else {
        setRestoreStatus({ type: 'error', text: 'Restore failed — backup file may be corrupt.' });
      }
    };
    reader.readAsText(file);
    // reset so same file can be re-picked
    if (restoreFileRef.current) restoreFileRef.current.value = '';
  };

  const statCards = [
    { label: 'Total Books', value: stats.totalBooks, icon: Package, color: 'bg-blue-100 text-blue-600' },
    { label: 'Books Sold', value: stats.totalSold, icon: TrendingUp, color: 'bg-green-100 text-green-600' },
    { label: 'Remaining', value: stats.totalRemaining, icon: BookOpen, color: 'bg-yellow-100 text-yellow-700' },
    { label: 'Revenue', value: `₹${stats.totalRevenue.toFixed(0)}`, icon: IndianRupee, color: 'bg-purple-100 text-purple-600' },
    { label: 'Our Profit', value: `₹${pubStats.reduce((s, p) => s + p.profit, 0).toFixed(0)}`, icon: Percent, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Bills', value: stats.totalBills, icon: FileText, color: 'bg-orange-100 text-orange-600' },
    { label: 'Publishers', value: stats.uniquePublishers, icon: Users, color: 'bg-teal-100 text-teal-600' },
  ];
  const paidBills = bills.filter((b) => b.status !== 'unpaid');
  const cashRevenue = paidBills.filter((b) => b.paymentMethod === 'cash').reduce((s, b) => s + b.grandTotal, 0);
  const upiRevenue  = paidBills.filter((b) => b.paymentMethod === 'upi').reduce((s, b) => s + b.grandTotal, 0);
  const unknownRevenue = paidBills.filter((b) => !b.paymentMethod).reduce((s, b) => s + b.grandTotal, 0);
  const splitTotal = cashRevenue + upiRevenue + unknownRevenue;
  const cashPct   = splitTotal > 0 ? (cashRevenue / splitTotal) * 100 : 0;
  const upiPct    = splitTotal > 0 ? (upiRevenue  / splitTotal) * 100 : 0;
  const unknownPct = splitTotal > 0 ? (unknownRevenue / splitTotal) * 100 : 0;
  return (
    <div>
      <h2 className="text-2xl font-bold text-charcoal mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
        Reports &amp; Analytics
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-2`}>
              <s.icon size={18} />
            </div>
            <p className="text-xl font-bold text-charcoal">{s.value}</p>
            <p className="text-gray-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cash vs UPI breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
        <h3 className="text-sm font-bold text-charcoal mb-4 flex items-center gap-2">
          <IndianRupee size={15} className="text-maroon" />
          Payment Method Breakdown
        </h3>

        {/* Three stat tiles */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Banknote size={14} className="text-green-600" />
              <span className="text-xs font-semibold text-green-700">Cash</span>
            </div>
            <p className="text-lg font-bold text-green-800">₹{cashRevenue.toFixed(0)}</p>
            <p className="text-[11px] text-green-600">{cashPct.toFixed(1)}%</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Smartphone size={14} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">UPI</span>
            </div>
            <p className="text-lg font-bold text-blue-800">₹{upiRevenue.toFixed(0)}</p>
            <p className="text-[11px] text-blue-600">{upiPct.toFixed(1)}%</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <IndianRupee size={14} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-500">Unknown</span>
            </div>
            <p className="text-lg font-bold text-gray-700">₹{unknownRevenue.toFixed(0)}</p>
            <p className="text-[11px] text-gray-400">{unknownPct.toFixed(1)}%</p>
          </div>
        </div>

        {/* Stacked bar */}
        {splitTotal > 0 && (
          <div>
            <div className="flex h-3 rounded-full overflow-hidden gap-[1px]">
              {cashPct > 0 && (
                <motion.div
                  className="bg-green-400 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${cashPct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              )}
              {upiPct > 0 && (
                <motion.div
                  className="bg-blue-400 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${upiPct}%` }}
                  transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
                />
              )}
              {unknownPct > 0 && (
                <motion.div
                  className="bg-gray-200 h-full flex-1"
                  initial={{ width: 0 }}
                  animate={{ width: `${unknownPct}%` }}
                  transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                />
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Cash</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />UPI</span>
              {unknownPct > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />Untagged (older bills)</span>}
            </div>
          </div>
        )}
        {splitTotal === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">No paid bills yet</p>
        )}
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Inventory Report */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Package size={20} className="text-blue-600" /></div>
            <div>
              <h4 className="font-semibold text-charcoal">Inventory Report</h4>
              <p className="text-xs text-gray-500">All books with stock levels</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportPDF('inventory')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
              <FileText size={15} /> PDF
            </button>
            <button onClick={() => exportExcel('inventory')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-50 text-green-600 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors">
              <FileSpreadsheet size={15} /> Excel
            </button>
          </div>
        </div>

        {/* Sales Report */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><TrendingUp size={20} className="text-green-600" /></div>
            <div>
              <h4 className="font-semibold text-charcoal">Sales Report</h4>
              <p className="text-xs text-gray-500">All bills with line items</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportPDF('sales')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
              <FileText size={15} /> PDF
            </button>
            <button onClick={() => exportExcel('sales')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-50 text-green-600 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors">
              <FileSpreadsheet size={15} /> Excel
            </button>
          </div>
        </div>

        {/* Publisher Report */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><BarChart3 size={20} className="text-purple-600" /></div>
            <div>
              <h4 className="font-semibold text-charcoal">Publisher Report</h4>
              <p className="text-xs text-gray-500">By publisher breakdown</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportPDF('publisher')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
              <FileText size={15} /> PDF
            </button>
            <button onClick={() => exportExcel('publisher')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-50 text-green-600 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors">
              <FileSpreadsheet size={15} /> Excel
            </button>
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center"><Phone size={20} className="text-teal-600" /></div>
            <div>
              <h4 className="font-semibold text-charcoal">Customer List</h4>
              <p className="text-xs text-gray-500">Names &amp; numbers from bills</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCustomers}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-teal-50 text-teal-700 rounded-xl text-sm font-medium hover:bg-teal-100 transition-colors"
            >
              <FileSpreadsheet size={15} /> Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* ========== CHARTS SECTION ========== */}
      {stats.totalSold > 0 && (
        <div className="mb-8 space-y-4">
          <h3 className="text-lg font-bold text-charcoal flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <BarChart3 size={20} className="text-maroon" /> Visual Analytics
          </h3>

          {/* Chart 1: Daily Sales — full width so all days are visible */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar size={16} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-charcoal text-sm">Daily Book Sales</h4>
                  <p className="text-[11px] text-gray-400">Books sold &amp; revenue — all festival days</p>
                </div>
              </div>
              <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{getDailySalesData(bills).length} day{getDailySalesData(bills).length !== 1 ? 's' : ''}</span>
            </div>
            <BarChart
              data={getDailySalesData(bills).map((d) => ({ label: d.day, value: d.sold, sub: `₹${d.revenue.toFixed(0)}` }))}
              color="bg-gradient-to-r from-blue-400 to-blue-600"
            />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 2: Publisher Sales */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users size={16} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-charcoal text-sm">Sales by Publisher</h4>
                  <p className="text-[11px] text-gray-400">Top publishers by units sold</p>
                </div>
              </div>
              <BarChart
                data={getPublisherSalesData(pubStats).map((p) => ({ label: p.publisher, value: p.totalSold, sub: `₹${p.revenue.toFixed(0)}` }))}
                color="bg-gradient-to-r from-purple-400 to-purple-600"
              />
            </motion.div>

            {/* Chart 3: Top Selling Books */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Award size={16} className="text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-charcoal text-sm">Top Selling Books</h4>
                  <p className="text-[11px] text-gray-400">Most popular books by units sold</p>
                </div>
              </div>
              <BarChart
                data={getTopBooksData(books).map((b) => ({ label: b.localTitle || b.title, value: b.sold, sub: b.publisher }))}
                color="bg-gradient-to-r from-amber-400 to-orange-500"
              />
            </motion.div>
          </div>
        </div>
      )}

      {/* Publisher Breakdown Table */}
      {pubStats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-charcoal flex items-center gap-2"><Users size={18} /> Publisher-wise Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Publisher</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Sold</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Remaining</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Revenue</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Profit %</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Our Profit</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Progress</th>
                </tr>
              </thead>
              <tbody>
                {pubStats.map((p) => {
                  const pct = p.totalBooks > 0 ? Math.round((p.totalSold / p.totalBooks) * 100) : 0;
                  return (
                    <tr key={p.publisher} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-charcoal">{p.publisher}</td>
                      <td className="px-4 py-3 text-center">{p.totalBooks}</td>
                      <td className="px-4 py-3 text-center text-green-600 font-medium">{p.totalSold}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.totalRemaining === 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>{p.totalRemaining}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">₹{p.revenue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.profitPercent > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>{p.profitPercent}%</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">₹{p.profit.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-maroon rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Backup */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-charcoal">Data Backup</h4>
            <p className="text-sm text-gray-500 mt-0.5">Download all data as a JSON file for safekeeping.</p>
          </div>
          <button onClick={downloadBackup} className="flex items-center gap-2 px-4 py-2.5 bg-charcoal text-white rounded-xl text-sm font-medium hover:bg-black transition-colors">
            <Download size={16} /> Download Backup
          </button>
        </div>
      </div>

      {/* Restore Backup */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-semibold text-blue-800">Restore Backup</h4>
            <p className="text-sm text-blue-600 mt-0.5">Load a previously downloaded backup JSON file. <strong>Replaces all current data.</strong></p>
            {restoreStatus && (
              <p className={`text-sm mt-2 font-medium ${restoreStatus.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                {restoreStatus.type === 'success' ? '✓ ' : '✕ '}{restoreStatus.text}
              </p>
            )}
          </div>
          <button
            onClick={() => { setRestoreStatus(null); restoreFileRef.current?.click(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
          >
            <Upload size={16} /> Restore Backup
          </button>
        </div>
        <input
          ref={restoreFileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRestoreFile(f); }}
        />
      </div>

      {/* Clear All Data */}
      <div className="bg-red-50 rounded-2xl p-5 border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-red-700">Clear All Data</h4>
            <p className="text-sm text-red-500 mt-0.5">Permanently delete all books, bills, and publisher data. Download a backup first!</p>
          </div>
          <button
            onClick={() => {
              const confirm1 = window.confirm('Are you sure you want to delete ALL data? This cannot be undone.');
              if (!confirm1) return;
              const confirm2 = window.prompt('Type DELETE to confirm:');
              if (confirm2 !== 'DELETE') { alert('Cancelled. Data is safe.'); return; }
              clearAllData();
              setStats(getStats());
              setPubStats(getPublisherStats());
              alert('All data has been cleared.');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Trash2 size={16} /> Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
