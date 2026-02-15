'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import { ShoppingBag, CheckCircle } from 'lucide-react';
import { submitPrebook } from '@/lib/services';

interface MerchProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  sizes?: string[];
}

const products: MerchProduct[] = [
  {
    id: 'tshirt',
    name: 'Gramakam T-Shirt',
    description:
      'Premium cotton t-shirt with the iconic Gramakam festival design. A wearable piece of cultural art.',
    imageUrl: '/images/merch/tshirt.jpg',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'cover',
    name: 'Gramakam Notebook Cover',
    description:
      'Beautifully designed notebook cover featuring traditional Kerala art motifs and Gramakam branding.',
    imageUrl: '/images/merch/cover.svg',
  },
  {
    id: 'keychain',
    name: 'Gramakam Keychain',
    description:
      'A unique festival keepsake. Carry a piece of Gramakam wherever you go.',
    imageUrl: '/images/merch/keychain.svg',
  },
  {
    id: 'hat',
    name: 'Gramakam Hat',
    description:
      'Stylish festival cap with embroidered Gramakam logo. Perfect for sun and style.',
    imageUrl: '/images/merch/hat.svg',
    sizes: ['One Size'],
  },
];

export default function MerchandisePage() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
      setFormData({ name: '', email: '', item: '', size: '', quantity: 1 });
    } catch {
      console.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
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
          {products.map((product, index) => (
            <AnimatedSection key={product.id} delay={index * 0.1}>
              <div className="card bg-white h-full flex flex-col">
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
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
          ))}
        </div>

        {/* Pre-book Form Modal */}
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl p-6 md:p-8 max-w-md w-full shadow-xl"
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
      </div>
    </div>
  );
}
