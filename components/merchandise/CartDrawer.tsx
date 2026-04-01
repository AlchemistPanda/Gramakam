'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import type { MerchCartItem } from '@/types';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: MerchCartItem[];
  onUpdateQty: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
}

export default function CartDrawer({ open, onClose, cart, onUpdateQty, onRemove, onCheckout }: CartDrawerProps) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-black/50"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-[56] w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-charcoal text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                Your Cart ({cart.length})
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-charcoal">
                <X size={22} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingBag size={48} className="mb-3 opacity-40" />
                  <p className="text-sm">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={`${item.productId}-${item.size}`} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-charcoal text-sm truncate">{item.name}</p>
                        {item.size !== 'N/A' && (
                          <p className="text-xs text-gray-500">Size: {item.size}</p>
                        )}
                        <p className="text-xs text-maroon font-semibold mt-1">
                          ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQty(index, -1)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-maroon hover:text-maroon disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-600"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQty(index, 1)}
                          disabled={item.quantity >= 10}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-maroon hover:text-maroon disabled:opacity-30"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemove(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-100 px-6 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-charcoal">Total</span>
                  <span className="text-xl font-bold text-maroon">₹{total}</span>
                </div>
                <button
                  onClick={onCheckout}
                  className="btn-primary w-full text-center"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
