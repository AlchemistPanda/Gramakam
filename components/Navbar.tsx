'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, QrCode, Wrench } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/feed', label: 'Feed' },
  { href: '/merchandise', label: 'Merchandise' },
  { href: '/contact', label: 'Contact' },
];

const toolsItems = [
  { href: '/qrgen', label: 'QR Generator', description: 'Create custom QR codes', icon: QrCode },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toolsHover, setToolsHover] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const toolsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openTools = () => {
    if (toolsTimer.current) clearTimeout(toolsTimer.current);
    setToolsHover(true);
  };
  const closeTools = () => {
    toolsTimer.current = setTimeout(() => setToolsHover(false), 120);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
        : 'bg-charcoal/80 backdrop-blur-sm'
    }`}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={scrolled ? '/images/gramakam-logo.png' : '/images/gramakam-logo-white.png'}
              alt="Gramakam Logo"
              width={40}
              height={40}
              className="w-8 h-8 md:w-10 md:h-10 object-contain transition-opacity duration-500"
            />
            <span className={`text-2xl md:text-3xl font-bold transition-colors duration-500 ${scrolled ? 'text-maroon' : 'text-white'}`} style={{ fontFamily: 'var(--font-heading)' }}>
              Gramakam
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-maroon transition-colors duration-300 font-medium text-sm uppercase tracking-wider ${scrolled ? 'text-charcoal' : 'text-white/90 hover:text-white'}`}
              >
                {link.label}
              </Link>
            ))}

            {/* Gramakam Tools dropdown */}
            <div className="relative" onMouseEnter={openTools} onMouseLeave={closeTools}>
              <button className={`flex items-center gap-1.5 font-medium text-sm uppercase tracking-wider transition-colors duration-300 ${scrolled ? 'text-charcoal hover:text-maroon' : 'text-white/90 hover:text-white'}`}>
                <Wrench size={13} className="shrink-0" />
                Tools
                <ChevronDown size={13} className={`transition-transform duration-200 ${toolsHover ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {toolsHover && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    onMouseEnter={openTools}
                    onMouseLeave={closeTools}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="px-2 py-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-2 pb-1">Gramakam Tools</p>
                      {toolsItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-violet-50 group transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-violet-50 group-hover:bg-violet-100 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                            <item.icon size={15} className="text-violet-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-charcoal group-hover:text-maroon transition-colors">{item.label}</p>
                            <p className="text-xs text-gray-400">{item.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden p-2 transition-colors ${scrolled ? 'text-charcoal hover:text-maroon' : 'text-white hover:text-white/70'}`}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t border-gray-100"
          >
            <div className="container-custom py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-charcoal hover:text-maroon transition-colors duration-300 font-medium text-lg py-2"
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Tools accordion */}
              <div>
                <button
                  onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
                  className="w-full flex items-center justify-between text-charcoal font-medium text-lg py-2"
                >
                  <span className="flex items-center gap-2"><Wrench size={16} className="text-violet-500" />Gramakam Tools</span>
                  <ChevronDown size={16} className={`transition-transform duration-200 text-gray-400 ${mobileToolsOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {mobileToolsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-6 border-l-2 border-violet-100 ml-2"
                    >
                      {toolsItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2 py-2.5 text-base text-charcoal hover:text-violet-600 transition-colors font-medium"
                        >
                          <item.icon size={15} className="text-violet-500 shrink-0" />
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
