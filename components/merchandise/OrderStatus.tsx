'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/firebase';
import { verifyOrderByUpiRef } from '@/lib/services';
import type { MerchOrderStatus } from '@/types';

interface OrderStatusProps {
  orderId: string;
  firestoreId: string;
  upiRef: string;
  total: number;
  onClose: () => void;
}

export default function OrderStatus({ orderId, firestoreId, upiRef, total, onClose }: OrderStatusProps) {
  const [status, setStatus] = useState<MerchOrderStatus>('pending');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!db || !firestoreId) return;

    let orderUnsub: (() => void) | undefined;
    let paymentsUnsub: (() => void) | undefined;
    let attemptedMatch = false;

    async function setup() {
      const { doc, collection, onSnapshot } = await import('firebase/firestore');

      // Listen to the order doc for status changes (admin manual verify)
      orderUnsub = onSnapshot(doc(db!, 'merch_orders', firestoreId), (snap) => {
        const data = snap.data();
        if (data?.status && data.status !== 'pending') {
          setStatus(data.status as MerchOrderStatus);
          setChecking(false);
        }
      });

      // Listen to upi_payments for auto-match
      paymentsUnsub = onSnapshot(collection(db!, 'upi_payments'), async () => {
        if (attemptedMatch) return;
        attemptedMatch = true;
        try {
          const matched = await verifyOrderByUpiRef(firestoreId, upiRef, total);
          if (matched) {
            setStatus('verified');
            setChecking(false);
          } else {
            attemptedMatch = false; // allow retry on next snapshot
          }
        } catch {
          attemptedMatch = false;
        }
      });

      // Stop checking after 5 minutes
      setTimeout(() => setChecking(false), 5 * 60 * 1000);
    }

    setup();

    return () => {
      orderUnsub?.();
      paymentsUnsub?.();
    };
  }, [firestoreId, upiRef, total]);

  return (
    <div className="text-center py-4 space-y-4">
      {status === 'pending' && (
        <>
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
            <Clock size={32} className="text-amber-500" />
          </div>
          <h3 className="font-semibold text-charcoal text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
            Order Placed
          </h3>
          <p className="text-sm text-gray-600">
            {checking
              ? 'Verifying your payment... This usually takes a few seconds.'
              : 'Payment verification is pending. The admin will verify your payment shortly.'}
          </p>
          {checking && (
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      )}

      {status === 'verified' && (
        <>
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h3 className="font-semibold text-charcoal text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
            Payment Verified!
          </h3>
          <p className="text-sm text-gray-600">
            Your payment has been automatically verified. Your order is confirmed.
          </p>
        </>
      )}

      {status === 'manual_verified' && (
        <>
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
            <ShieldCheck size={32} className="text-blue-500" />
          </div>
          <h3 className="font-semibold text-charcoal text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
            Payment Verified!
          </h3>
          <p className="text-sm text-gray-600">
            Your payment has been verified by the admin. Your order is confirmed.
          </p>
        </>
      )}

      {status === 'rejected' && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <XCircle size={32} className="text-red-500" />
          </div>
          <h3 className="font-semibold text-charcoal text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
            Payment Not Verified
          </h3>
          <p className="text-sm text-gray-600">
            We could not verify your payment. Please contact us if you believe this is an error.
          </p>
        </>
      )}

      <div className="bg-gray-50 rounded-lg p-4 text-left text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Order ID</span>
          <span className="font-mono font-medium text-charcoal">{orderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">UPI Ref</span>
          <span className="font-mono font-medium text-charcoal">{upiRef}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Amount</span>
          <span className="font-semibold text-maroon">₹{total}</span>
        </div>
      </div>

      <button onClick={onClose} className="btn-secondary mt-2">
        Close
      </button>
    </div>
  );
}
