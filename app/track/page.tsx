'use client';

import { useState, FormEvent, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Package, Truck, CheckCircle, CreditCard,
  MapPin, Copy, ExternalLink, ChevronRight, ArrowLeft,
  ShoppingBag,
} from 'lucide-react';
import { trackOrders } from '@/lib/services';
import type { MerchOrder, MerchOrderStatus } from '@/types';

// ─── Pipeline definition ────────────────────────────────────────────────────

const STEPS: { key: MerchOrderStatus; label: string; sub: string; Icon: typeof Package }[] = [
  { key: 'verified', label: 'Order Confirmed', sub: 'Payment received',   Icon: CreditCard },
  { key: 'packed',   label: 'Order Packed',    sub: 'Ready to dispatch',  Icon: Package },
  { key: 'shipped',  label: 'Shipped',         sub: 'On the way to you',  Icon: Truck },
  { key: 'delivered',label: 'Delivered',       sub: 'Enjoy your merch!',  Icon: CheckCircle },
];

function getStepIndex(status: MerchOrderStatus): number {
  const map: Partial<Record<MerchOrderStatus, number>> = {
    verified: 0, manual_verified: 0,
    packed: 1,
    shipped: 2,
    delivered: 3,
  };
  return map[status] ?? -1;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d?: string | Date | null) {
  if (!d) return null;
  return new Date(d as string).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── Page ────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Partial<Record<MerchOrderStatus, { label: string; color: string }>> = {
  verified:        { label: 'Confirmed',  color: 'text-blue-400' },
  manual_verified: { label: 'Confirmed',  color: 'text-blue-400' },
  packed:          { label: 'Packed',     color: 'text-amber-400' },
  shipped:         { label: 'Shipped',    color: 'text-purple-400' },
  delivered:       { label: 'Delivered',  color: 'text-green-400' },
  rejected:        { label: 'Cancelled',  color: 'text-red-400' },
};

function TrackPageContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<MerchOrder[] | null>(null); // null = no search yet
  const [selectedOrder, setSelectedOrder] = useState<MerchOrder | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const applyResults = (results: MerchOrder[]) => {
    if (results.length === 0) {
      setOrders([]);
      setSelectedOrder(null);
    } else if (results.length === 1) {
      setOrders(results);
      setSelectedOrder(results[0]);
    } else {
      setOrders(results);
      setSelectedOrder(results[0]); // default to most recent
    }
  };

  // Auto-search if orderId is provided in URL
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      setQuery(orderId);
      setLoading(true);
      trackOrders(orderId)
        .then(applyResults)
        .catch(() => setError('Something went wrong. Please try again.'))
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setOrders(null);
    setSelectedOrder(null);
    try {
      const results = await trackOrders(query.trim());
      applyResults(results);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const handleCopy = (text: string, key: string) => {
    copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleReset = () => {
    setOrders(null);
    setSelectedOrder(null);
    setQuery('');
    setError('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const order = selectedOrder;
  const notFound = orders !== null && orders.length === 0;
  const multipleOrders = orders !== null && orders.length > 1;
  const stepIndex = order ? getStepIndex(order.status) : -1;
  const isActive = order && order.status !== 'rejected';

  return (
    <div className="min-h-screen bg-charcoal relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-maroon/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container-custom section-padding pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-maroon/80 uppercase tracking-[0.25em] text-xs mb-3 font-medium">Gramakam Merchandise</p>
          <h1 className="text-4xl md:text-5xl font-bold text-cream mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
            Track Your Order
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Enter your Order ID (GRM-xxxxxx), mobile number, or email used at checkout.
          </p>
        </motion.div>

        {/* Search form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-xl mx-auto mb-10"
        >
          <form onSubmit={handleSearch} className="relative group space-y-2">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl focus-within:border-maroon/60 focus-within:bg-white/8 transition-all duration-300 shadow-xl">
              <Search size={18} className="ml-5 text-gray-500 shrink-0 group-focus-within:text-maroon transition-colors" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="GRM-abc123  or  9876543210  or  email"
                className="flex-1 bg-transparent px-4 py-4 text-cream placeholder-gray-600 text-sm outline-none"
                autoComplete="off"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full px-6 py-2.5 bg-maroon text-white font-semibold text-sm rounded-xl hover:bg-maroon/80 active:scale-95 transition-all disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Searching
                </span>
              ) : 'Track'}
            </button>
          </form>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center mt-3">
              {error}
            </motion.p>
          )}
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {notFound && (
            <motion.div
              key="not_found"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag size={26} className="text-gray-500" />
                </div>
                <h3 className="text-cream font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Order Not Found</h3>
                <p className="text-gray-500 text-sm mb-6">
                  No order matched <span className="font-mono text-gray-400">&quot;{query}&quot;</span>.<br />
                  Check your Order ID or mobile number and try again.
                </p>
                <button onClick={handleReset} className="flex items-center gap-2 text-sm text-maroon/80 hover:text-maroon mx-auto transition-colors">
                  <ArrowLeft size={14} /> Try again
                </button>
              </div>
            </motion.div>
          )}

          {order && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="max-w-2xl mx-auto space-y-4"
            >
              {/* Multi-order selector */}
              {multipleOrders && orders && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-3">
                    {orders.length} orders found — select one
                  </p>
                  <div className="space-y-2">
                    {orders.map((o) => {
                      const st = STATUS_LABEL[o.status];
                      const isSelected = o.orderId === order.orderId;
                      return (
                        <button
                          key={o.orderId}
                          onClick={() => setSelectedOrder(o)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-maroon/20 border-maroon/40'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <ShoppingBag size={15} className={isSelected ? 'text-maroon' : 'text-gray-500'} />
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-sm text-cream font-bold">{o.orderId}</span>
                            <span className="text-gray-500 text-xs ml-2">{fmtDate(o.createdAt as string)}</span>
                          </div>
                          {st && <span className={`text-xs font-semibold shrink-0 ${st.color}`}>{st.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order header card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-maroon/20 flex items-center justify-center shrink-0">
                  <ShoppingBag size={22} className="text-maroon" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-cream font-bold tracking-wide">{order.orderId}</span>
                    {order.status === 'rejected' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-400">Cancelled</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Placed {fmtDate(order.createdAt as string)} · {order.customerName}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-500 hover:text-cream flex items-center gap-1 shrink-0 transition-colors"
                >
                  <ArrowLeft size={12} /> New search
                </button>
              </div>

              {/* Status pipeline */}
              {isActive && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-6">Order Status</p>

                  <div className="relative">
                    {/* Progress track */}
                    <div className="absolute top-5 left-5 right-5 h-0.5 bg-white/10 z-0" />
                    <motion.div
                      className="absolute top-5 left-5 h-0.5 bg-maroon z-0 origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: stepIndex / (STEPS.length - 1) }}
                      transition={{ duration: 0.8, delay: 0.2, ease: 'easeInOut' }}
                      style={{ right: '20px' }}
                    />

                    {/* Steps */}
                    <div className="relative z-10 flex justify-between">
                      {STEPS.map((step, i) => {
                        const done = i <= stepIndex;
                        const active = i === stepIndex;
                        const StepIcon = step.Icon;
                        return (
                          <div key={step.key} className="flex flex-col items-center gap-2 w-20">
                            <motion.div
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.4, delay: 0.1 + i * 0.12 }}
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                done
                                  ? 'bg-maroon border-maroon shadow-lg shadow-maroon/30'
                                  : 'bg-charcoal border-white/15'
                              } ${active ? 'ring-4 ring-maroon/20' : ''}`}
                            >
                              <StepIcon size={16} className={done ? 'text-white' : 'text-gray-600'} />
                            </motion.div>
                            <div className="text-center">
                              <p className={`text-[11px] font-semibold leading-tight ${done ? 'text-cream' : 'text-gray-600'}`}>
                                {step.label}
                              </p>
                              {active && (
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.5 }}
                                  className="text-[10px] text-maroon/80 mt-0.5"
                                >
                                  {step.sub}
                                </motion.p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current status summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 bg-maroon/10 border border-maroon/20 rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-maroon/20 flex items-center justify-center shrink-0">
                      {(() => { const S = STEPS[stepIndex]?.Icon ?? CreditCard; return <S size={15} className="text-maroon" />; })()}
                    </div>
                    <div>
                      <p className="text-cream text-sm font-semibold">{STEPS[stepIndex]?.label}</p>
                      <p className="text-gray-400 text-xs">{STEPS[stepIndex]?.sub}</p>
                    </div>
                    {(() => {
                      const ts = [order.verifiedAt, order.packedAt, order.shippedAt, order.deliveredAt][stepIndex];
                      return ts ? <p className="ml-auto text-xs text-gray-500 shrink-0">{fmtDate(ts)}</p> : null;
                    })()}
                  </motion.div>
                </div>
              )}

              {/* Rejected state */}
              {order.status === 'rejected' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                  <p className="text-red-400 font-semibold mb-1">Order Cancelled</p>
                  <p className="text-gray-500 text-sm">This order was not fulfilled. Contact us if you believe this is an error.</p>
                </div>
              )}

              {/* Tracking info */}
              {order.trackingId && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5"
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-3">Shipment Tracking</p>
                  <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                    <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Truck size={16} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {order.trackingCarrier && (
                        <p className="text-xs text-gray-400 mb-0.5">{order.trackingCarrier}</p>
                      )}
                      <p className="font-mono text-cream font-bold tracking-widest text-sm truncate">{order.trackingId}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(order.trackingId!, 'tracking')}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-cream transition-all"
                    >
                      {copied === 'tracking' ? (
                        <><CheckCircle size={12} className="text-green-400" /> Copied</>
                      ) : (
                        <><Copy size={12} /> Copy</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Order details */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">Order Details</p>

                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <ShoppingBag size={13} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="text-cream text-sm">{item.name}</p>
                          {item.size !== 'N/A' && <p className="text-xs text-gray-500">Size: {item.size}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-cream text-sm font-semibold">₹{item.price * item.quantity}</p>
                        <p className="text-xs text-gray-500">×{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-2 flex justify-between">
                    <span className="text-gray-400 text-sm">Total</span>
                    <span className="text-cream font-bold">₹{order.total}</span>
                  </div>
                </div>

                {/* Delivery address */}
                {order.deliveryAddress && (
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={13} className="text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Delivering to</p>
                        <p className="text-cream text-sm font-medium">{order.customerName}</p>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          {order.deliveryAddress.line1}
                          {order.deliveryAddress.line2 && `, ${order.deliveryAddress.line2}`}
                          <br />
                          {order.deliveryAddress.city}, {order.deliveryAddress.state} — {order.deliveryAddress.pincode}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Help note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center text-xs text-gray-600"
              >
                Need help? Contact us at{' '}
                <a href="mailto:ifcreations@gramakam.org" className="text-maroon/70 hover:text-maroon transition-colors">
                  ifcreations@gramakam.org
                </a>
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Wrap with Suspense boundary for useSearchParams
export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-charcoal" />}>
      <TrackPageContent />
    </Suspense>
  );
}
