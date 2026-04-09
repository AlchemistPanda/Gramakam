'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Instagram } from 'lucide-react';

export default function InstagramFeed() {
  useEffect(() => {
    // Load Instagram embed script when component mounts
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <section className="relative section-padding bg-white overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-3" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #800020 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="container-custom relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-3 font-semibold">Stay Connected</p>
          <h2 className="heading-lg text-charcoal mb-4">Follow Us on Instagram</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Get the latest updates, behind-the-scenes moments, and exclusive content from Gramakam
          </p>
          <div className="w-16 h-1 bg-maroon rounded-full mx-auto mt-6" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left: Follow CTA */}
          <div className="lg:col-span-1 flex flex-col justify-start">
            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl p-1 shadow-lg">
              <div className="bg-white rounded-xl p-8 text-center h-full flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Instagram size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-charcoal mb-2">@_gramakam_</h3>
                  <p className="text-gray-600 text-sm mb-6">
                    Join our community of theatre enthusiasts and cultural supporters
                  </p>
                </div>

                <Link
                  href="https://www.instagram.com/_gramakam_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-pink-300/50 transition-all duration-300 hover:scale-105 w-full"
                >
                  <Instagram size={18} />
                  Follow Now
                </Link>

                {/* Stats */}
                <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-charcoal text-sm">Latest</p>
                    <p className="text-gray-500">Posts & Updates</p>
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal text-sm">Exclusive</p>
                    <p className="text-gray-500">Behind-the-scenes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Call-to-Actions */}
            <div className="mt-6 space-y-3">
              <a
                href="https://www.instagram.com/_gramakam_/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2 px-4 bg-gray-50 hover:bg-gray-100 text-charcoal rounded-lg font-medium transition-colors duration-300 text-sm"
              >
                View Profile
              </a>
              <a
                href="https://www.instagram.com/_gramakam_/?ref=gramakam.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2 px-4 border-2 border-maroon text-maroon hover:bg-maroon hover:text-white rounded-lg font-medium transition-all duration-300 text-sm"
              >
                Direct Message
              </a>
            </div>
          </div>

          {/* Right: Instagram Feed Embeds */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Instagram Profile Embed */}
              <div className="rounded-xl overflow-hidden">
                <blockquote
                  className="instagram-media w-full"
                  data-instgrm-permalink="https://www.instagram.com/_gramakam_/"
                  data-instgrm-version="14"
                >
                  <a href="https://www.instagram.com/_gramakam_/" target="_blank" rel="noopener noreferrer">
                    @_gramakam_ on Instagram
                  </a>
                </blockquote>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                  <h4 className="font-semibold text-charcoal mb-2">Why Follow?</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✓ Daily updates & announcements</li>
                    <li>✓ Event highlights & coverage</li>
                    <li>✓ Exclusive previews</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-6 border border-pink-100">
                  <h4 className="font-semibold text-charcoal mb-2">Connect With Us</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✓ Share your moments</li>
                    <li>✓ Tag & be featured</li>
                    <li>✓ Join the community</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Call-to-Action */}
        <div className="mt-16 text-center p-8 bg-gradient-to-r from-maroon/5 to-pink-500/5 rounded-2xl border border-maroon/10">
          <p className="text-gray-600 mb-4">
            Don't miss any updates from Gramakam 2026 — follow us on Instagram now!
          </p>
          <Link
            href="https://www.instagram.com/_gramakam_/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-maroon hover:bg-maroon-dark text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-maroon/30"
          >
            <Instagram size={18} />
            Follow @_gramakam_ on Instagram
          </Link>
        </div>
      </div>
    </section>
  );
}
