'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';
import type { MerchCartItem, DeliveryAddress } from '@/types';
import { createMerchOrder, updateMerchOrderByOrderId, decrementStock } from '@/lib/services';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  cart: MerchCartItem[];
  onOrderPlaced: () => void;
}

type Step = 'details' | 'paying' | 'success' | 'failed';

export default function CheckoutModal({ open, onClose, cart, onOrderPlaced }: CheckoutModalProps) {
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('Kerala');
  const [addrPincode, setAddrPincode] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  // Snapshot confirmed order details so they survive cart clearing
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Load Razorpay script (with onload tracking so we know when it's ready)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Already loaded earlier in the session
    if (window.Razorpay) {
      setScriptLoaded(true);
      return;
    }
    const existing = document.getElementById('razorpay-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => setScriptLoaded(true));
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptLoaded(false);
    document.head.appendChild(script);
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('details');
      setOrderId('');
      setIsSubmitting(false);
      setErrorMsg('');
      setPaymentId('');
      setAddrLine1('');
      setAddrLine2('');
      setAddrCity('');
      setAddrState('Kerala');
      setAddrPincode('');
    }
  }, [open]);

  const deliveryAddress: DeliveryAddress = {
    line1: addrLine1.trim(),
    line2: addrLine2.trim() || undefined,
    city: addrCity.trim(),
    state: addrState.trim(),
    pincode: addrPincode.trim(),
  };

  const handleDetailsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 0. Make sure the Razorpay checkout script is actually available.
      if (typeof window === 'undefined' || !window.Razorpay) {
        throw new Error(
          'Payment gateway is still loading. Please wait a moment and try again. ' +
          'If the issue persists, disable any ad/script blocker and reload the page.'
        );
      }

      // 1. Create Razorpay order on server (server validates prices & generates orderId)
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity })),
          customerName: name,
          customerEmail: email,
          customerMobile: mobile,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create payment order. Please try again.');
      }

      const razorpayOrder = await res.json();
      const serverOrderId: string = razorpayOrder.orderId;
      const serverTotal: number = razorpayOrder.serverTotal;
      setOrderId(serverOrderId);

      // 2. Persist a "pending" order in Firestore BEFORE opening Razorpay.
      //    This ensures we have a record even if the browser closes mid-payment.
      await createMerchOrder({
        orderId: serverOrderId,
        items: cart,
        total: serverTotal,
        customerName: name,
        customerEmail: email,
        customerMobile: mobile,
        deliveryAddress,
        upiRef: '',
        status: 'pending',
        razorpayOrderId: razorpayOrder.id,
        paymentMethod: 'razorpay',
      });

      // 3. Build Razorpay checkout options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Gramakam',
        description: `Merchandise - ${serverOrderId}`,
        image: '/images/gramakam-logo-white.png',
        order_id: razorpayOrder.id,
        prefill: {
          name,
          email,
          contact: `+91${mobile}`,
        },
        theme: {
          color: '#6B1D1D',
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // 4. Verify payment on server
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.verified) {
              // 5. Update existing order to verified
              //    If this fails, the webhook will still catch it — show success to user
              //    because payment IS captured by Razorpay regardless.
              try {
                // Decrement stock first
                try {
                  await decrementStock(cart.map((i) => ({ productId: i.productId, quantity: i.quantity })));
                } catch (stockErr) {
                  console.error('[checkout] Stock decrement failed (non-blocking):', stockErr);
                }

                await updateMerchOrderByOrderId(serverOrderId, {
                  upiRef: response.razorpay_payment_id,
                  status: 'verified',
                  razorpayPaymentId: response.razorpay_payment_id,
                  verifiedAt: new Date().toISOString(),
                  verifiedBy: 'auto',
                  stockDeducted: true,
                });
              } catch (updateErr) {
                // Payment succeeded but Firestore update failed.
                // The webhook will reconcile this — log for debugging.
                console.error('[checkout] Firestore update failed after verified payment. Webhook will reconcile.', {
                  orderId: serverOrderId,
                  paymentId: response.razorpay_payment_id,
                  error: updateErr,
                });
              }

              // 6. Send order confirmation email (fire-and-forget)
              fetch('/api/order-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: email,
                  customerName: name,
                  orderId: serverOrderId,
                  items: cart,
                  total: serverTotal,
                  paymentId: response.razorpay_payment_id,
                  deliveryAddress,
                }),
              }).catch((err) => console.error('[checkout] Email send failed:', err));

              setConfirmedTotal(serverTotal);
              setPaymentId(response.razorpay_payment_id);
              setStep('success');
              onOrderPlaced();
            } else {
              // Signature mismatch — payment may still have been captured.
              // Webhook will reconcile if payment was actually captured.
              console.error('[checkout] Payment verification failed (signature mismatch)', {
                orderId: serverOrderId,
                razorpayOrderId: response.razorpay_order_id,
              });
              setErrorMsg(
                'Payment verification failed. If money was deducted, it will be reconciled automatically. ' +
                'Contact support with Order ID: ' + serverOrderId
              );
              setStep('failed');
            }
          } catch (err) {
            // Network error during verification — payment may still be captured.
            // Webhook is the safety net here.
            console.error('[checkout] Verification network error. Webhook will reconcile if payment captured.', {
              orderId: serverOrderId,
              error: err,
            });
            setErrorMsg(
              'Could not verify payment due to a network issue. If money was deducted, ' +
              'your order will be confirmed automatically. Order ID: ' + serverOrderId
            );
            setStep('failed');
          }
        },
        modal: {
          ondismiss: () => {
            setStep('details');
            setIsSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', async (response: any) => {
        console.error('[checkout] Payment failed:', {
          orderId: serverOrderId,
          code: response.error?.code,
          description: response.error?.description,
          reason: response.error?.reason,
          source: response.error?.source,
          step: response.error?.step,
        });
        // Mark order as rejected (best-effort — if this fails, admin can see it's still pending)
        try {
          await updateMerchOrderByOrderId(serverOrderId, {
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectionReason: response.error?.description || 'Payment failed',
          });
        } catch (rejectErr) {
          console.error('[checkout] Failed to mark order as rejected:', {
            orderId: serverOrderId,
            error: rejectErr,
          });
        }
        setErrorMsg(response.error?.description || 'Payment failed. Please try again.');
        setStep('failed');
      });

      // Open the checkout popup, then flip the UI to 'paying'.
      rzp.open();
      setStep('paying');
    } catch (err: any) {
      console.error('[checkout] Pre-payment error:', err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStep('details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => step !== 'paying' && onClose()}
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
              <h3 className="font-semibold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>
                {step === 'details' && 'Checkout'}
                {step === 'paying' && 'Processing Payment...'}
                {step === 'success' && 'Order Confirmed!'}
                {step === 'failed' && 'Payment Failed'}
              </h3>
              {step !== 'paying' && (
                <button onClick={onClose} className="text-gray-400 hover:text-charcoal">
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="p-6">
              {/* Step 1: Customer Details + Pay */}
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

                  {/* Delivery Address */}
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Delivery Address</p>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="checkout-addr1" className="block text-sm font-medium text-charcoal mb-1">House / Building / Flat *</label>
                        <input
                          id="checkout-addr1"
                          type="text"
                          value={addrLine1}
                          onChange={(e) => setAddrLine1(e.target.value)}
                          placeholder="e.g. 12/B, Rose Villa"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="checkout-addr2" className="block text-sm font-medium text-charcoal mb-1">Street / Area / Landmark</label>
                        <input
                          id="checkout-addr2"
                          type="text"
                          value={addrLine2}
                          onChange={(e) => setAddrLine2(e.target.value)}
                          placeholder="e.g. Near Govt. School, Velur"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="checkout-city" className="block text-sm font-medium text-charcoal mb-1">City / Town *</label>
                          <input
                            id="checkout-city"
                            type="text"
                            value={addrCity}
                            onChange={(e) => setAddrCity(e.target.value)}
                            placeholder="e.g. Thrissur"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="checkout-pincode" className="block text-sm font-medium text-charcoal mb-1">Pincode *</label>
                          <input
                            id="checkout-pincode"
                            type="text"
                            value={addrPincode}
                            onChange={(e) => setAddrPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="680123"
                            pattern="[0-9]{6}"
                            title="Enter a valid 6-digit pincode"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="checkout-state" className="block text-sm font-medium text-charcoal mb-1">State *</label>
                        <input
                          id="checkout-state"
                          type="text"
                          value={addrState}
                          onChange={(e) => setAddrState(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !scriptLoaded}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Creating order...</>
                    ) : !scriptLoaded ? (
                      <><Loader2 size={16} className="animate-spin" /> Loading payment gateway...</>
                    ) : (
                      <>Pay ₹{total} <ArrowRight size={16} /></>
                    )}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    Secured by Razorpay. Supports UPI, cards, net banking & wallets.
                  </p>
                </form>
              )}

              {/* Paying state */}
              {step === 'paying' && (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 border-4 border-maroon border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-gray-600">Razorpay checkout is open.</p>
                  <p className="text-gray-400 text-sm">Complete your payment in the popup window.</p>
                  <p className="text-gray-400 text-xs pt-4">
                    Don&apos;t see the popup? It may be blocked by your browser.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setStep('details'); setErrorMsg(''); }}
                    className="text-sm text-maroon hover:underline"
                  >
                    Cancel and go back
                  </button>
                </div>
              )}

              {/* Success */}
              {step === 'success' && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                    <ShieldCheck size={32} className="text-green-500" />
                  </div>
                  <h3 className="font-semibold text-charcoal text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                    Payment Verified!
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your payment has been verified and your order is confirmed.
                  </p>

                  <div className="bg-gray-50 rounded-lg p-4 text-left text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Order ID</span>
                      <span className="font-mono font-medium text-charcoal">{orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment ID</span>
                      <span className="font-mono font-medium text-charcoal text-xs">{paymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-semibold text-maroon">₹{confirmedTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle size={14} /> Verified
                      </span>
                    </div>
                  </div>

                  <button onClick={onClose} className="btn-secondary mt-2">
                    Close
                  </button>
                </div>
              )}

              {/* Failed */}
              {step === 'failed' && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                    <X size={32} className="text-red-500" />
                  </div>
                  <h3 className="font-semibold text-charcoal text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                    Payment Failed
                  </h3>
                  <p className="text-sm text-gray-600">{errorMsg || 'Something went wrong. Please try again.'}</p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setStep('details'); setErrorMsg(''); }}
                      className="btn-primary flex-1"
                    >
                      Try Again
                    </button>
                    <button onClick={onClose} className="btn-secondary flex-1">
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
