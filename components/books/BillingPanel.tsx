'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, X, CheckCircle, Percent } from 'lucide-react';
import type { Book, BillItem, Bill } from '@/types/books';
import { getBooks, createBill } from '@/lib/bookStore';

export default function BillingPanel() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [cart, setCart] = useState<(BillItem & { available: number })[]>([]);
  const [discount, setDiscount] = useState(0);
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const [showBill, setShowBill] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    setBooks(getBooks());
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const matched = books
      .filter((b) => (b.quantity - b.sold) > 0)
      .filter((b) => b.title.toLowerCase().includes(q) || b.publisher.toLowerCase().includes(q))
      .slice(0, 8);
    setResults(matched);
  }, [query, books]);

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
  const grandTotal = subtotal - discount;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const bill = createBill(
      cart.map((c) => ({ bookId: c.bookId, quantity: c.quantity })),
      discount
    );
    if (bill) {
      setLastBill(bill);
      setShowBill(true);
      setCart([]);
      setDiscount(0);
      reload();
    }
  };

  const printBill = () => {
    if (!lastBill) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html><head><title>Bill #${lastBill.billNumber}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; font-size: 13px; }
        h1 { text-align: center; font-size: 18px; margin-bottom: 4px; }
        .center { text-align: center; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 3px 0; text-align: left; }
        th:last-child, td:last-child { text-align: right; }
        .total-row { font-weight: bold; font-size: 15px; }
      </style></head><body>
        <h1>GRAMAKAM</h1>
        <p class="center">Book Festival 2026<br/>Velur, Thrissur, Kerala</p>
        <div class="line"></div>
        <p><strong>Bill #${lastBill.billNumber}</strong><br/>${new Date(lastBill.createdAt).toLocaleString('en-IN')}</p>
        <div class="line"></div>
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Amt</th></tr></thead>
          <tbody>
            ${lastBill.items.map((item) => `<tr><td>${item.title}<br/><small>${item.publisher}</small></td><td>${item.quantity}</td><td>₹${(item.price * item.quantity).toFixed(2)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="line"></div>
        <table>
          <tr><td>Subtotal</td><td style="text-align:right">₹${lastBill.total.toFixed(2)}</td></tr>
          ${lastBill.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-₹${lastBill.discount.toFixed(2)}</td></tr>` : ''}
          <tr class="total-row"><td>TOTAL</td><td style="text-align:right">₹${lastBill.grandTotal.toFixed(2)}</td></tr>
        </table>
        <div class="line"></div>
        <p class="center" style="margin-top:12px">Thank you for visiting!<br/>Gramakam Cultural Academy</p>
        <script>window.onload = () => { window.print(); }</script>
      </body></html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* LEFT — Search & Add */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search Bar — BIG */}
        <div className="relative mb-4">
          <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            placeholder="🔍 Search book title or publisher..."
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
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-maroon/5 transition-colors text-left border-b border-gray-50 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-charcoal text-base truncate">{book.title}</p>
                        <p className="text-gray-500 text-sm">{book.publisher}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-bold text-maroon text-lg">₹{book.price}</p>
                        <p className="text-xs text-gray-400">{avail} left</p>
                      </div>
                      <div className="ml-3 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-maroon/10 flex items-center justify-center">
                          <Plus size={20} className="text-maroon" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
                  <p className="font-semibold text-charcoal truncate text-base">{item.title}</p>
                  <p className="text-gray-500 text-sm">{item.publisher} · ₹{item.price.toFixed(2)}</p>
                </div>

                {/* Quantity Controls — BIG buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => updateCartQty(item.bookId, -1)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <Minus size={18} />
                  </button>
                  <span className="w-10 text-center font-bold text-lg text-charcoal">{item.quantity}</span>
                  <button onClick={() => updateCartQty(item.bookId, 1)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <Plus size={18} />
                  </button>
                </div>

                <p className="font-bold text-charcoal text-lg shrink-0 w-24 text-right">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>

                <button onClick={() => removeFromCart(item.bookId)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT — Bill Summary */}
      <div className="lg:w-80 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-4">
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
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-maroon hover:bg-maroon-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-maroon/20"
          >
            <CheckCircle size={20} /> Complete Sale
          </button>
        </div>
      </div>

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
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={28} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>Sale Complete!</h3>
                  <p className="text-gray-500 text-sm">Bill #{lastBill.billNumber}</p>
                </div>

                <div className="border border-gray-100 rounded-xl p-4 mb-4 text-sm space-y-1">
                  {lastBill.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-700">{item.title} × {item.quantity}</span>
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
                  </div>
                </div>
              </div>

              <div className="flex border-t border-gray-100">
                <button onClick={printBill} className="flex-1 py-4 text-center font-medium text-maroon hover:bg-maroon/5 transition-colors flex items-center justify-center gap-2">
                  <Printer size={18} /> Print Bill
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
    </div>
  );
}
