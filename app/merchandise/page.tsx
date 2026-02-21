'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import { CheckCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { submitPrebook } from '@/lib/services';

interface MerchProduct {
  id: string;
  name: string;
  description: string;
  images: string[];
  sizes?: string[];
}

const products: MerchProduct[] = [
  {
    id: 'tshirt',
    name: 'Gramakam T-Shirt',
    description:
      'Premium cotton t-shirt with the iconic Gramakam festival design. A wearable piece of cultural art.',
    images: ['/images/merch/tshirt2.jpg', '/images/merch/tshirt.jpg'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'cover',
    name: 'Gramakam Notebook Cover',
    description:
      'Beautifully designed notebook cover featuring traditional Kerala art motifs and Gramakam branding.',
    images: ['/images/merch/cover.svg'],
  },
  {
    id: 'keychain',
    name: 'Gramakam Keychain',
    description:
      'A unique festival keepsake. Carry a piece of Gramakam wherever you go.',
    images: ['/images/merch/keychain.svg'],
  },
  {
    id: 'hat',
    name: 'Gramakam Hat',
    description:
      'Stylish festival cap with embroidered Gramakam logo. Perfect for sun and style.',
    images: ['/images/merch/hat.svg'],
    sizes: ['One Size'],
  },
];

export default function MerchandisePage() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ images: string[]; index: number } | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    item: '',
    size: '',
    quantity: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handlePrebook = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(productId);
      setFormData({ ...formData, item: product.name, size: product.sizes?.[0] || 'N/A' });
      setIsSubmitted(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitPrebook(formData);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', mobile: '', item: '', size: '', quantity: 1 });
    } catch {
      console.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImage({ images, index });
  };

  const closeLightbox = () => setLightboxImage(null);

  const navigateLightbox = (direction: number) => {
    if (!lightboxImage) return;
    const newIndex = (lightboxImage.index + direction + lightboxImage.images.length) % lightboxImage.images.length;
    setLightboxImage({ ...lightboxImage, index: newIndex });
  };

  const selectedProductData = products.find((p) => p.id === selectedProduct);

  return (
    <div className="section-padding bg-cream min-h-screen">
      <div className="container-custom">
        <AnimatedSection>
          <div className="text-center mb-10">
            <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-2">
              Festival Collectibles
            </p>
            <h1 className="heading-xl text-charcoal mb-4">Merchandise</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Take home a piece of Gramakam. Our exclusive festival merchandise
              is designed to celebrate the spirit of theatre and culture.
            </p>
            <div className="w-16 h-0.5 bg-maroon mx-auto mt-6" />
          </div>
        </AnimatedSection>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {products.map((product, index) => {
            const currentImg = activeImageIndex[product.id] || 0;
            return (
              <AnimatedSection key={product.id} delay={index * 0.1}>
                <div className="card bg-white h-full flex flex-col">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100 overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.images[currentImg]}
                      alt={product.name}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onClick={() => openLightbox(product.images, currentImg)}
                    />
                    {/* Click to view overlay */}
                    <div
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center cursor-pointer"
                      onClick={() => openLightbox(product.images, currentImg)}
                    >
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1 rounded-full">
                        Tap to view
                      </span>
                    </div>
                    {/* Image dots / navigation for multiple images */}
                    {product.images.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                        {product.images.map((_, i) => (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIndex({ ...activeImageIndex, [product.id]: i });
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i === currentImg ? 'bg-white scale-125 shadow' : 'bg-white/60'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-5 flex-grow flex flex-col">
                    <h3
                      className="text-lg font-semibold text-charcoal mb-2"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 flex-grow">
                      {product.description}
                    </p>
                    {product.sizes && (
                      <p className="text-xs text-earth mb-3">
                        Sizes: {product.sizes.join(', ')}
                      </p>
                    )}
                    <button
                      onClick={() => handlePrebook(product.id)}
                      className="btn-primary text-sm w-full"
                    >
                      Pre-book Now
                    </button>
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>

        {/* Image Lightbox Modal */}
        <AnimatePresence>
          {lightboxImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
              onClick={closeLightbox}
            >
              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
              >
                <X size={32} />
              </button>

              {/* Image */}
              <motion.img
                key={lightboxImage.index}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                src={lightboxImage.images[lightboxImage.index]}
                alt="Product view"
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Navigation arrows for multi-image */}
              {lightboxImage.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
                    className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
                    className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
                  >
                    <ChevronRight size={28} />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                    {lightboxImage.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage({ ...lightboxImage, index: i });
                        }}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          i === lightboxImage.index ? 'bg-white scale-125' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pre-book Form Modal */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setSelectedProduct(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-xl p-6 md:p-8 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {isSubmitted ? (
                  <div className="text-center py-4">
                    <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                    <h3 className="heading-md text-charcoal mb-2">Pre-booked!</h3>
                    <p className="text-gray-600 mb-4">
                      Your pre-booking has been received. We&apos;ll be in touch soon.
                    </p>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <h3
                      className="heading-md text-charcoal mb-1"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      Pre-book: {selectedProductData?.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">
                      No payment required now. We&apos;ll contact you with details.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="prebook-name" className="block text-sm font-medium text-charcoal mb-1">
                          Name *
                        </label>
                        <input
                          id="prebook-name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="prebook-email" className="block text-sm font-medium text-charcoal mb-1">
                          Email *
                        </label>
                        <input
                          id="prebook-email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="prebook-mobile" className="block text-sm font-medium text-charcoal mb-1">
                          Mobile Number *
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600 font-medium">
                            +91
                          </span>
                          <input
                            id="prebook-mobile"
                            type="tel"
                            value={formData.mobile}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setFormData({ ...formData, mobile: val });
                            }}
                            placeholder="9876543210"
                            pattern="[6-9][0-9]{9}"
                            title="Enter a valid 10-digit Indian mobile number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
                            required
                          />
                        </div>
                      </div>
                      {selectedProductData?.sizes && selectedProductData.sizes.length > 1 && (
                        <div>
                          <label htmlFor="prebook-size" className="block text-sm font-medium text-charcoal mb-1">
                            Size
                          </label>
                          <select
                            id="prebook-size"
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
                          >
                            {selectedProductData.sizes.map((size) => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label htmlFor="prebook-qty" className="block text-sm font-medium text-charcoal mb-1">
                          Quantity
                        </label>
                        <input
                          id="prebook-qty"
                          type="number"
                          min={1}
                          max={10}
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(null)}
                          className="btn-secondary flex-1"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn-primary flex-1 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Submitting...' : 'Pre-book'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
