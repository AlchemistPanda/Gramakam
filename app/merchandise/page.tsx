'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import { X, ChevronLeft, ChevronRight, Plus, Minus, ShoppingBag, Package, Trash2 } from 'lucide-react';
import Link from 'next/link';
import CheckoutModal from '@/components/merchandise/CheckoutModal';
import type { MerchCartItem } from '@/types';
import { PRODUCTS as products, type Product, computeCartBreakdown, TSHIRT_DISCOUNT_TIERS } from '@/lib/products';
import { getStockDocs, type StockDoc } from '@/lib/services';

// Per-product selection state: { size, quantity }
interface Selection {
  size: string;
  quantity: number;
}

export default function MerchandisePage() {
  const [selections, setSelections] = useState<Record<string, Selection>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem('gramakam_cart');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ images: string[]; index: number } | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});
  const [stockDocs, setStockDocs] = useState<Record<string, StockDoc>>({});

  // Fetch live stock counts from Firestore
  useEffect(() => {
    getStockDocs()
      .then(setStockDocs)
      .catch(() => {}); // if it fails, everything shows as available
  }, []);

  // Persist cart to localStorage on every change
  useEffect(() => {
    try {
      const nonEmpty = Object.fromEntries(
        Object.entries(selections).filter(([, s]) => s.quantity > 0)
      );
      if (Object.keys(nonEmpty).length > 0) {
        localStorage.setItem('gramakam_cart', JSON.stringify(nonEmpty));
      } else {
        localStorage.removeItem('gramakam_cart');
      }
    } catch { /* localStorage not available */ }
  }, [selections]);

  // Auto-rotate carousel every 500ms for products with multiple images
  const rotationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    rotationRef.current = setInterval(() => {
      setActiveImageIndex((prev) => {
        const next = { ...prev };
        products.forEach((p) => {
          if (p.images.length > 1) {
            next[p.id] = ((prev[p.id] ?? 0) + 1) % p.images.length;
          }
        });
        return next;
      });
    }, 1500);
    return () => { if (rotationRef.current) clearInterval(rotationRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cart key: 'productId' for non-sized, 'productId:size' for sized
  const cartKey = (productId: string, size?: string) =>
    size && size !== 'N/A' ? `${productId}:${size}` : productId;

  const getSizeQty = (productId: string, size: string): number =>
    selections[cartKey(productId, size)]?.quantity ?? 0;

  const getProductQty = (productId: string): number => {
    const prefix = `${productId}:`;
    return Object.entries(selections)
      .filter(([k]) => k === productId || k.startsWith(prefix))
      .reduce((sum, [, sel]) => sum + sel.quantity, 0);
  };

  const setSizeQty = (productId: string, size: string, newQty: number) => {
    const key = cartKey(productId, size);
    setSelections((prev) => {
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      const prefix = `${productId}:`;
      let otherQty = 0;
      for (const [k, s] of Object.entries(prev)) {
        if ((k === productId || k.startsWith(prefix)) && k !== key) otherQty += s.quantity;
      }
      const capped = Math.min(newQty, 10 - otherQty);
      if (capped <= 0) return prev;
      return { ...prev, [key]: { size, quantity: capped } };
    });
  };

  const removeProduct = (productId: string) => {
    setSelections((prev) => {
      const prefix = `${productId}:`;
      const next: Record<string, Selection> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (k !== productId && !k.startsWith(prefix)) next[k] = v;
      }
      return next;
    });
  };

  // Build cart from selections
  const cart: MerchCartItem[] = Object.entries(selections)
    .filter(([, sel]) => sel.quantity > 0)
    .map(([key, sel]) => {
      const productId = key.includes(':') ? key.split(':')[0] : key;
      const product = products.find((p) => p.id === productId);
      if (!product) return null;
      return { productId, name: product.name, price: product.price, size: sel.size, quantity: sel.quantity };
    })
    .filter((item): item is MerchCartItem => item !== null);

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const { subtotal, discount, total: totalAmount, tshirtQty } = computeCartBreakdown(
    cart.map((i) => ({ productId: i.productId, quantity: i.quantity }))
  );

  // Stock helpers
  const getProductStock = (productId: string): number => {
    const doc = stockDocs[productId];
    if (!doc) return products.find((p) => p.id === productId)?.stock ?? -1;
    return doc.count;
  };
  const getSizeStock = (productId: string, size: string): number => {
    const doc = stockDocs[productId];
    if (!doc) return -1;
    if (doc.count === 0) return 0; // product paused
    if (doc.sizes && size in doc.sizes) return doc.sizes[size];
    return doc.count; // fall back to product-level
  };
  const isProductOutOfStock = (productId: string): boolean => {
    const s = getProductStock(productId);
    return s !== -1 && s <= 0;
  };
  const isSizeOutOfStock = (productId: string, size: string): boolean => {
    const s = getSizeStock(productId, size);
    return s !== -1 && s <= 0;
  };

  const openLightbox = (images: string[], index: number) => setLightboxImage({ images, index });
  const navigateLightbox = (dir: number) => {
    if (!lightboxImage) return;
    const newIndex = (lightboxImage.index + dir + lightboxImage.images.length) % lightboxImage.images.length;
    setLightboxImage({ ...lightboxImage, index: newIndex });
  };

  const buyNow = (product: Product) => {
    const pQty = getProductQty(product.id);
    if (pQty === 0) {
      // Add 1 of the first available size (or N/A for non-sized)
      if (product.sizes && product.sizes.length > 0) {
        const firstAvail = product.sizes.find((s) => !isSizeOutOfStock(product.id, s));
        if (firstAvail) setSizeQty(product.id, firstAvail, 1);
      } else {
        setSizeQty(product.id, 'N/A', 1);
      }
    }
    setShowCheckout(true);
  };

  return (
    <div className="section-padding bg-cream min-h-screen pb-32">
      <div className="container-custom">
        <AnimatedSection>
          <div className="text-center mb-10">
            <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-2">Festival Collectibles</p>
            <h1 className="heading-xl text-charcoal mb-4">Merchandise</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Take home a piece of Gramakam. Pick your items below and tap Checkout.
            </p>
            <div className="w-16 h-0.5 bg-maroon mx-auto mt-6 mb-6" />
            <Link
              href="/track"
              className="inline-flex items-center gap-2 px-6 py-3 bg-maroon/10 hover:bg-maroon/20 text-maroon font-semibold text-sm rounded-lg border border-maroon/30 hover:border-maroon/60 transition-all"
            >
              <Package size={16} /> Track Your Order
            </Link>
          </div>
        </AnimatedSection>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {products.map((product, index) => {
            const productQty = getProductQty(product.id);
            const currentImg = activeImageIndex[product.id] ?? 0;
            const hasMultipleSizes = product.sizes && product.sizes.length > 1;

            return (
              <AnimatedSection key={product.id} delay={index * 0.1}>
                <div className={`card bg-white h-full flex flex-col transition-shadow duration-300 ${productQty > 0 ? 'ring-2 ring-maroon shadow-lg' : ''}`}>
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100 overflow-hidden group">
                    <AnimatePresence mode="wait">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <motion.img
                        key={currentImg}
                        src={product.images[currentImg]}
                        alt={product.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                        loading="lazy"
                        onClick={() => openLightbox(product.images, currentImg)}
                      />
                    </AnimatePresence>
                    <div
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center cursor-pointer"
                      onClick={() => openLightbox(product.images, currentImg)}
                    >
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1 rounded-full">
                        Tap to view
                      </span>
                    </div>
                    {product.images.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                        {product.images.map((_, i) => (
                          <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => ({ ...prev, [product.id]: i })); }}
                            className={`w-2 h-2 rounded-full transition-all ${i === currentImg ? 'bg-white scale-125 shadow' : 'bg-white/60'}`}
                          />
                        ))}
                      </div>
                    )}
                    {productQty > 0 && (
                      <div className="absolute top-2 right-2 bg-maroon text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
                        {productQty}
                      </div>
                    )}
                    {isProductOutOfStock(product.id) && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-lg">Out of Stock</span>
                      </div>
                    )}

                  </div>

                  {/* Product Info */}
                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="text-lg font-semibold text-charcoal mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                      {product.name}
                    </h3>
                    <p className="text-xl font-bold text-maroon mb-2">₹{product.price}</p>
                    <p className="text-gray-600 text-sm mb-4 flex-grow">{product.description}</p>

                    {/* T-shirt bulk discount offer */}
                    {product.id === 'tshirt' && (
                      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5">🎉 Special Offer</p>
                        <div className="space-y-0.5 text-sm text-amber-900">
                          <p>Buy 2 for <span className="font-bold">₹550</span> <span className="text-xs text-amber-600">(save ₹50)</span></p>
                          <p>Buy 4 for <span className="font-bold">₹1,000</span> <span className="text-xs text-amber-600">(save ₹200)</span></p>
                        </div>
                      </div>
                    )}

                    {/* Per-size quantity grid (sized products like t-shirts) */}
                    {hasMultipleSizes && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-500 font-medium">Select Size & Quantity</p>
                          {productQty > 0 && (
                            <button
                              onClick={() => removeProduct(product.id)}
                              className="text-xs text-red-400 hover:text-red-600 flex items-center gap-0.5 transition-colors"
                            >
                              <Trash2 size={12} /> Clear All
                            </button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {product.sizes!.map((size) => {
                            const sizeOos = isSizeOutOfStock(product.id, size);
                            const qty = getSizeQty(product.id, size);
                            return (
                              <div key={size} className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-colors ${qty > 0 ? 'bg-maroon/5' : ''}`}>
                                <span className={`text-sm font-medium ${sizeOos ? 'text-gray-300 line-through' : 'text-charcoal'}`}>
                                  {size}
                                  {sizeOos && <span className="text-[10px] text-red-400 ml-1">(sold out)</span>}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setSizeQty(product.id, size, qty - 1)}
                                    disabled={qty <= 0 || sizeOos}
                                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-maroon hover:text-maroon disabled:opacity-30 transition-colors"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className={`text-sm font-bold w-5 text-center ${qty > 0 ? 'text-maroon' : 'text-gray-400'}`}>{qty}</span>
                                  <button
                                    onClick={() => setSizeQty(product.id, size, qty + 1)}
                                    disabled={sizeOos || productQty >= 10}
                                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-maroon hover:text-maroon disabled:opacity-30 transition-colors"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {productQty > 0 && (
                          <p className="text-xs text-maroon font-medium mt-2 text-right">{productQty} selected (max 10)</p>
                        )}
                      </div>
                    )}

                    {/* Quantity controls (non-sized products like sling bag) */}
                    {!hasMultipleSizes && (
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-400">Qty</p>
                          {productQty > 0 && (
                            <button
                              onClick={() => removeProduct(product.id)}
                              className="text-xs text-red-400 hover:text-red-600 flex items-center gap-0.5 transition-colors"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSizeQty(product.id, 'N/A', productQty - 1)}
                            disabled={productQty <= 0}
                            className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-maroon hover:text-maroon disabled:opacity-30 transition-colors text-lg font-bold"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="text-xl font-bold text-charcoal w-6 text-center">{productQty}</span>
                          <button
                            onClick={() => setSizeQty(product.id, 'N/A', productQty + 1)}
                            disabled={productQty >= 10}
                            className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-maroon hover:text-maroon disabled:opacity-30 transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Buy Now / Checkout Button */}
                    <button
                      onClick={() => buyNow(product)}
                      disabled={isProductOutOfStock(product.id)}
                      className="w-full bg-maroon hover:bg-maroon-dark text-white font-bold py-3 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                      {isProductOutOfStock(product.id) ? 'Out of Stock' : productQty > 0 ? 'Checkout' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>

      {/* Sticky Checkout Bar */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-maroon text-white shadow-2xl"
          >
            <div className="container-custom py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShoppingBag size={22} className="shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{totalItems} item{totalItems > 1 ? 's' : ''} selected</p>
                  <p className="text-white/70 text-xs">
                    Total: ₹{totalAmount}
                    {discount > 0 && <span className="text-green-300 ml-1">(saved ₹{discount})</span>}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCheckout(true)}
                className="bg-white text-maroon font-bold px-8 py-3 rounded-full text-sm hover:bg-cream transition-colors shadow-md shrink-0"
              >
                Checkout →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <CheckoutModal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        cart={cart}
        onOrderPlaced={() => {
          setSelections({});
          try { localStorage.removeItem('gramakam_cart'); } catch {}
          // Refresh stock counts
          getStockDocs().then(setStockDocs).catch(() => {});
        }}
      />

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10">
              <X size={32} />
            </button>
            <motion.img
              key={lightboxImage.index}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={lightboxImage.images[lightboxImage.index]}
              alt="Product view"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {lightboxImage.images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }} className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2">
                  <ChevronLeft size={28} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }} className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2">
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
