'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, Search, Upload, Camera, CheckCircle, X, Package, AlertCircle, FileSpreadsheet, Download } from 'lucide-react';
import type { Book, OCRLine } from '@/types/books';
import {
  getBooks,
  addBook,
  addBooksInBulk,
  updateBook,
  deleteBook,
  searchBooks,
  getPublishers,
} from '@/lib/bookStore';

export default function InventoryPanel() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publishers, setPublishers] = useState<string[]>([]);

  // Form fields
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('');

  const reload = () => {
    setBooks(query ? searchBooks(query) : getBooks());
    setPublishers(getPublishers().map((p) => p.name));
  };

  useEffect(() => { reload(); }, [query]);

  const resetForm = () => {
    setTitle(''); setPublisher(''); setPrice(''); setQuantity(''); setCategory('');
    setEditingId(null); setShowForm(false);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !publisher || !price || !quantity) return;

    if (editingId) {
      updateBook(editingId, {
        title, publisher, price: parseFloat(price), quantity: parseInt(quantity), category,
      });
    } else {
      addBook({ title, publisher, price: parseFloat(price), quantity: parseInt(quantity), category });
    }
    resetForm();
    reload();
  };

  const handleEdit = (book: Book) => {
    setEditingId(book.id);
    setTitle(book.title);
    setPublisher(book.publisher);
    setPrice(book.price.toString());
    setQuantity(book.quantity.toString());
    setCategory(book.category || '');
    setShowForm(true);
    setShowOCR(false);
    setShowImport(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this book from inventory?')) return;
    deleteBook(id);
    reload();
  };

  const handleOCRComplete = (items: OCRLine[]) => {
    const confirmed = items.filter((i) => i.confirmed && i.title);
    if (confirmed.length === 0) return;
    addBooksInBulk(
      confirmed.map((i) => ({
        title: i.title,
        publisher: i.publisher,
        price: i.price,
        quantity: i.quantity,
        category: '',
      }))
    );
    setShowOCR(false);
    reload();
  };

  const handleImportComplete = (count: number) => {
    setShowImport(false);
    reload();
    alert(`Successfully imported ${count} books!`);
  };

  const remaining = (b: Book) => b.quantity - b.sold;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>
          Book Inventory
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { resetForm(); setShowForm(!showForm); setShowOCR(false); setShowImport(false); }} className="btn-primary text-sm flex items-center gap-2 rounded-xl">
            <Plus size={16} /> Add Book
          </button>
          <button onClick={() => { setShowImport(!showImport); setShowForm(false); setShowOCR(false); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <FileSpreadsheet size={16} /> Import List
          </button>
          <button onClick={() => { setShowOCR(!showOCR); setShowForm(false); setShowImport(false); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <Camera size={16} /> Scan List
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search books by title, publisher, or category..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-maroon outline-none bg-white"
        />
      </div>

      {/* Add Book Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-charcoal mb-4">{editingId ? 'Edit Book' : 'Add New Book'}</h3>
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <input type="text" placeholder="Book Title *" value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-maroon outline-none" required />
                </div>
                <div className="relative">
                  <select value={publisher} onChange={(e) => setPublisher(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-maroon outline-none appearance-none bg-white" required>
                    <option value="">Select Publisher *</option>
                    {publishers.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                <input type="text" placeholder="Category (optional)" value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-maroon outline-none" />
                <input type="number" step="0.01" min="0" placeholder="Price (₹) *" value={price} onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-maroon outline-none" required />
                <input type="number" min="1" placeholder="Quantity *" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-maroon outline-none" required />
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="btn-primary text-sm rounded-xl">{editingId ? 'Update Book' : 'Add Book'}</button>
                  <button type="button" onClick={resetForm} className="btn-secondary text-sm rounded-xl">Cancel</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OCR Upload */}
      <AnimatePresence>
        {showOCR && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <OCRUploadPanel onComplete={handleOCRComplete} onClose={() => setShowOCR(false)} defaultPublisher={publishers[0] || ''} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import List */}
      <AnimatePresence>
        {showImport && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <ImportListPanel publishers={publishers} onComplete={handleImportComplete} onClose={() => setShowImport(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Books Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {books.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-lg">No books in inventory</p>
            <p className="text-sm mt-1">Add books manually or scan a printed list.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Publisher</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Price</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Stock</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Sold</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Left</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-charcoal">{book.title}</p>
                      {book.category && <p className="text-gray-400 text-xs mt-0.5">{book.category}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{book.publisher}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{book.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">{book.quantity}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{book.sold}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        remaining(book) === 0 ? 'bg-red-100 text-red-700' :
                        remaining(book) <= 3 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {remaining(book)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleEdit(book)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"><Edit size={15} /></button>
                        <button onClick={() => handleDelete(book.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {books.length > 0 && (
          <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-100 text-sm text-gray-500">
            Showing {books.length} book{books.length !== 1 ? 's' : ''}
            {' · '}Total stock: {books.reduce((s, b) => s + b.quantity, 0)}
            {' · '}Sold: {books.reduce((s, b) => s + b.sold, 0)}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== OCR UPLOAD COMPONENT ====================

function OCRUploadPanel({
  onComplete,
  onClose,
  defaultPublisher,
}: {
  onComplete: (items: OCRLine[]) => void;
  onClose: () => void;
  defaultPublisher: string;
}) {
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [progress, setProgress] = useState(0);
  const [ocrLines, setOcrLines] = useState<OCRLine[]>([]);
  const [bulkPublisher, setBulkPublisher] = useState(defaultPublisher);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setStep('processing');
    setProgress(0);

    try {
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const text = result.data.text;
      const lines = text
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 3);

      // Parse lines — try to extract title, price, quantity
      const parsed: OCRLine[] = lines.map((line: string, i: number) => {
        // Try to find price pattern (numbers with optional decimal)
        const priceMatch = line.match(/₹?\s*(\d+(?:\.\d{1,2})?)/);
        // Try to find quantity pattern (often at start or end, single/double digit)
        const qtyMatch = line.match(/(?:^|\s)(\d{1,3})(?:\s|$)/);

        let title = line;
        let price = 0;
        let qty = 1;

        if (priceMatch) {
          price = parseFloat(priceMatch[1]);
          title = title.replace(priceMatch[0], '').trim();
        }
        if (qtyMatch && parseInt(qtyMatch[1]) <= 999) {
          qty = parseInt(qtyMatch[1]);
        }

        // Clean up title
        title = title.replace(/[|[\]{}]/g, '').replace(/\s+/g, ' ').trim();

        return {
          id: `ocr_${i}_${Date.now()}`,
          title,
          publisher: bulkPublisher,
          price,
          quantity: qty,
          confirmed: false,
        };
      });

      setOcrLines(parsed.filter((p) => p.title.length > 1));
      setStep('review');
    } catch {
      alert('OCR processing failed. Please try a clearer image.');
      setStep('upload');
    }
  };

  const updateLine = (id: string, field: keyof OCRLine, value: string | number | boolean) => {
    setOcrLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const toggleAll = (confirmed: boolean) => {
    setOcrLines((prev) => prev.map((l) => ({ ...l, confirmed })));
  };

  const removeLine = (id: string) => {
    setOcrLines((prev) => prev.filter((l) => l.id !== id));
  };

  // Apply bulk publisher to all lines
  const applyBulkPublisher = () => {
    setOcrLines((prev) => prev.map((l) => ({ ...l, publisher: bulkPublisher })));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-charcoal flex items-center gap-2">
          <Camera size={18} className="text-blue-600" /> Scan Book List (OCR)
        </h3>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Publisher (for all books in this list)</label>
            <input type="text" value={bulkPublisher} onChange={(e) => setBulkPublisher(e.target.value)}
              placeholder="Enter publisher name" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
          >
            <Upload size={40} className="mx-auto mb-3 text-gray-400" />
            <p className="font-medium text-charcoal">Upload or take a photo of the book list</p>
            <p className="text-gray-500 text-sm mt-1">Supports JPG, PNG, HEIC — use good lighting for best results</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className="mt-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-700 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>For best results, ensure the printed list is clearly visible with good lighting. The OCR will try to extract book titles and prices automatically.</p>
          </div>
        </div>
      )}

      {/* Step 2: Processing */}
      {step === 'processing' && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-medium text-charcoal">Reading your book list...</p>
          <div className="w-64 mx-auto mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-gray-500 text-sm mt-2">{progress}% complete</p>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Found <strong>{ocrLines.length}</strong> items. Review and correct, then confirm.
            </p>
            <div className="flex gap-2">
              <button onClick={applyBulkPublisher} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Apply Publisher to All
              </button>
              <button onClick={() => toggleAll(true)} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors">
                Select All
              </button>
              <button onClick={() => toggleAll(false)} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Deselect All
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
            {ocrLines.map((line) => (
              <div key={line.id} className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${line.confirmed ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                <button onClick={() => updateLine(line.id, 'confirmed', !line.confirmed)}
                  className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${line.confirmed ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'}`}>
                  {line.confirmed && <CheckCircle size={14} />}
                </button>
                <input type="text" value={line.title} onChange={(e) => updateLine(line.id, 'title', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-maroon outline-none" placeholder="Book Title" />
                <input type="text" value={line.publisher} onChange={(e) => updateLine(line.id, 'publisher', e.target.value)}
                  className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-maroon outline-none" placeholder="Publisher" />
                <input type="number" value={line.price || ''} onChange={(e) => updateLine(line.id, 'price', parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-right focus:ring-1 focus:ring-maroon outline-none" placeholder="₹" />
                <input type="number" value={line.quantity || ''} onChange={(e) => updateLine(line.id, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-14 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:ring-1 focus:ring-maroon outline-none" placeholder="Qty" />
                <button onClick={() => removeLine(line.id)} className="shrink-0 p-1 text-gray-400 hover:text-red-500"><X size={14} /></button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => onComplete(ocrLines)}
              className="btn-primary text-sm rounded-xl flex items-center gap-2"
              disabled={!ocrLines.some((l) => l.confirmed)}
            >
              <CheckCircle size={16} /> Add {ocrLines.filter((l) => l.confirmed).length} Books to Inventory
            </button>
            <button onClick={() => setStep('upload')} className="btn-secondary text-sm rounded-xl">
              Scan Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== IMPORT LIST COMPONENT ====================

function ImportListPanel({
  publishers,
  onComplete,
  onClose,
}: {
  publishers: string[];
  onComplete: (count: number) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [rows, setRows] = useState<{ title: string; publisher: string; price: number; quantity: number; category: string; valid: boolean }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Download Excel template
  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const sampleData = [
      { 'Book Title': 'Example Book Name', 'Publisher': publishers[0] || 'Publisher Name', 'Price': 250, 'Quantity': 5, 'Category': 'Fiction' },
      { 'Book Title': 'Another Book', 'Publisher': publishers[0] || 'Publisher Name', 'Price': 180, 'Quantity': 3, 'Category': 'Poetry' },
      { 'Book Title': '', 'Publisher': '', 'Price': '', 'Quantity': '', 'Category': '' },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Book Title
      { wch: 20 }, // Publisher
      { wch: 10 }, // Price
      { wch: 10 }, // Quantity
      { wch: 15 }, // Category
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Books');
    XLSX.writeFile(wb, 'gramakam-book-import-template.xlsx');
  };

  // Download CSV template
  const downloadCSVTemplate = () => {
    const header = 'Book Title,Publisher,Price,Quantity,Category';
    const row1 = `Example Book Name,${publishers[0] || 'Publisher Name'},250,5,Fiction`;
    const row2 = `Another Book,${publishers[0] || 'Publisher Name'},180,3,Poetry`;
    const csv = `${header}\n${row1}\n${row2}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gramakam-book-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse uploaded file
  const handleFile = async (file: File) => {
    const errs: string[] = [];

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      if (json.length === 0) {
        setErrors(['The file is empty. Please add book data and try again.']);
        return;
      }

      const parsed = json.map((row, i) => {
        const title = String(row['Book Title'] || row['Title'] || row['book title'] || row['title'] || '').trim();
        const pub = String(row['Publisher'] || row['publisher'] || '').trim();
        const priceRaw = row['Price'] || row['price'] || row['Price (₹)'] || 0;
        const qtyRaw = row['Quantity'] || row['quantity'] || row['Qty'] || row['qty'] || 1;
        const category = String(row['Category'] || row['category'] || '').trim();

        const price = parseFloat(String(priceRaw)) || 0;
        const quantity = parseInt(String(qtyRaw)) || 0;

        let valid = true;
        if (!title) { errs.push(`Row ${i + 2}: Missing book title`); valid = false; }
        if (!pub) { errs.push(`Row ${i + 2}: Missing publisher`); valid = false; }
        if (price <= 0) { errs.push(`Row ${i + 2}: Invalid price for "${title}"`); valid = false; }
        if (quantity <= 0) { errs.push(`Row ${i + 2}: Invalid quantity for "${title}"`); valid = false; }

        return { title, publisher: pub, price, quantity, category, valid };
      }).filter((r) => r.title || r.publisher); // skip completely empty rows

      setRows(parsed);
      setErrors(errs);
      setStep('preview');
    } catch {
      setErrors(['Failed to read the file. Please ensure it is a valid Excel (.xlsx) or CSV file.']);
    }
  };

  // Import valid rows
  const handleImport = () => {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    addBooksInBulk(
      validRows.map((r) => ({
        title: r.title,
        publisher: r.publisher,
        price: r.price,
        quantity: r.quantity,
        category: r.category,
      }))
    );

    onComplete(validRows.length);
  };

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-charcoal flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-emerald-600" /> Import Book List
        </h3>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>

      {step === 'upload' && (
        <div>
          {/* Template Download */}
          <div className="bg-emerald-50 rounded-xl p-4 mb-5 border border-emerald-100">
            <h4 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
              <Download size={16} /> Step 1: Download Template
            </h4>
            <p className="text-sm text-emerald-700 mb-3">
              Download the template, fill in your book data, then upload it below. The columns are:
            </p>
            <div className="overflow-x-auto mb-3">
              <table className="text-xs border border-emerald-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-emerald-100">
                    <th className="px-3 py-2 text-left text-emerald-800">Book Title *</th>
                    <th className="px-3 py-2 text-left text-emerald-800">Publisher *</th>
                    <th className="px-3 py-2 text-left text-emerald-800">Price *</th>
                    <th className="px-3 py-2 text-left text-emerald-800">Quantity *</th>
                    <th className="px-3 py-2 text-left text-emerald-800">Category</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-3 py-2 text-gray-600">The God of Small Things</td>
                    <td className="px-3 py-2 text-gray-600">DC Books</td>
                    <td className="px-3 py-2 text-gray-600">350</td>
                    <td className="px-3 py-2 text-gray-600">10</td>
                    <td className="px-3 py-2 text-gray-600">Fiction</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                <Download size={14} /> Excel Template (.xlsx)
              </button>
              <button onClick={downloadCSVTemplate} className="flex items-center gap-1.5 px-3 py-2 bg-white text-emerald-700 border border-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors">
                <Download size={14} /> CSV Template
              </button>
            </div>
          </div>

          {/* Upload */}
          <div>
            <h4 className="font-medium text-charcoal mb-2 flex items-center gap-2">
              <Upload size={16} /> Step 2: Upload Your File
            </h4>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
            >
              <FileSpreadsheet size={40} className="mx-auto mb-3 text-gray-400" />
              <p className="font-medium text-charcoal">Click to upload Excel or CSV file</p>
              <p className="text-gray-500 text-sm mt-1">Supports .xlsx, .xls, .csv files</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div>
          {/* Status Summary */}
          <div className="flex gap-3 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              <CheckCircle size={14} /> {validCount} valid
            </div>
            {invalidCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                <AlertCircle size={14} /> {invalidCount} with errors
              </div>
            )}
            <div className="text-sm text-gray-500 self-center">
              {rows.length} total rows found
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 max-h-24 overflow-y-auto">
              {errors.slice(0, 10).map((err, i) => (
                <p key={i} className="text-xs text-red-600">{err}</p>
              ))}
              {errors.length > 10 && <p className="text-xs text-red-500 mt-1">...and {errors.length - 10} more errors</p>}
            </div>
          )}

          {/* Preview Table */}
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto border border-gray-200 rounded-xl mb-4">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600 w-8">#</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Title</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Publisher</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Price</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Qty</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Category</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50/50' : 'hover:bg-gray-50/50'}`}>
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-charcoal">{row.title || <span className="text-red-400 italic">missing</span>}</td>
                    <td className="px-3 py-2 text-gray-600">{row.publisher || <span className="text-red-400 italic">missing</span>}</td>
                    <td className="px-3 py-2 text-right">{row.price > 0 ? `₹${row.price}` : <span className="text-red-400">—</span>}</td>
                    <td className="px-3 py-2 text-center">{row.quantity > 0 ? row.quantity : <span className="text-red-400">—</span>}</td>
                    <td className="px-3 py-2 text-gray-500">{row.category || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      {row.valid
                        ? <span className="inline-flex px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">✓ OK</span>
                        : <span className="inline-flex px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">✕ Error</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={validCount === 0}
              className="btn-primary text-sm rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle size={16} /> Import {validCount} Books
            </button>
            <button onClick={() => { setStep('upload'); setRows([]); setErrors([]); }} className="btn-secondary text-sm rounded-xl">
              Upload Different File
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-sm px-3 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
