'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, X, CheckCircle, Percent, History, Eye, ChevronLeft, ScanBarcode, Bluetooth, BluetoothConnected, BluetoothOff, Loader2, CreditCard, BadgeCheck, Edit3, Save, MessageCircle, Banknote, Smartphone, Lock, AlertTriangle, Clock } from 'lucide-react';
import type { Book, BillItem, Bill } from '@/types/books';
import { getBooks, getBills, createBill, editBill, deleteBill, findBookByIsbn, onDataChange, markBillAsPaid, updateBillUpi } from '@/lib/bookStore';
import { printBill as hybridPrint, connectPrinter, disconnectPrinter, isPrinterConnected, isBluetoothAvailable, getConnectedPrinterName, getSavedPrinterName, generateUpiQR } from '@/lib/billPrinter';
import BarcodeScanner from './BarcodeScanner';

/* ── Bill action passcode modal ───────────────────────
   Requires passcode '9090' before editing or deleting a bill
──────────────────────────────────────────────────── */
const BILL_PASSCODE = '9090';

function BillActionPasscode({
  type,
  billNumber,
  onConfirm,
  onClose,
}: {
  type: 'edit' | 'delete' | 'mark_paid';
  billNumber: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const [shake, setShake]  = useState(false);
  const [error, setError]  = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const attempt = () => {
    if (value === BILL_PASSCODE) {
      onConfirm();
    } else {
      setShake(true);
      setError('Incorrect passcode.');
      setValue('');
      setTimeout(() => setShake(false), 500);
    }
  };

  const isDelete  = type === 'delete';
  const isMarkPaid = type === 'mark_paid';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-7 w-full max-w-sm mx-4 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <X size={18} />
        </button>

        <div className="flex flex-col items-center mb-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${isDelete ? 'bg-red-100' : isMarkPaid ? 'bg-green-100' : 'bg-blue-100'}`}>
            {isDelete ? <AlertTriangle size={26} className="text-red-600" /> : isMarkPaid ? <BadgeCheck size={26} className="text-green-600" /> : <Lock size={26} className="text-blue-600" />}
          </div>
          <h2 className="text-lg font-bold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>
            {isDelete ? `Delete Bill #${billNumber}?` : isMarkPaid ? `Mark Bill #${billNumber} as Paid?` : `Edit Bill #${billNumber}`}
          </h2>
          {isDelete && (
            <p className="text-xs text-red-500 font-medium text-center mt-1">
              This will permanently delete the bill and reverse all stock changes.
            </p>
          )}
          {isMarkPaid && (
            <p className="text-xs text-green-600 font-medium text-center mt-1">
              Confirm payment has been received from the customer.
            </p>
          )}
          <p className="text-sm text-gray-500 text-center mt-2">Enter passcode to confirm</p>
        </div>

        <motion.div animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}} transition={{ duration: 0.4 }}>
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && attempt()}
            className={`w-full text-center text-2xl tracking-[0.5em] px-4 py-3.5 border-2 rounded-2xl outline-none transition-colors font-mono ${
              error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-maroon'
            }`}
            placeholder="••••"
            maxLength={20}
          />
        </motion.div>

        {error && <p className="text-xs text-red-500 font-medium text-center mt-2">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={attempt}
            className={`flex-1 py-3 rounded-2xl font-semibold text-sm text-white transition-colors ${
              isDelete ? 'bg-red-600 hover:bg-red-700' : isMarkPaid ? 'bg-green-600 hover:bg-green-700' : 'bg-maroon hover:bg-opacity-90'
            }`}
          >
            {isDelete ? 'Delete' : isMarkPaid ? 'Confirm Paid' : 'Unlock'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Indian mobile number validator ───────────────────
   Accepts: 10-digit numbers starting with 6-9,
   optionally prefixed with +91 or 91
──────────────────────────────────────────────────── */
function normaliseIndianMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  // strip leading 91 only if result is still 10 digits
  const ten = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  if (ten.length === 10 && /^[6-9]/.test(ten)) return ten;
  return null;
}


interface EditBillModalProps {
  editingBill: Bill;
  editItems: { bookId: string; title: string; localTitle?: string; publisher: string; price: number; quantity: number; maxQty: number }[];
  editDiscount: number;
  editCustomerName: string;
  editCustomerPhone: string;
  editSearch: string;
  editSearchResults: Book[];
  setEditingBill: (b: Bill | null) => void;
  setEditSearch: (s: string) => void;
  setEditDiscount: (n: number) => void;
  setEditCustomerName: (s: string) => void;
  setEditCustomerPhone: (s: string) => void;
  updateEditQty: (bookId: string, delta: number) => void;
  removeEditItem: (bookId: string) => void;
  addEditItem: (book: Book) => void;
  saveEditBill: () => void;
}

function EditBillModal({
  editingBill, editItems, editDiscount, editCustomerName, editCustomerPhone,
  editSearch, editSearchResults, setEditingBill, setEditSearch, setEditDiscount,
  setEditCustomerName, setEditCustomerPhone, updateEditQty, removeEditItem, addEditItem, saveEditBill,
}: EditBillModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => setEditingBill(null)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Edit Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-charcoal flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Edit3 size={20} className="text-blue-600" /> Edit Bill #{editingBill.billNumber}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(editingBill.createdAt).toLocaleString('en-IN')}</p>
          </div>
          <button onClick={() => setEditingBill(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>

        {/* Edit Body — Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Search to add items */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Add a book to this bill..."
              value={editSearch}
              onChange={(e) => setEditSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
            />
            {editSearchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-10 max-h-48 overflow-y-auto">
                {editSearchResults.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => addEditItem(book)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 text-left text-sm border-b border-gray-50 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-charcoal truncate">{book.localTitle || book.title}</p>
                      <p className="text-gray-400 text-xs">{book.publisher} · ₹{book.price}</p>
                    </div>
                    <div className="ml-2 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Plus size={14} className="text-blue-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current items */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bill Items</p>
            {editItems.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">No items — add books above or this bill will be empty</p>
            ) : (
              editItems.map((item) => (
                <div key={item.bookId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    {item.localTitle ? (
                      <>
                        <p className="font-semibold text-charcoal text-sm truncate" style={{ fontFamily: 'system-ui' }}>{item.localTitle}</p>
                        <p className="text-gray-400 text-xs truncate">{item.title}</p>
                      </>
                    ) : (
                      <p className="font-medium text-charcoal text-sm truncate">{item.title}</p>
                    )}
                    <p className="text-gray-400 text-xs">{item.publisher} · ₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => updateEditQty(item.bookId, -1)} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateEditQty(item.bookId, 1)} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="font-medium text-sm shrink-0 w-16 text-right">₹{(item.price * item.quantity).toFixed(0)}</p>
                  <button onClick={() => removeEditItem(item.bookId)} className="p-1.5 text-gray-300 hover:text-red-500 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Edit discount + customer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Discount (₹)</label>
              <input
                type="number" min="0" step="1"
                value={editDiscount || ''}
                onChange={(e) => setEditDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="₹0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Customer Name</label>
              <input
                type="text"
                value={editCustomerName}
                onChange={(e) => setEditCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Optional"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
              <input
                type="tel"
                value={editCustomerPhone}
                onChange={(e) => setEditCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        {/* Edit Footer — totals + save */}
        <div className="p-5 border-t border-gray-100 shrink-0 space-y-3">
          {(() => {
            const editSubtotal = editItems.reduce((s, i) => s + i.price * i.quantity, 0);
            const editGrandTotal = Math.max(0, editSubtotal - editDiscount);
            return (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {editItems.reduce((s, i) => s + i.quantity, 0)} items · Subtotal ₹{editSubtotal.toFixed(0)}
                  {editDiscount > 0 && <span className="text-red-500"> - ₹{editDiscount.toFixed(0)}</span>}
                </div>
                <p className="text-xl font-bold text-maroon" style={{ fontFamily: 'var(--font-heading)' }}>₹{editGrandTotal.toFixed(2)}</p>
              </div>
            );
          })()}
          <div className="flex gap-2">
            <button
              onClick={() => setEditingBill(null)}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveEditBill}
              disabled={editItems.length === 0}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function BillingPanel() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [cart, setCart] = useState<(BillItem & { available: number })[]>([]);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | undefined>(undefined);
  const [paymentMethodError, setPaymentMethodError] = useState(false);
  const [upiTxnId, setUpiTxnId] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const [showBill, setShowBill] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'unpaid' | 'upi_pending'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editItems, setEditItems] = useState<{ bookId: string; title: string; localTitle?: string; publisher: string; price: number; quantity: number; maxQty: number }[]>([]);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editSearch, setEditSearch] = useState('');
  const [editSearchResults, setEditSearchResults] = useState<Book[]>([]);
  const [btAvailable, setBtAvailable] = useState(false);
  const [btConnected, setBtConnected] = useState(false);
  const [btConnecting, setBtConnecting] = useState(false);
  const [btName, setBtName] = useState<string | null>(null);
  const [pendingBillAction, setPendingBillAction] = useState<{ type: 'edit' | 'delete' | 'mark_paid'; bill: Bill } | null>(null);
  const [upiResolveModal, setUpiResolveModal] = useState<Bill | null>(null);
  const [upiResolveTxnId, setUpiResolveTxnId] = useState('');
  const [printStatus, setPrintStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [billQr, setBillQr] = useState('');
  const [viewingQr, setViewingQr] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    setBooks(getBooks());
    setAllBills(getBills().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Check Bluetooth availability
  useEffect(() => {
    setBtAvailable(isBluetoothAvailable());
    setBtConnected(isPrinterConnected());
    setBtName(getConnectedPrinterName() || getSavedPrinterName());
  }, []);

  // Auto-clear print status
  useEffect(() => {
    if (printStatus) {
      const t = setTimeout(() => setPrintStatus(null), 3000);
      return () => clearTimeout(t);
    }
  }, [printStatus]);

  // Real-time sync
  useEffect(() => {
    const unsub = onDataChange(() => reload());
    return unsub;
  }, [reload]);

  // Live search — also matches ISBN
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const matched = books
      .filter((b) => (b.quantity - b.sold) > 0)
      .filter((b) => b.title.toLowerCase().includes(q) || b.localTitle?.toLowerCase().includes(q) || b.publisher.toLowerCase().includes(q) || b.isbn?.toLowerCase().includes(q))
      .slice(0, 8);
    setResults(matched);
  }, [query, books]);

  // Handle barcode scan in billing
  const handleBarcodeScan = (isbn: string) => {
    setShowBarcodeScanner(false);
    const book = findBookByIsbn(isbn);
    if (book) {
      const available = book.quantity - book.sold;
      if (available <= 0) {
        setScanMessage({ type: 'error', text: `"${book.title}" is out of stock` });
        return;
      }
      addToCart(book);
      setScanMessage({ type: 'success', text: `Added "${book.title}" to cart` });
    } else {
      setScanMessage({ type: 'error', text: `No book found with ISBN ${isbn}` });
    }
    // Clear message after 3 seconds
    setTimeout(() => setScanMessage(null), 3000);
  };

  const addToCart = (book: Book) => {
    const available = book.quantity - book.sold;
    const inCartAlready = cart.find((c) => c.bookId === book.id);
    const cartQty = inCartAlready ? inCartAlready.quantity : 0;

    if (cartQty >= available) return; // no more available

    if (inCartAlready) {
      setCart((prev) => prev.map((c) => c.bookId === book.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart((prev) => [...prev, {
        bookId: book.id,
        title: book.title,
        ...(book.localTitle && { localTitle: book.localTitle }),
        publisher: book.publisher,
        price: book.price,
        quantity: 1,
        available,
      }]);
    }
    setQuery('');
    setResults([]);
    searchRef.current?.focus();
  };

  const updateCartQty = (bookId: string, delta: number) => {
    setCart((prev) => prev.map((c) => {
      if (c.bookId !== bookId) return c;
      const newQty = c.quantity + delta;
      if (newQty <= 0) return c;
      if (newQty > c.available) return c;
      return { ...c, quantity: newQty };
    }));
  };

  const removeFromCart = (bookId: string) => {
    setCart((prev) => prev.filter((c) => c.bookId !== bookId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Cap display at 0 so UI never shows a negative total (actual bill is also capped in handleCheckout)
  const grandTotal = Math.max(0, subtotal - discount);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = (status: 'paid' | 'unpaid' = 'paid', forceUpiPending = false) => {
    if (cart.length === 0) return;
    if (status === 'unpaid' && !customerName.trim()) {
      alert('Please enter the customer name for credit/pay-later bills.');
      return;
    }
    // Payment method is mandatory for paid bills
    if (status === 'paid' && !paymentMethod) {
      setPaymentMethodError(true);
      document.getElementById('payment-method-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setPaymentMethodError(false);
    const cappedDiscount = Math.min(discount, subtotal);
    const upiStatus = paymentMethod === 'upi'
      ? (forceUpiPending ? 'pending' as const : 'completed' as const)
      : undefined;
    const bill = createBill(
      cart.map((c) => ({ bookId: c.bookId, quantity: c.quantity })),
      cappedDiscount,
      customerName || undefined,
      customerPhone || undefined,
      status,
      paymentMethod,
      paymentMethod === 'upi' ? upiTxnId || undefined : undefined,
      upiStatus
    );
    if (bill) {
      setLastBill(bill);
      setShowBill(true);
      setCart([]);
      setDiscount(0);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod(undefined);
      setPaymentMethodError(false);
      setUpiTxnId('');
      setCashReceived('');
      reload();
      // Generate UPI QR with amount (skip for cash payments)
      if (status !== 'unpaid' && paymentMethod !== 'cash') {
        setBillQr('');
        generateUpiQR(bill.grandTotal, `Bill #${bill.billNumber}`)
          .then(setBillQr)
          .catch(() => {});
      } else if (status === 'unpaid') {
        generateUpiQR(bill.grandTotal, `Bill #${bill.billNumber} - Gramakam`)
          .then(setBillQr)
          .catch(() => {});
      } else {
        setBillQr('');
      }
    }
  };

  const handlePrint = async (bill: Bill) => {
    setPrintStatus({ type: 'info', text: 'Printing...' });
    const result = await hybridPrint(bill);
    if (result.success) {
      setPrintStatus({
        type: 'success',
        text: result.method === 'bluetooth' ? `Printed via ${btName || 'Bluetooth'}` : 'Sent to browser print',
      });
    } else {
      setPrintStatus({ type: 'error', text: result.error || 'Print failed' });
    }
  };

  const handleConnectPrinter = async () => {
    if (isPrinterConnected()) {
      await disconnectPrinter();
      setBtConnected(false);
      setBtName(null);
      return;
    }
    setBtConnecting(true);
    const result = await connectPrinter();
    setBtConnecting(false);
    if (result.success) {
      setBtConnected(true);
      setBtName(result.name || 'Printer');
      setPrintStatus({ type: 'success', text: `Connected to ${result.name}` });
    } else {
      setPrintStatus({ type: 'error', text: result.error || 'Connection failed' });
    }
  };

  // ========== Bill Edit Functions ==========

  const startEditBill = (bill: Bill) => {
    const allBooks = getBooks();
    const items = bill.items.map((item) => {
      const book = allBooks.find((b) => b.id === item.bookId);
      // maxQty = currently available + what's already in this bill item (since we'd reverse it)
      const available = book ? (book.quantity - book.sold + item.quantity) : item.quantity;
      return {
        bookId: item.bookId,
        title: item.title,
        localTitle: item.localTitle,
        publisher: item.publisher,
        price: item.price,
        quantity: item.quantity,
        maxQty: available,
      };
    });
    setEditItems(items);
    setEditDiscount(bill.discount);
    setEditCustomerName(bill.customerName || '');
    setEditCustomerPhone(bill.customerPhone || '');
    setEditingBill(bill);
    setEditSearch('');
    setEditSearchResults([]);
  };

  const updateEditQty = (bookId: string, delta: number) => {
    setEditItems((prev) => prev.map((item) => {
      if (item.bookId !== bookId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0 || newQty > item.maxQty) return item;
      return { ...item, quantity: newQty };
    }));
  };

  const removeEditItem = (bookId: string) => {
    setEditItems((prev) => prev.filter((item) => item.bookId !== bookId));
  };

  const addEditItem = (book: Book) => {
    const existing = editItems.find((e) => e.bookId === book.id);
    if (existing) {
      if (existing.quantity < existing.maxQty) {
        updateEditQty(book.id, 1);
      }
    } else {
      const available = book.quantity - book.sold;
      if (available <= 0) return;
      setEditItems((prev) => [...prev, {
        bookId: book.id,
        title: book.title,
        localTitle: book.localTitle,
        publisher: book.publisher,
        price: book.price,
        quantity: 1,
        maxQty: available,
      }]);
    }
    setEditSearch('');
    setEditSearchResults([]);
  };

  // Live search for add-item-to-edit
  useEffect(() => {
    if (!editingBill || !editSearch.trim()) {
      setEditSearchResults([]);
      return;
    }
    const q = editSearch.toLowerCase();
    const allBooks = getBooks();
    const matched = allBooks
      .filter((b) => {
        const inEdit = editItems.find((e) => e.bookId === b.id);
        const available = inEdit ? inEdit.maxQty - inEdit.quantity : (b.quantity - b.sold);
        return available > 0;
      })
      .filter((b) => b.title.toLowerCase().includes(q) || b.localTitle?.toLowerCase().includes(q) || b.publisher.toLowerCase().includes(q) || b.isbn?.toLowerCase().includes(q))
      .slice(0, 6);
    setEditSearchResults(matched);
  }, [editSearch, editingBill, editItems]);

  const saveEditBill = () => {
    if (!editingBill || editItems.length === 0) return;
    const result = editBill(
      editingBill.id,
      editItems.map((e) => ({ bookId: e.bookId, quantity: e.quantity })),
      editDiscount,
      editCustomerName || undefined,
      editCustomerPhone || undefined,
    );
    if (result) {
      setEditingBill(null);
      setViewingBill(result);
      reload();
    }
  };

  const requestMarkPaid = (bill: Bill) => {
    setPendingBillAction({ type: 'mark_paid', bill });
  };

  const handleDeleteBill = (bill: Bill) => {
    setPendingBillAction({ type: 'delete', bill });
  };

  const doDeleteBill = (bill: Bill) => {
    deleteBill(bill.id);
    setViewingBill(null);
    setPendingBillAction(null);
    reload();
  };

  const requestEditBill = (bill: Bill) => {
    setPendingBillAction({ type: 'edit', bill });
  };

  const confirmBillAction = () => {
    if (!pendingBillAction) return;
    if (pendingBillAction.type === 'delete') {
      doDeleteBill(pendingBillAction.bill);
    } else if (pendingBillAction.type === 'mark_paid') {
      markBillAsPaid(pendingBillAction.bill.id);
      if (viewingBill?.id === pendingBillAction.bill.id) {
        setViewingBill({ ...pendingBillAction.bill, status: 'paid', paidAt: new Date().toISOString() });
      }
      setPendingBillAction(null);
      reload();
    } else {
      startEditBill(pendingBillAction.bill);
      setPendingBillAction(null);
    }
  };

  // Generate UPI QR when viewing a bill detail
  useEffect(() => {
    if (!viewingBill || viewingBill.paymentMethod === 'cash') {
      setViewingQr('');
      return;
    }
    generateUpiQR(viewingBill.grandTotal, `Bill #${viewingBill.billNumber}`)
      .then(setViewingQr)
      .catch(() => setViewingQr(''));
  }, [viewingBill]);

  const shareOnWhatsApp = (bill: Bill) => {
    const lines = bill.items
      .map((item) => `  • ${item.localTitle || item.title} ×${item.quantity} — ₹${(item.price * item.quantity).toFixed(0)}`)
      .join('\n');
    const disc = bill.discount > 0 ? `\n  Discount: -₹${bill.discount.toFixed(0)}` : '';
    const pending = bill.status === 'unpaid' ? '\n⚠️ PAYMENT PENDING' : '';
    const customer = bill.customerName
      ? ` — ${bill.customerName}${bill.customerPhone ? ` (${bill.customerPhone})` : ''}`
      : '';
    const text = `📚 *Gramakam Book Festival 2026*\nBill #${bill.billNumber}${customer}\n\n${lines}${disc}\n\n  *Total: ₹${bill.grandTotal.toFixed(0)}*${pending}\n\nThank you! 🙏`;

    const validPhone = bill.customerPhone ? normaliseIndianMobile(bill.customerPhone) : null;
    const url = validPhone
      ? `https://wa.me/91${validPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // If viewing bill history — filtered by tab and optional search query
  const filteredBills = allBills
    .filter((b) => {
      if (historyFilter === 'unpaid') return b.status === 'unpaid';
      if (historyFilter === 'upi_pending') return b.paymentMethod === 'upi' && b.upiStatus === 'pending';
      return true;
    })
    .filter((b) => {
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase();
      return (
        String(b.billNumber).includes(q) ||
        b.customerName?.toLowerCase().includes(q) ||
        (b.customerPhone && b.customerPhone.includes(q)) ||
        b.items.some((i) => i.title.toLowerCase().includes(q) || i.localTitle?.toLowerCase().includes(q))
      );
    });

  if (showHistory) {
    return (
      <>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { setShowHistory(false); setViewingBill(null); }}
            className="flex items-center gap-2 text-gray-600 hover:text-maroon transition-colors font-medium"
          >
            <ChevronLeft size={20} /> Back to Billing
          </button>
          <h2 className="text-xl font-bold text-charcoal flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <History size={22} /> Bill History
          </h2>
          <span className="text-sm text-gray-400">
            {allBills.length} bills
            {allBills.filter(b => b.status === 'unpaid').length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                {allBills.filter(b => b.status === 'unpaid').length} unpaid
              </span>
            )}
          </span>
        </div>

        {/* History Search */}
        {!viewingBill && (
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by bill #, customer name, or book title…"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30 bg-white"
            />
            {historySearch && (
              <button onClick={() => setHistorySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        {!viewingBill && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setHistoryFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                historyFilter === 'all' ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              All Bills
            </button>
            <button
              onClick={() => setHistoryFilter('unpaid')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                historyFilter === 'unpaid' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <CreditCard size={14} />
              Unpaid
              {allBills.filter(b => b.status === 'unpaid').length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  historyFilter === 'unpaid' ? 'bg-white/30 text-white' : 'bg-amber-200 text-amber-800'
                }`}>
                  {allBills.filter(b => b.status === 'unpaid').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setHistoryFilter('upi_pending')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                historyFilter === 'upi_pending' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
            >
              <Clock size={14} />
              UPI Pending
              {allBills.filter(b => b.paymentMethod === 'upi' && b.upiStatus === 'pending').length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  historyFilter === 'upi_pending' ? 'bg-white/30 text-white' : 'bg-orange-200 text-orange-800'
                }`}>
                  {allBills.filter(b => b.paymentMethod === 'upi' && b.upiStatus === 'pending').length}
                </span>
              )}
            </button>
            {historyFilter === 'unpaid' && allBills.filter(b => b.status === 'unpaid').length > 0 && (
              <div className="ml-auto flex items-center text-sm text-amber-700 font-semibold">
                Pending: ₹{allBills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.grandTotal, 0).toFixed(2)}
              </div>
            )}
            {historyFilter === 'upi_pending' && allBills.filter(b => b.paymentMethod === 'upi' && b.upiStatus === 'pending').length > 0 && (
              <div className="ml-auto flex items-center text-sm text-orange-700 font-semibold">
                Pending: ₹{allBills.filter(b => b.paymentMethod === 'upi' && b.upiStatus === 'pending').reduce((s, b) => s + b.grandTotal, 0).toFixed(2)}
              </div>
            )}
          </div>
        )}

        {viewingBill ? (
          /* Viewing a specific bill */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-lg mx-auto w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setViewingBill(null)}
                className="text-sm text-gray-500 hover:text-maroon flex items-center gap-1"
              >
                <ChevronLeft size={16} /> All Bills
              </button>
              <div className="flex items-center gap-2">
                {viewingBill.status === 'unpaid' && (
                  <button
                    onClick={() => requestMarkPaid(viewingBill)}
                    className="flex items-center gap-1.5 bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                  >
                    <BadgeCheck size={16} /> Mark Paid
                  </button>
                )}
                <button
                  onClick={() => requestEditBill(viewingBill)}
                  className="flex items-center gap-1.5 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                >
                  <Edit3 size={16} /> Edit
                </button>
                <button
                  onClick={() => handlePrint(viewingBill)}
                  className="flex items-center gap-1.5 text-maroon hover:bg-maroon/5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                >
                  <Printer size={16} /> Reprint
                </button>
                <button
                  onClick={() => shareOnWhatsApp(viewingBill)}
                  className="flex items-center gap-1.5 text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                  title="Share on WhatsApp"
                >
                  <MessageCircle size={16} /> WA
                </button>
                <button
                  onClick={() => handleDeleteBill(viewingBill)}
                  className="flex items-center gap-1.5 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>Bill #{viewingBill.billNumber}</h3>
              <p className="text-gray-500 text-sm">{new Date(viewingBill.createdAt).toLocaleString('en-IN')}</p>
              {viewingBill.editedAt && (
                <p className="text-blue-500 text-xs mt-0.5">Edited: {new Date(viewingBill.editedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
              )}
              {viewingBill.status === 'unpaid' && (
                <span className="inline-block mt-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">UNPAID — Payment Pending</span>
              )}
              {viewingBill.status === 'paid' && viewingBill.paidAt && (
                <span className="inline-block mt-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">PAID on {new Date(viewingBill.paidAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
              )}
              {viewingBill.paymentMethod && (
                <span className={`inline-block mt-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                  viewingBill.paymentMethod === 'cash' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {viewingBill.paymentMethod === 'cash' ? '💵 Cash' : '📱 UPI'}
                </span>
              )}
              {viewingBill.paymentMethod === 'upi' && viewingBill.upiStatus === 'pending' && (
                <span className="inline-block mt-1.5 ml-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">⏳ UPI PENDING</span>
              )}
              {viewingBill.paymentMethod === 'upi' && viewingBill.upiStatus === 'completed' && (
                <span className="inline-block mt-1.5 ml-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">✓ UPI Done</span>
              )}
              {viewingBill.paymentMethod === 'upi' && viewingBill.upiTxnId && (
                <p className="text-xs text-gray-500 mt-1 font-mono">TXN: •••{viewingBill.upiTxnId}</p>
              )}
              {viewingBill.paymentMethod === 'upi' && viewingBill.upiStatus === 'pending' && (
                <button
                  onClick={() => { setUpiResolveTxnId(viewingBill.upiTxnId || ''); setUpiResolveModal(viewingBill); }}
                  className="inline-flex items-center gap-1.5 mt-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-full transition-colors"
                >
                  <CheckCircle size={13} /> Resolve UPI Payment
                </button>
              )}
              {viewingBill.paymentMethod === 'upi' && viewingBill.upiStatus !== 'pending' && (
                <button
                  onClick={() => {
                    const updated = updateBillUpi(viewingBill.id, viewingBill.upiTxnId, 'pending');
                    if (updated) setViewingBill(updated);
                    reload();
                  }}
                  className="inline-flex items-center gap-1.5 mt-2 px-4 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-semibold rounded-full transition-colors"
                >
                  <Clock size={13} /> Mark UPI Pending
                </button>
              )}
              {viewingQr && viewingBill.paymentMethod !== 'cash' && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-1">
                    {viewingBill.status === 'unpaid' ? 'Scan to Pay' : 'Paid via UPI'}
                  </p>
                  <img src={viewingQr} alt="UPI QR" className="w-32 h-32 mx-auto" />
                  <p className="text-xs text-gray-400 mt-1">9400186188@cnrb &middot; ₹{viewingBill.grandTotal.toFixed(2)}</p>
                </div>
              )}
              {(viewingBill.customerName || viewingBill.customerPhone) && (
                <p className="text-gray-500 text-sm mt-1">
                  {viewingBill.customerName && <span className="font-medium">{viewingBill.customerName}</span>}
                  {viewingBill.customerName && viewingBill.customerPhone && <span> · </span>}
                  {viewingBill.customerPhone && <span>{viewingBill.customerPhone}</span>}
                </p>
              )}
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Item</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Qty</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingBill.items.map((item, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-4 py-3">
                        {item.localTitle ? (
                          <>
                            <p className="font-semibold text-charcoal" style={{ fontFamily: 'system-ui, sans-serif' }}>{item.localTitle}</p>
                            <p className="text-gray-500 text-xs">{item.title}</p>
                          </>
                        ) : (
                          <p className="font-medium text-charcoal">{item.title}</p>
                        )}
                        <p className="text-xs text-gray-400">{item.publisher} · ₹{item.price}</p>
                      </td>
                      <td className="text-center px-4 py-3 font-medium">{item.quantity}</td>
                      <td className="text-right px-4 py-3 font-medium">₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{viewingBill.total.toFixed(2)}</span>
              </div>
              {viewingBill.discount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span>
                  <span className="text-red-500">-₹{viewingBill.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-charcoal border-t border-gray-100 pt-2">
                <span>Grand Total</span>
                <span className="text-maroon">₹{viewingBill.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Bill list */
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {allBills.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <History size={56} className="mx-auto mb-4 text-gray-200" />
                <p className="text-xl font-medium">No bills yet</p>
                <p className="text-sm mt-1">Bills will appear here after sales</p>
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                {historyFilter === 'upi_pending' ? (
                  <>
                    <CheckCircle size={56} className="mx-auto mb-4 text-green-200" />
                    <p className="text-xl font-medium">No pending UPI payments</p>
                    <p className="text-sm mt-1">All UPI transactions are resolved</p>
                  </>
                ) : (
                  <>
                    <BadgeCheck size={56} className="mx-auto mb-4 text-green-200" />
                    <p className="text-xl font-medium">No unpaid bills</p>
                    <p className="text-sm mt-1">All bills have been settled</p>
                  </>
                )}
              </div>
            ) : (
              filteredBills.map((bill, idx) => (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`flex items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm hover:border-maroon/20 transition-colors cursor-pointer ${
                    bill.status === 'unpaid' ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'
                  }`}
                  onClick={() => setViewingBill(bill)}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    bill.status === 'unpaid' ? 'bg-amber-100' : 'bg-maroon/10'
                  }`}>
                    <span className={`font-bold text-sm ${bill.status === 'unpaid' ? 'text-amber-700' : 'text-maroon'}`}>#{bill.billNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal text-sm">
                      {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
                      <span className="text-gray-400 font-normal"> · {bill.items.map(i => i.title).slice(0, 2).join(', ')}{bill.items.length > 2 ? '...' : ''}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(bill.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                    {bill.customerName && (
                      <p className="text-xs text-gray-500 mt-0.5">{bill.customerName}{bill.customerPhone ? ` · ${bill.customerPhone}` : ''}</p>
                    )}
                    {bill.status === 'unpaid' && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">Unpaid</span>
                    )}
                    {bill.editedAt && (
                      <span className="inline-block mt-1 ml-1 px-2 py-0.5 bg-blue-50 text-blue-500 text-[10px] font-bold rounded-full">Edited</span>
                    )}
                    {bill.paymentMethod && (
                      <span className={`inline-block mt-1 ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        bill.paymentMethod === 'cash' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-600'
                      }`}>{bill.paymentMethod === 'cash' ? 'Cash' : 'UPI'}</span>
                    )}
                    {bill.paymentMethod === 'upi' && bill.upiStatus === 'pending' && (
                      <span className="inline-block mt-1 ml-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">⏳ Pending</span>
                    )}
                    {bill.paymentMethod === 'upi' && bill.upiTxnId && (
                      <span className="inline-block mt-1 ml-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-mono rounded-full">•••{bill.upiTxnId}</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-charcoal text-lg">₹{bill.grandTotal.toFixed(2)}</p>
                    {bill.discount > 0 && <p className="text-xs text-red-400">-₹{bill.discount.toFixed(2)} disc</p>}
                  </div>
                  <div className="shrink-0 flex gap-1">
                    {bill.paymentMethod === 'upi' && bill.upiStatus === 'pending' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setUpiResolveTxnId(bill.upiTxnId || ''); setUpiResolveModal(bill); }}
                        className="p-2 text-orange-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Resolve UPI"
                      >
                        <Clock size={16} />
                      </button>
                    )}
                    {bill.paymentMethod === 'upi' && bill.upiStatus !== 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateBillUpi(bill.id, bill.upiTxnId, 'pending');
                          reload();
                        }}
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Mark UPI Pending"
                      >
                        <Clock size={16} />
                      </button>
                    )}
                    {bill.status === 'unpaid' && (
                      <button
                      onClick={(e) => { e.stopPropagation(); requestMarkPaid(bill); }}
                        className="p-2 text-amber-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Mark as Paid"
                      >
                        <BadgeCheck size={18} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); requestEditBill(bill); }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Bill"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setViewingBill(bill); }}
                      className="p-2 text-gray-400 hover:text-maroon transition-colors" title="View Bill"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePrint(bill); }}
                      className="p-2 text-gray-400 hover:text-maroon transition-colors" title="Print Bill"
                    >
                      <Printer size={16} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit modal — must render in history view too */}
      <AnimatePresence>
        {editingBill && (
          <EditBillModal
            editingBill={editingBill}
            editItems={editItems}
            editDiscount={editDiscount}
            editCustomerName={editCustomerName}
            editCustomerPhone={editCustomerPhone}
            editSearch={editSearch}
            editSearchResults={editSearchResults}
            setEditingBill={setEditingBill}
            setEditSearch={setEditSearch}
            setEditDiscount={setEditDiscount}
            setEditCustomerName={setEditCustomerName}
            setEditCustomerPhone={setEditCustomerPhone}
            updateEditQty={updateEditQty}
            removeEditItem={removeEditItem}
            addEditItem={addEditItem}
            saveEditBill={saveEditBill}
          />
        )}
      </AnimatePresence>

      {/* Bill action passcode modal */}
      <AnimatePresence>
        {pendingBillAction && (
          <BillActionPasscode
            type={pendingBillAction.type}
            billNumber={pendingBillAction.bill.billNumber}
            onConfirm={confirmBillAction}
            onClose={() => setPendingBillAction(null)}
          />
        )}
      </AnimatePresence>

      {/* Print Status Toast */}
      <AnimatePresence>
        {printStatus && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium ${
              printStatus.type === 'success'
                ? 'bg-green-600 text-white'
                : printStatus.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            {printStatus.type === 'success' ? <CheckCircle size={18} /> :
             printStatus.type === 'info' ? <Loader2 size={18} className="animate-spin" /> :
             <X size={18} />}
            {printStatus.text}
          </motion.div>
        )}
      </AnimatePresence>
      </>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 md:gap-6">
      {/* LEFT — Search & Add */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar — BLE / Barcode / History above search so search is full-width on mobile */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>Billing</h2>
          <div className="flex items-center gap-1">
            {btAvailable && (
              <button
                onClick={handleConnectPrinter}
                disabled={btConnecting}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  btConnected
                    ? 'bg-green-50 text-green-600 hover:bg-red-50 hover:text-red-500'
                    : btConnecting
                    ? 'bg-blue-50 text-blue-400'
                    : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                }`}
                title={btConnected ? `Connected: ${btName} (tap to disconnect)` : btConnecting ? 'Connecting...' : 'Connect Bluetooth Printer'}
              >
                {btConnecting ? <Loader2 size={16} className="animate-spin" /> : btConnected ? <BluetoothConnected size={16} /> : <Bluetooth size={16} />}
                <span className="hidden sm:inline">{btConnected ? (btName || 'Printer') : btConnecting ? 'Connecting…' : 'Printer'}</span>
              </button>
            )}
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600 transition-colors"
              title="Scan ISBN Barcode"
            >
              <ScanBarcode size={16} />
              <span className="hidden sm:inline">Scan</span>
            </button>
            <button
              onClick={() => { setShowHistory(true); reload(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-500 hover:bg-maroon/10 hover:text-maroon transition-colors"
              title="Bill History"
            >
              <History size={16} />
              <span className="hidden sm:inline">History</span>
            </button>
          </div>
        </div>

        {/* Search Bar — full width now that action buttons are above */}
        <div className="relative mb-4">
          <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search book title, publisher, or ISBN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-maroon focus:border-maroon outline-none bg-white shadow-sm"
            autoFocus
          />

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden max-h-[400px] overflow-y-auto"
              >
                {results.map((book) => {
                  const avail = book.quantity - book.sold;
                  return (
                    <button
                      key={book.id}
                      onClick={() => addToCart(book)}
                      className="w-full flex items-center justify-between px-5 py-5 hover:bg-maroon/5 active:bg-maroon/10 transition-colors text-left border-b border-gray-50 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        {book.localTitle ? (
                          <>
                            <p className="font-bold text-charcoal text-base truncate" style={{ fontFamily: 'system-ui, sans-serif' }}>{book.localTitle}</p>
                            <p className="text-gray-500 text-xs truncate">{book.title}</p>
                          </>
                        ) : (
                          <p className="font-semibold text-charcoal text-base truncate">{book.title}</p>
                        )}
                        <p className="text-gray-500 text-sm">{book.publisher}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-bold text-maroon text-lg">₹{book.price}</p>
                        <p className="text-xs text-gray-400">{avail} left</p>
                      </div>
                      <div className="ml-3 shrink-0">
                        <div className="w-12 h-12 rounded-full bg-maroon/10 flex items-center justify-center">
                          <Plus size={22} className="text-maroon" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scan Message */}
        <AnimatePresence>
          {scanMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-3 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                scanMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {scanMessage.type === 'success' ? <CheckCircle size={16} /> : <X size={16} />}
              {scanMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShoppingCart size={56} className="mx-auto mb-4 text-gray-200" />
              <p className="text-xl font-medium">Cart is empty</p>
              <p className="text-sm mt-1">Search and add books to start a bill</p>
            </div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={item.bookId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  {item.localTitle ? (
                    <>
                      <p className="font-bold text-charcoal truncate text-base" style={{ fontFamily: 'system-ui, sans-serif' }}>{item.localTitle}</p>
                      <p className="text-gray-500 text-xs truncate">{item.title}</p>
                    </>
                  ) : (
                    <p className="font-semibold text-charcoal truncate text-base">{item.title}</p>
                  )}
                  <p className="text-gray-500 text-sm">{item.publisher} · ₹{item.price.toFixed(2)}</p>
                </div>

                {/* Quantity Controls — BIG touch-friendly buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => updateCartQty(item.bookId, -1)}
                    className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors">
                    <Minus size={20} />
                  </button>
                  <span className="w-10 text-center font-bold text-lg text-charcoal">{item.quantity}</span>
                  <button onClick={() => updateCartQty(item.bookId, 1)}
                    className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors">
                    <Plus size={20} />
                  </button>
                </div>

                <p className="font-bold text-charcoal text-lg shrink-0 w-24 text-right">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>

                <button onClick={() => removeFromCart(item.bookId)}
                  className="p-2.5 text-gray-300 hover:text-red-500 active:text-red-600 transition-colors shrink-0">
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT — Bill Summary */}
      <div className="md:w-72 lg:w-80 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 md:sticky md:top-4">
          <h3 className="font-bold text-charcoal text-lg mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <ShoppingCart size={20} /> Bill Summary
          </h3>

          <div className="space-y-3 mb-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items</span>
              <span className="font-medium">{itemCount}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600 flex items-center gap-1"><Percent size={14} /> Discount</span>
              <input
                type="number"
                min="0"
                step="1"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 text-right px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-maroon outline-none"
                placeholder="₹0"
              />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-maroon outline-none"
                placeholder="Customer Name (optional)"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-1 outline-none transition-colors pr-8 ${
                    customerPhone && !normaliseIndianMobile(customerPhone)
                      ? 'border-red-300 focus:ring-red-300 bg-red-50'
                      : customerPhone && normaliseIndianMobile(customerPhone)
                      ? 'border-green-400 focus:ring-green-300 bg-green-50'
                      : 'border-gray-200 focus:ring-maroon'
                  }`}
                  placeholder="Phone Number (optional)"
                />
                {customerPhone && normaliseIndianMobile(customerPhone) && (
                  <CheckCircle size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
                )}
                {customerPhone && !normaliseIndianMobile(customerPhone) && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-400 text-xs font-bold pointer-events-none">!</span>
                )}
              </div>
            </div>
            {customerPhone && !normaliseIndianMobile(customerPhone) && (
              <p className="text-[11px] text-red-500 font-medium mt-1 ml-0.5">
                Enter a valid 10-digit Indian mobile number (starts with 6–9)
              </p>
            )}
            {customerPhone && normaliseIndianMobile(customerPhone) && (
              <p className="text-[11px] text-green-600 font-medium mt-1 ml-0.5 flex items-center gap-1">
                <CheckCircle size={10} /> WhatsApp will send directly to this number
              </p>
            )}
          </div>

          {/* Payment Method — required for paid bills */}
          <div id="payment-method-section" className="mb-5">
            <div className="flex items-center gap-1.5 mb-2">
              <p className={`text-xs font-semibold ${paymentMethodError ? 'text-red-600' : 'text-gray-500'}`}>
                Payment Method
              </p>
              <span className="text-red-500 text-xs font-bold">*</span>
              <span className="text-[10px] text-gray-400 font-normal">(not needed for Pay Later)</span>
            </div>
            {paymentMethodError && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-1.5 rounded-lg mb-2 flex items-center gap-1.5">
                <span>⚠</span> Select Cash or UPI before completing the sale.
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setPaymentMethod(paymentMethod === 'cash' ? undefined : 'cash'); setPaymentMethodError(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  paymentMethod === 'cash'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : paymentMethodError
                    ? 'bg-red-50 border-red-300 text-red-400 hover:border-red-400'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Banknote size={15} /> Cash
              </button>
              <button
                type="button"
                onClick={() => { setPaymentMethod(paymentMethod === 'upi' ? undefined : 'upi'); setPaymentMethodError(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  paymentMethod === 'upi'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : paymentMethodError
                    ? 'bg-red-50 border-red-300 text-red-400 hover:border-red-400'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Smartphone size={15} /> UPI
              </button>
            </div>

            {/* UPI Txn ID — shown only when UPI is selected */}
            {paymentMethod === 'upi' && (
              <div className="mt-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-xs font-semibold text-gray-500">UPI Transaction ID (last 5 digits)</p>
                  <span className="text-[10px] text-gray-400">optional</span>
                </div>
                <input
                  type="text"
                  maxLength={5}
                  value={upiTxnId}
                  onChange={(e) => setUpiTxnId(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="e.g. 84392"
                  className="w-full px-4 py-2.5 border-2 border-blue-200 bg-blue-50/50 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 placeholder-blue-300"
                />
              </div>
            )}

            {/* Cash Change Calculator — shown only when Cash is selected */}
            {paymentMethod === 'cash' && cart.length > 0 && (
              <div className="mt-3 bg-green-50/60 border-2 border-green-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-green-700 mb-2">Cash Calculator</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 font-medium">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="Amount received"
                    className="flex-1 px-3 py-2 border-2 border-green-200 bg-white rounded-lg text-sm font-mono focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100/50 placeholder-green-300"
                  />
                </div>
                {cashReceived && (() => {
                  const received = parseFloat(cashReceived);
                  const change = received - grandTotal;
                  if (isNaN(received)) return null;
                  if (change >= 0) {
                    return (
                      <div className="mt-2 flex justify-between items-baseline">
                        <span className="text-xs text-green-600 font-medium">Change to return</span>
                        <span className="text-lg font-bold text-green-700">₹{change.toFixed(2)}</span>
                      </div>
                    );
                  }
                  return (
                    <div className="mt-2 flex justify-between items-baseline">
                      <span className="text-xs text-red-500 font-medium">Short by</span>
                      <span className="text-lg font-bold text-red-600">₹{Math.abs(change).toFixed(2)}</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 mb-6">
            <div className="flex justify-between items-baseline">
              <span className="text-lg font-bold text-charcoal">Total</span>
              <span className="text-3xl font-bold text-maroon" style={{ fontFamily: 'var(--font-heading)' }}>
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleCheckout('paid')}
            disabled={cart.length === 0}
            className="w-full bg-maroon hover:bg-maroon-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 md:py-5 rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-maroon/20 active:scale-[0.98]"
          >
            <CheckCircle size={20} /> Complete Sale
          </button>

          {/* UPI Pending button — only visible when UPI is selected */}
          {paymentMethod === 'upi' && (
            <button
              onClick={() => handleCheckout('paid', true)}
              disabled={cart.length === 0}
              className="w-full mt-2 bg-orange-50 border-2 border-orange-300 hover:bg-orange-100 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-orange-700 py-3 rounded-2xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Clock size={16} /> UPI Pending (will track later)
            </button>
          )}

          <button
            onClick={() => handleCheckout('unpaid')}
            disabled={cart.length === 0}
            className="w-full mt-2 bg-amber-50 border-2 border-amber-300 hover:bg-amber-100 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-amber-700 py-3 rounded-2xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <CreditCard size={18} /> Pay Later (Credit)
          </button>
        </div>
      </div>

      {/* Bill Edit Modal */}
      <AnimatePresence>
        {editingBill && (
          <EditBillModal
            editingBill={editingBill}
            editItems={editItems}
            editDiscount={editDiscount}
            editCustomerName={editCustomerName}
            editCustomerPhone={editCustomerPhone}
            editSearch={editSearch}
            editSearchResults={editSearchResults}
            setEditingBill={setEditingBill}
            setEditSearch={setEditSearch}
            setEditDiscount={setEditDiscount}
            setEditCustomerName={setEditCustomerName}
            setEditCustomerPhone={setEditCustomerPhone}
            updateEditQty={updateEditQty}
            removeEditItem={removeEditItem}
            addEditItem={addEditItem}
            saveEditBill={saveEditBill}
          />
        )}
      </AnimatePresence>

      {/* Bill Receipt Modal */}
      <AnimatePresence>
        {showBill && lastBill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowBill(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    lastBill.status === 'unpaid' ? 'bg-amber-100' : 'bg-green-100'
                  }`}>
                    {lastBill.status === 'unpaid'
                      ? <CreditCard size={28} className="text-amber-600" />
                      : <CheckCircle size={28} className="text-green-600" />
                    }
                  </div>
                  <h3 className="text-xl font-bold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>
                    {lastBill.status === 'unpaid' ? 'Credit Bill Created' : 'Sale Complete!'}
                  </h3>
                  <p className="text-gray-500 text-sm">Bill #{lastBill.billNumber}</p>
                  {lastBill.status === 'unpaid' && (
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">UNPAID — Pay Later</span>
                  )}
                  {(lastBill.customerName || lastBill.customerPhone) && (
                    <p className="text-gray-500 text-sm mt-1">
                      {lastBill.customerName && <span className="font-medium">{lastBill.customerName}</span>}
                      {lastBill.customerName && lastBill.customerPhone && <span> · </span>}
                      {lastBill.customerPhone && <span>{lastBill.customerPhone}</span>}
                    </p>
                  )}
                </div>

                <div className="border border-gray-100 rounded-xl p-4 mb-4 text-sm space-y-1">
                  {lastBill.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-700">{item.localTitle || item.title} × {item.quantity}</span>
                      <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    {lastBill.discount > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>Discount</span>
                        <span>-₹{lastBill.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-charcoal text-base mt-1">
                      <span>Total</span>
                      <span>₹{lastBill.grandTotal.toFixed(2)}</span>
                    </div>
                    {lastBill.paymentMethod && (
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                        <span className="text-gray-400 text-xs">Payment</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            lastBill.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {lastBill.paymentMethod === 'cash' ? 'Cash' : 'UPI'}
                          </span>
                          {lastBill.paymentMethod === 'upi' && lastBill.upiStatus === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700">⏳ Pending</span>
                          )}
                          {lastBill.paymentMethod === 'upi' && lastBill.upiTxnId && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-gray-100 text-gray-500">•••{lastBill.upiTxnId}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* UPI QR Code */}
              {billQr && lastBill.paymentMethod !== 'cash' && (
                <div className="text-center py-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    {lastBill.status === 'unpaid' ? 'Scan to Pay' : 'Pay / Verify via UPI'}
                  </p>
                  <img src={billQr} alt="UPI QR" className="w-36 h-36 mx-auto" />
                  <p className="text-xs text-gray-400 mt-1">9400186188@cnrb</p>
                  <p className="text-sm font-bold text-charcoal">₹{lastBill.grandTotal.toFixed(2)}</p>
                </div>
              )}

              <div className="flex border-t border-gray-100">
                <button onClick={() => lastBill && handlePrint(lastBill)} className="flex-1 py-4 text-center font-medium text-maroon hover:bg-maroon/5 transition-colors flex items-center justify-center gap-2">
                  <Printer size={18} /> {btConnected ? 'Print via BT' : 'Print Bill'}
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => lastBill && shareOnWhatsApp(lastBill)}
                  className="flex-1 py-4 text-center font-medium text-green-600 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} /> WhatsApp
                </button>
                <div className="w-px bg-gray-100" />
                <button onClick={() => setShowBill(false)} className="flex-1 py-4 text-center font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barcode Scanner Modal */}
      <AnimatePresence>
        {showBarcodeScanner && (
          <BarcodeScanner
            title="Scan to Add to Cart"
            onScan={handleBarcodeScan}
            onClose={() => setShowBarcodeScanner(false)}
          />
        )}
      </AnimatePresence>

      {/* Print Status Toast */}
      <AnimatePresence>
        {printStatus && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium ${
              printStatus.type === 'success'
                ? 'bg-green-600 text-white'
                : printStatus.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            {printStatus.type === 'success' ? <CheckCircle size={18} /> :
             printStatus.type === 'info' ? <Loader2 size={18} className="animate-spin" /> :
             <X size={18} />}
            {printStatus.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPI Resolve Modal */}
      <AnimatePresence>
        {upiResolveModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setUpiResolveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={26} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-charcoal mb-1">Resolve UPI Payment</h3>
                <p className="text-sm text-gray-500 mb-4">Bill #{upiResolveModal.billNumber} · ₹{upiResolveModal.grandTotal.toFixed(2)}</p>

                <div className="mb-4 text-left">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs font-semibold text-gray-500">UPI Transaction ID (last 5 digits)</p>
                    <span className="text-[10px] text-gray-400">optional</span>
                  </div>
                  <input
                    type="text"
                    maxLength={5}
                    value={upiResolveTxnId}
                    onChange={(e) => setUpiResolveTxnId(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="e.g. 84392"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100/50 placeholder-gray-300"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setUpiResolveModal(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!upiResolveModal) return;
                      const updated = updateBillUpi(upiResolveModal.id, upiResolveTxnId || undefined, 'completed');
                      if (updated && viewingBill?.id === updated.id) setViewingBill(updated);
                      setUpiResolveModal(null);
                      setUpiResolveTxnId('');
                      reload();
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={15} /> Mark Completed
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
