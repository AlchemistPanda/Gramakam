'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Copy, Check } from 'lucide-react';
import type { MerchCartItem } from '@/types';
import { createMerchOrder } from '@/lib/services';
import OrderStatus from './OrderStatus';

const MERCH_UPI_VPA = 'dummy@upi'; // Replace with real UPI ID later
const MERCH_UPI_NAME = 'Gramakam Merchandise';

function generateOrderId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `GRM-${code}`;
}

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  cart: MerchCartItem[];
  onOrderPlaced: () => void;
}

type Step = 'details' | 'payment' | 'status';

export default function CheckoutModal({ open, onClose, cart, onOrderPlaced }: CheckoutModalProps) {
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');
  const [firestoreId, setFirestoreId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Generate QR when entering payment step
  useEffect(() => {
    if (step === 'payment' && !qrDataUrl) {
      import('qrcode').then((QRCode) => {
        const upiUri = `upi://pay?pa=${MERCH_UPI_VPA}&pn=${encodeURIComponent(MERCH_UPI_NAME)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Gramakam Merch ${orderId}`)}`;
        QRCode.toDataURL(upiUri, { width: 220, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
          .then(setQrDataUrl);
      });
    }
  }, [step, qrDataUrl, total, orderId]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('details');
      setUpiRef('');
      setQrDataUrl(null);
      setOrderId(generateOrderId());
      setFirestoreId('');
      setIsSubmitting(false);
      setCopied(false);
    }
  }, [open]);

  const handleDetailsSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePaymentSubmit = async () => {
    if (!upiRef.trim() || upiRef.trim().length < 6) return;
    setIsSubmitting(true);
    try {
      const id = await createMerchOrder({
        orderId,
        items: cart,
        total,
        customerName: name,
        customerEmail: email,
        customerMobile: mobile,
        upiRef: upiRef.trim(),
        status: 'pending',
      });
      setFirestoreId(id);
      setStep('status');
      onOrderPlaced();
    } catch (err) {
      console.error('Order creation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyUpi = () => {
    navigator.clipboard.writeText(MERCH_UPI_VPA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => step !== 'status' && onClose()}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {step === 'payment' && (
                  <button onClick={() => { setStep('details'); setQrDataUrl(null); }} className="text-gray-400 hover:text-charcoal">
                    <ArrowLeft size={18} />
                  </button>
                )}
                <h3 className="font-semibold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>
                  {step === 'details' && 'Checkout'}
                  {step === 'payment' && 'Pay via UPI'}
                  {step === 'status' && 'Order Placed'}
                </h3>
              </div>
              {step !== 'status' && (
                <button onClick={onClose} className="text-gray-400 hover:text-charcoal">
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 px-6 pt-4 pb-2">
              {['details', 'payment', 'status'].map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s ? 'bg-maroon text-white' :
                    ['details', 'payment', 'status'].indexOf(step) > i ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {['details', 'payment', 'status'].indexOf(step) > i ? '✓' : i + 1}
                  </div>
                  {i < 2 && <div className={`flex-1 h-0.5 ${['details', 'payment', 'status'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            <div className="p-6">
              {/* Step 1: Customer Details */}
              {step === 'details' && (
                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                  {/* Order summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-2">
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Order Summary</p>
                    {cart.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1">
                        <span className="text-charcoal">
                          {item.name} {item.size !== 'N/A' && `(${item.size})`} × {item.quantity}
                        </span>
                        <span className="font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-semibold text-maroon">
                      <span>Total</span>
                      <span>₹{total}</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-name" className="block text-sm font-medium text-charcoal mb-1">Name *</label>
                    <input
                      id="checkout-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-email" className="block text-sm font-medium text-charcoal mb-1">Email *</label>
                    <input
                      id="checkout-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-mobile" className="block text-sm font-medium text-charcoal mb-1">Mobile *</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600 font-medium">+91</span>
                      <input
                        id="checkout-mobile"
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        pattern="[6-9][0-9]{9}"
                        title="Enter a valid 10-digit Indian mobile number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                    Continue to Payment <ArrowRight size={16} />
                  </button>
                </form>
              )}

              {/* Step 2: UPI Payment */}
              {step === 'payment' && (
                <div className="space-y-5">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Amount to pay</p>
                    <p className="text-3xl font-bold text-maroon">₹{total}</p>
                    <p className="text-xs text-gray-400 mt-1">Order: {orderId}</p>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center">
                    {qrDataUrl ? (
                      <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrDataUrl} alt="UPI QR Code" className="w-[200px] h-[200px]" />
                      </div>
                    ) : (
                      <div className="w-[200px] h-[200px] bg-gray-100 rounded-xl animate-pulse" />
                    )}
                    <p className="text-xs text-gray-500 mt-2">Scan with any UPI app</p>
                  </div>

                  {/* UPI ID */}
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Or pay to UPI ID</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-sm font-mono font-semibold text-charcoal">{MERCH_UPI_VPA}</code>
                      <button onClick={copyUpi} className="text-maroon hover:text-maroon-dark">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* UPI Ref Input */}
                  <div>
                    <label htmlFor="upi-ref" className="block text-sm font-medium text-charcoal mb-1">
                      UPI Reference Number *
                    </label>
                    <input
                      id="upi-ref"
                      type="text"
                      value={upiRef}
                      onChange={(e) => setUpiRef(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 12-digit UPI reference number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none font-mono"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Find this in your UPI app → Transaction History → Payment Details
                    </p>
                  </div>

                  <button
                    onClick={handlePaymentSubmit}
                    disabled={isSubmitting || !upiRef.trim() || upiRef.trim().length < 6}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isSubmitting ? 'Placing Order...' : 'I have paid — Place Order'}
                  </button>
                </div>
              )}

              {/* Step 3: Order Status */}
              {step === 'status' && firestoreId && (
                <OrderStatus
                  orderId={orderId}
                  firestoreId={firestoreId}
                  upiRef={upiRef}
                  total={total}
                  onClose={onClose}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
