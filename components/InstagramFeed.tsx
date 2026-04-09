'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Instagram, MessageCircle } from 'lucide-react';

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
          <h2 className="heading-lg text-charcoal mb-4">Follow & Join Our Community</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Get the latest updates and connect with fellow theatre enthusiasts on Instagram and our WhatsApp community
          </p>
          <div className="w-16 h-1 bg-maroon rounded-full mx-auto mt-6" />
        </div>

        {/* Main Content Grid */}
        <div className="space-y-16">
          {/* First Row: Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

          {/* Middle: WhatsApp Community CTA */}
          <div className="lg:col-span-1 flex flex-col justify-start">
            <div className="bg-gradient-to-br from-green-400 via-green-500 to-teal-600 rounded-2xl p-1 shadow-lg">
              <div className="bg-white rounded-xl p-8 text-center h-full flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <MessageCircle size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-charcoal mb-2">WhatsApp Group</h3>
                  <p className="text-gray-600 text-sm mb-6">
                    Join our active community for real-time updates and conversations
                  </p>
                </div>

                <Link
                  href="https://chat.whatsapp.com/G64V2w7mD3j3vRJCfLL3S8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 to-teal-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-green-300/50 transition-all duration-300 hover:scale-105 w-full"
                >
                  <MessageCircle size={18} />
                  Join Now
                </Link>

                {/* Stats */}
                <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-charcoal text-sm">Real-time</p>
                    <p className="text-gray-500">Notifications</p>
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal text-sm">Active</p>
                    <p className="text-gray-500">Community</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Call-to-Actions */}
            <div className="mt-6 space-y-3">
              <a
                href="https://chat.whatsapp.com/G64V2w7mD3j3vRJCfLL3S8"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2 px-4 bg-gray-50 hover:bg-gray-100 text-charcoal rounded-lg font-medium transition-colors duration-300 text-sm"
              >
                Open Chat
              </a>
              <p className="text-center text-xs text-gray-500 py-2">
                Active members discussing events & culture
              </p>
            </div>
          </div>
          </div>

          {/* Second Row: Instagram Feed Embeds */}
          <div>
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
                  <h4 className="font-semibold text-charcoal mb-2">📸 Instagram</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✓ Daily updates & announcements</li>
                    <li>✓ Event highlights & coverage</li>
                    <li>✓ Exclusive visual stories</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6 border border-green-100">
                  <h4 className="font-semibold text-charcoal mb-2">💬 WhatsApp</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✓ Real-time notifications</li>
                    <li>✓ Active community chat</li>
                    <li>✓ Instant announcements</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Call-to-Action */}
        <div className="mt-16 text-center p-8 bg-gradient-to-r from-maroon/5 to-pink-500/5 rounded-2xl border border-maroon/10">
          <p className="text-gray-600 mb-6 text-lg">
            Stay connected with Gramakam 2026 on your favorite platform — whether it's Instagram for visual updates or WhatsApp for instant notifications!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://www.instagram.com/_gramakam_/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-pink-300/30"
            >
              <Instagram size={18} />
              Follow on Instagram
            </Link>
            <Link
              href="https://chat.whatsapp.com/G64V2w7mD3j3vRJCfLL3S8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-400 to-teal-600 hover:from-green-500 hover:to-teal-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-green-300/30"
            >
              <MessageCircle size={18} />
              Join WhatsApp Group
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
