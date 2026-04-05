'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import { X, ChevronLeft, ChevronRight, Plus, Minus, ShoppingBag } from 'lucide-react';
import CheckoutModal from '@/components/merchandise/CheckoutModal';
import type { MerchCartItem } from '@/types';

interface MerchProduct {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  sizes?: string[];
}

const products: MerchProduct[] = [
  {
    id: 'tshirt',
    name: 'Gramakam T-Shirt',
    description:
      'Premium cotton t-shirt with the iconic Gramakam festival design. A wearable piece of cultural art.',
    images: ['/images/merch/tshirt2.jpg', '/images/merch/tshirt.jpg', '/images/merch/tshirt3.png', '/images/merch/tshirt4.png'],
    price: 1,
    sizes: ['24', '28', '32', '36 (S)', '38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
  },
  {
    id: 'slingbag',
    name: 'Gramakam Sling Bag',
    description:
      'A stylish, everyday carry sling bag bearing the Gramakam 2026 festival design. Crafted for comfort and durability, it features a spacious main compartment and an adjustable strap — perfect for the festival and beyond.',
    images: [
      '/images/SLINGBAG/SLINGBAG1.png',
      '/images/SLINGBAG/SLINGBAG2.png',
      '/images/SLINGBAG/SLINGBAG3.png',
      '/images/SLINGBAG/SLINGBAG4.png',
    ],
    price: 1,
  },
];

// Per-product selection state: { size, quantity }
interface Selection {
  size: string;
  quantity: number;
}

export default function MerchandisePage() {
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ images: string[]; index: number } | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});

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

  const getSelection = (id: string, product: MerchProduct): Selection =>
    selections[id] ?? { size: product.sizes?.[0] ?? 'N/A', quantity: 1 };

  const setSize = (id: string, product: MerchProduct, size: string) => {
    const sel = getSelection(id, product);
    setSelections((prev) => ({ ...prev, [id]: { ...sel, size } }));
  };

  const setQty = (id: string, product: MerchProduct, delta: number) => {
    const sel = getSelection(id, product);
    const newQty = Math.max(0, Math.min(10, sel.quantity + delta));
    setSelections((prev) => ({ ...prev, [id]: { ...sel, quantity: newQty } }));
  };

  // Build cart from selections
  const cart: MerchCartItem[] = products
    .filter((p) => (selections[p.id]?.quantity ?? 0) > 0)
    .map((p) => {
      const sel = getSelection(p.id, p);
      return { productId: p.id, name: p.name, price: p.price, size: sel.size, quantity: sel.quantity };
    });

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const openLightbox = (images: string[], index: number) => setLightboxImage({ images, index });
  const navigateLightbox = (dir: number) => {
    if (!lightboxImage) return;
    const newIndex = (lightboxImage.index + dir + lightboxImage.images.length) % lightboxImage.images.length;
    setLightboxImage({ ...lightboxImage, index: newIndex });
  };

  const buyNow = (product: MerchProduct) => {
    const sel = getSelection(product.id, product);
    setSelections({ [product.id]: sel });
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
            <div className="w-16 h-0.5 bg-maroon mx-auto mt-6" />
          </div>
        </AnimatedSection>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {products.map((product, index) => {
            const sel = getSelection(product.id, product);
            const currentImg = activeImageIndex[product.id] ?? 0;
            const hasMultipleSizes = product.sizes && product.sizes.length > 1;

            return (
              <AnimatedSection key={product.id} delay={index * 0.1}>
                <div className={`card bg-white h-full flex flex-col transition-shadow duration-300 ${sel.quantity > 0 ? 'ring-2 ring-maroon shadow-lg' : ''}`}>
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
                    {sel.quantity > 0 && (
                      <div className="absolute top-2 right-2 bg-maroon text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
                        {sel.quantity}
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

                    {/* Size selector */}
                    {hasMultipleSizes && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Select Size</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {product.sizes!.map((size) => (
                            <button
                              key={size}
                              onClick={() => setSize(product.id, product, size)}
                              className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
                                sel.size === size
                                  ? 'bg-maroon text-white border-maroon'
                                  : 'bg-white text-charcoal border-gray-300 hover:border-maroon'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs text-gray-400">Qty</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setQty(product.id, product, -1)}
                          disabled={sel.quantity === 1}
                          className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-maroon hover:text-maroon disabled:opacity-30 transition-colors text-lg font-bold"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-xl font-bold text-charcoal w-6 text-center">{sel.quantity}</span>
                        <button
                          onClick={() => setQty(product.id, product, 1)}
                          disabled={sel.quantity === 10}
                          className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-maroon hover:text-maroon disabled:opacity-30 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Buy Now Button */}
                    <button
                      onClick={() => buyNow(product)}
                      className="w-full bg-maroon hover:bg-maroon-dark text-white font-bold py-3 rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      Buy Now
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
                  <p className="text-white/70 text-xs">Total: ₹{totalAmount}</p>
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
        onOrderPlaced={() => setSelections({})}
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
