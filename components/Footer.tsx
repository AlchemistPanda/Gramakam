import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/gramakam-logo-white.png"
                alt="Gramakam Logo"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
              <h3
                className="text-2xl font-bold text-cream"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Gramakam
              </h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              An annual celebration of theatre, literature, and culture in
              Kerala. Organised by IF Creations, Gramakam brings together
              artists, performers, and audiences in a vibrant festival of
              creative expression.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/gallery', label: 'Gallery' },
                { href: '/feed', label: 'Current Feed' },
                { href: '/merchandise', label: 'Merchandise' },
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-cream transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Get In Touch
            </h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-maroon-light" />
                <span>Velur, Thrissur, Kerala, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="shrink-0 text-maroon-light" />
                <a href="mailto:info@gramakam.com" className="hover:text-cream transition-colors">
                  info@gramakam.com
                </a>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://instagram.com/gramakam"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-maroon transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://facebook.com/gramakam"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-maroon transition-colors duration-300"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-gray-500 text-sm space-y-1">
          <p>&copy; {new Date().getFullYear()} Gramakam. All rights reserved. Organised by IF Creations.</p>
          <p>Developed by <span className="text-gray-400">Manuraj Rajamanikandan</span></p>
        </div>
      </div>
    </footer>
  );
}
