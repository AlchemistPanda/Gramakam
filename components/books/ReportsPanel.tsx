'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, FileSpreadsheet, Download, TrendingUp, BarChart3,
  IndianRupee, Package, BookOpen, Users,
} from 'lucide-react';
import {
  getStats,
  getPublisherStats,
  getBooks,
  getBills,
  exportAllData,
} from '@/lib/bookStore';

export default function ReportsPanel() {
  const [stats, setStats] = useState({ totalBooks: 0, totalSold: 0, totalRemaining: 0, totalRevenue: 0, totalBills: 0, uniquePublishers: 0 });
  const [pubStats, setPubStats] = useState<ReturnType<typeof getPublisherStats>>([]);
  const [view, setView] = useState<'overview' | 'publisher' | 'books' | 'bills'>('overview');

  useEffect(() => {
    setStats(getStats());
    setPubStats(getPublisherStats());
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
        head: [['Publisher', 'Total Books', 'Sold', 'Remaining', 'Revenue']],
        body: pubStats.map((p) => [
          p.publisher, p.totalBooks, p.totalSold, p.totalRemaining, `₹${p.revenue.toFixed(2)}`,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [128, 0, 32] },
      });
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
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'By Publisher');
    }

    XLSX.writeFile(wb, `gramakam-${type}-report.xlsx`);
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

  const statCards = [
    { label: 'Total Books', value: stats.totalBooks, icon: Package, color: 'bg-blue-100 text-blue-600' },
    { label: 'Books Sold', value: stats.totalSold, icon: TrendingUp, color: 'bg-green-100 text-green-600' },
    { label: 'Remaining', value: stats.totalRemaining, icon: BookOpen, color: 'bg-yellow-100 text-yellow-700' },
    { label: 'Revenue', value: `₹${stats.totalRevenue.toFixed(0)}`, icon: IndianRupee, color: 'bg-purple-100 text-purple-600' },
    { label: 'Bills', value: stats.totalBills, icon: FileText, color: 'bg-orange-100 text-orange-600' },
    { label: 'Publishers', value: stats.uniquePublishers, icon: Users, color: 'bg-teal-100 text-teal-600' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-charcoal mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
        Reports &amp; Analytics
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
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

      {/* Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
      </div>

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
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
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
    </div>
  );
}
