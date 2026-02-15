'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import { MapPin, Mail, Phone, Instagram, Facebook, Send, CheckCircle } from 'lucide-react';
import { submitContact } from '@/lib/services';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      await submitContact(formData);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="section-padding bg-white min-h-screen">
      <div className="container-custom">
        <AnimatedSection>
          <div className="text-center mb-10">
            <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-2">
              Reach Out
            </p>
            <h1 className="heading-xl text-charcoal mb-4">Contact Us</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Have questions about Gramakam? Want to participate or collaborate?
              We&apos;d love to hear from you.
            </p>
            <div className="w-16 h-0.5 bg-maroon mx-auto mt-6" />
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Form */}
          <AnimatedSection>
            <div className="card p-6 md:p-8">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="heading-md text-charcoal mb-2">Thank You!</h3>
                  <p className="text-gray-600">
                    Your message has been received. We&apos;ll get back to you soon.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="btn-secondary mt-6"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-1">
                      Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1">
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-charcoal mb-1">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all resize-none"
                      placeholder="Tell us how we can help..."
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        Send Message <Send size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </AnimatedSection>

          {/* Contact Info */}
          <AnimatedSection delay={0.2}>
            <div className="space-y-8">
              <div>
                <h3 className="heading-md text-charcoal mb-4">Festival Location</h3>
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-maroon mt-1 shrink-0" />
                  <div>
                    <p className="font-medium text-charcoal">Velur, Thrissur</p>
                    <p className="text-gray-600">Kerala, India</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="heading-md text-charcoal mb-4">Email</h3>
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-maroon shrink-0" />
                  <a
                    href="mailto:info@gramakam.com"
                    className="text-gray-600 hover:text-maroon transition-colors"
                  >
                    info@gramakam.com
                  </a>
                </div>
              </div>

              <div>
                <h3 className="heading-md text-charcoal mb-4">Organised By</h3>
                <p className="text-gray-600">
                  <strong className="text-charcoal">Gramakam Cultural Academy</strong>
                  <br />
                  Velur, Thrissur, Kerala
                </p>
              </div>

              <div>
                <h3 className="heading-md text-charcoal mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a
                    href="https://instagram.com/gramakam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-cream flex items-center justify-center hover:bg-maroon hover:text-white text-maroon transition-all duration-300"
                    aria-label="Instagram"
                  >
                    <Instagram size={22} />
                  </a>
                  <a
                    href="https://facebook.com/gramakam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-cream flex items-center justify-center hover:bg-maroon hover:text-white text-maroon transition-all duration-300"
                    aria-label="Facebook"
                  >
                    <Facebook size={22} />
                  </a>
                </div>
              </div>

              {/* Map Embed Placeholder */}
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31338.927!2d76.16!3d10.55!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba7ee52b3!2sVelur%2C%20Thrissur!5e0!3m2!1sen!2sin!4v1"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Gramakam Festival Location - Velur, Thrissur"
                />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
