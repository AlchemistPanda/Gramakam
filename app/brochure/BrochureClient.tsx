'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  BookOpen,
  Download,
} from 'lucide-react';
import { soundManager } from '@/lib/sounds';
import { BROCHURE_PAGES, getBrochurePageImage } from '@/lib/brochureData';

const FLIP_DURATION = 0.7; // seconds

export default function BrochureClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  // Preload adjacent pages
  useEffect(() => {
    const pages = [currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
    pages.forEach((p) => {
      if (p >= 1 && p <= BROCHURE_PAGES) {
        const img = new window.Image();
        img.src = getBrochurePageImage(p);
      }
    });
  }, [currentPage]);

  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

  const flipTo = useCallback(
    (dir: 'next' | 'prev') => {
      if (isFlipping) return;
      if (dir === 'next' && currentPage >= BROCHURE_PAGES) return;
      if (dir === 'prev' && currentPage <= 1) return;

      setFlipDirection(dir);
      setIsFlipping(true);
      soundManager.playPageFlip();

      setTimeout(() => {
        setCurrentPage((p) => (dir === 'next' ? p + 1 : p - 1));
        setIsFlipping(false);
        setFlipDirection(null);
      }, FLIP_DURATION * 1000);
    },
    [currentPage, isFlipping]
  );

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > BROCHURE_PAGES || page === currentPage || isFlipping) return;
      // For thumbnail jumps: instant switch (no flip anim to avoid confusion)
      soundManager.playPageFlip();
      setCurrentPage(page);
    },
    [currentPage, isFlipping]
  );

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        flipTo('next');
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        flipTo('prev');
      }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipTo, isFullscreen]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -60) flipTo('next');
    if (dx > 60) flipTo('prev');
  };

  // Fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      /* not supported */
    }
  };
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Scroll thumbnail strip
  useEffect(() => {
    if (showThumbnails && thumbnailRef.current) {
      const el = thumbnailRef.current.querySelector('[data-active="true"]');
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentPage, showThumbnails]);

  const progress = ((currentPage - 1) / (BROCHURE_PAGES - 1)) * 100;

  // Determine images for the flipbook layers
  const underPageNum =
    flipDirection === 'next'
      ? Math.min(currentPage + 1, BROCHURE_PAGES)
      : flipDirection === 'prev'
      ? Math.max(currentPage - 1, 1)
      : currentPage;

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col ${
        isFullscreen ? 'bg-[#1a1816]' : 'bg-gradient-to-b from-[#f8f5f0] via-[#faf8f4] to-[#f0ebe3]'
      }`}
    >
      {/* Header */}
      {!isFullscreen && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center pt-10 pb-6 px-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-maroon/8 text-maroon text-[11px] font-semibold uppercase tracking-[0.2em] mb-5 border border-maroon/10">
            <BookOpen size={13} strokeWidth={2.5} />
            <span>Official Brochure</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal mb-3"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Gramakam <span className="text-maroon">2026</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            The 9th edition — explore artists, schedules, and the heritage of our village
          </p>
        </motion.header>
      )}

      {/* Main area */}
      <div className={`flex-1 flex flex-col items-center justify-center ${isFullscreen ? 'p-4' : 'px-4 pb-6'}`}>
        {/* Toolbar */}
        <div className={`flex items-center justify-between w-full ${isFullscreen ? 'max-w-5xl' : 'max-w-3xl'} mb-3`}>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="font-semibold text-charcoal text-sm">{currentPage}</span>
            <span>/</span>
            <span>{BROCHURE_PAGES}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowThumbnails((p) => !p)}
              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                showThumbnails ? 'bg-maroon text-white' : 'text-gray-400 hover:text-charcoal hover:bg-black/5'
              }`}
              title="Toggle page thumbnails"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="1" width="4" height="5" rx="0.5" />
                <rect x="6" y="1" width="4" height="5" rx="0.5" />
                <rect x="11" y="1" width="4" height="5" rx="0.5" />
                <rect x="1" y="8" width="4" height="5" rx="0.5" />
                <rect x="6" y="8" width="4" height="5" rx="0.5" />
                <rect x="11" y="8" width="4" height="5" rx="0.5" />
              </svg>
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg transition-all ${
                isMuted ? 'text-gray-300' : 'text-gray-400 hover:text-maroon hover:bg-maroon/5'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-gray-400 hover:text-charcoal hover:bg-black/5 transition-all"
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
            <a
              href={getBrochurePageImage(currentPage)}
              download={`gramakam-2026-page-${currentPage}.png`}
              className="p-2 rounded-lg text-gray-400 hover:text-charcoal hover:bg-black/5 transition-all"
              title="Download this page"
            >
              <Download size={16} />
            </a>
          </div>
        </div>

        {/* Progress bar */}
        <div className={`w-full ${isFullscreen ? 'max-w-5xl' : 'max-w-3xl'} mb-4`}>
          <div className="relative w-full h-1 bg-black/5 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-maroon rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        {/* Thumbnail strip */}
        <AnimatePresence>
          {showThumbnails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`w-full ${isFullscreen ? 'max-w-5xl' : 'max-w-3xl'} mb-4 overflow-hidden`}
            >
              <div
                ref={thumbnailRef}
                className="flex gap-2 overflow-x-auto py-2 px-1"
              >
                {Array.from({ length: BROCHURE_PAGES }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    data-active={page === currentPage}
                    onClick={() => goToPage(page)}
                    className={`relative flex-shrink-0 w-12 h-16 sm:w-14 sm:h-[74px] rounded-md overflow-hidden border-2 transition-all duration-200 ${
                      page === currentPage
                        ? 'border-maroon shadow-md shadow-maroon/20 scale-105'
                        : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'
                    }`}
                  >
                    <Image src={getBrochurePageImage(page)} alt={`Page ${page}`} fill className="object-cover" sizes="56px" />
                    <span
                      className={`absolute bottom-0 inset-x-0 text-[8px] font-bold text-center py-0.5 ${
                        page === currentPage ? 'bg-maroon text-white' : 'bg-black/40 text-white/80'
                      }`}
                    >
                      {page}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ──────── FLIPBOOK ──────── */}
        <div
          className={`relative w-full ${isFullscreen ? 'max-w-5xl flex-1' : 'max-w-3xl'} flex items-center justify-center`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Desktop nav arrows */}
          <button
            onClick={() => flipTo('prev')}
            disabled={currentPage === 1 || isFlipping}
            className="hidden md:flex absolute -left-14 lg:-left-16 z-30 w-10 h-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-charcoal shadow-sm hover:bg-maroon hover:text-white disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 border border-black/5"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Book wrapper with 3D perspective */}
          <div
            className="relative w-full select-none"
            style={{ perspective: '1800px' }}
          >
            {/* A4 aspect-ratio container */}
            <div className="relative w-full" style={{ paddingBottom: '141.4%' }}>
              {/* Book shadow beneath */}
              <div className="absolute -bottom-3 left-[5%] right-[5%] h-8 bg-black/10 rounded-[50%] blur-xl pointer-events-none" />

              {/* ── UNDER PAGE (destination page, always visible below) ── */}
              <div className="absolute inset-0 rounded-lg overflow-hidden bg-white shadow-lg border border-black/[0.06]">
                <Image
                  src={getBrochurePageImage(underPageNum)}
                  alt={`Page ${underPageNum}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 800px"
                  quality={90}
                />
              </div>

              {/* ── FLIPPING PAGE (3D rotateY around left/right edge) ── */}
              {isFlipping && flipDirection && (
                <motion.div
                  key={`flip-${currentPage}-${flipDirection}`}
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: flipDirection === 'next' ? -180 : 180 }}
                  transition={{
                    duration: FLIP_DURATION,
                    ease: [0.45, 0.05, 0.35, 1], // smooth page-turn ease curve
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    transformStyle: 'preserve-3d',
                    transformOrigin: flipDirection === 'next' ? 'left center' : 'right center',
                    zIndex: 20,
                  }}
                >
                  {/* Front face — current page */}
                  <div
                    className="absolute inset-0 rounded-lg overflow-hidden bg-white"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <Image
                      src={getBrochurePageImage(currentPage)}
                      alt="Current page"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 800px"
                      quality={90}
                    />
                    {/* Dynamic shadow that intensifies as page lifts */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ background: 'linear-gradient(to right, transparent 60%, rgba(0,0,0,0) 100%)' }}
                      animate={{
                        background: [
                          'linear-gradient(to right, transparent 60%, rgba(0,0,0,0) 100%)',
                          'linear-gradient(to right, transparent 30%, rgba(0,0,0,0.15) 100%)',
                          'linear-gradient(to right, transparent 60%, rgba(0,0,0,0) 100%)',
                        ],
                      }}
                      transition={{ duration: FLIP_DURATION, ease: 'easeInOut' }}
                    />
                  </div>

                  {/* Back face — next/prev page (mirrored) */}
                  <div
                    className="absolute inset-0 rounded-lg overflow-hidden bg-white"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: flipDirection === 'next' ? 'rotateY(180deg)' : 'rotateY(-180deg)',
                    }}
                  >
                    <Image
                      src={getBrochurePageImage(underPageNum)}
                      alt="Next page"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 800px"
                      quality={90}
                    />
                    {/* Subtle light reflection on back */}
                    <div className="absolute inset-0 bg-gradient-to-l from-white/5 via-transparent to-black/[0.06] pointer-events-none" />
                  </div>
                </motion.div>
              )}

              {/* ── STATIC PAGE (when not flipping) ── */}
              {!isFlipping && (
                <div className="absolute inset-0 z-10 rounded-lg overflow-hidden bg-white shadow-lg border border-black/[0.06]">
                  <Image
                    src={getBrochurePageImage(currentPage)}
                    alt={`Gramakam 2026 Brochure — Page ${currentPage}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 800px"
                    priority={currentPage <= 3}
                    quality={90}
                  />
                  {/* Page edge highlight */}
                  <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/[0.04] rounded-lg" />
                </div>
              )}

              {/* Click zones for flipping — left half = prev, right half = next */}
              {!isFlipping && (
                <>
                  <div
                    className="absolute inset-y-0 left-0 w-1/2 z-20 cursor-pointer"
                    onClick={() => flipTo('prev')}
                    role="button"
                    aria-label="Previous page"
                  />
                  <div
                    className="absolute inset-y-0 right-0 w-1/2 z-20 cursor-pointer"
                    onClick={() => flipTo('next')}
                    role="button"
                    aria-label="Next page"
                  />
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => flipTo('next')}
            disabled={currentPage === BROCHURE_PAGES || isFlipping}
            className="hidden md:flex absolute -right-14 lg:-right-16 z-30 w-10 h-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-charcoal shadow-sm hover:bg-maroon hover:text-white disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 border border-black/5"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center justify-center gap-6 mt-6">
          <button
            onClick={() => flipTo('prev')}
            disabled={currentPage === 1 || isFlipping}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm text-charcoal hover:bg-maroon hover:text-white disabled:opacity-20 transition-all border border-black/5"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="text-center min-w-[80px]">
            <span className="text-2xl font-bold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>
              {currentPage}
            </span>
            <span className="text-gray-300 mx-1">/</span>
            <span className="text-sm text-gray-400">{BROCHURE_PAGES}</span>
          </div>
          <button
            onClick={() => flipTo('next')}
            disabled={currentPage === BROCHURE_PAGES || isFlipping}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm text-charcoal hover:bg-maroon hover:text-white disabled:opacity-20 transition-all border border-black/5"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Page slider */}
        <div className={`w-full ${isFullscreen ? 'max-w-5xl' : 'max-w-3xl'} mt-6`}>
          <input
            type="range"
            min={1}
            max={BROCHURE_PAGES}
            value={currentPage}
            onChange={(e) => goToPage(Number(e.target.value))}
            className="w-full h-1.5 appearance-none bg-black/5 rounded-full outline-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-maroon [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:shadow-maroon/30 [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-maroon [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md
              [&::-moz-range-thumb]:cursor-pointer"
          />
        </div>

        {/* Hint */}
        {!isFullscreen && (
          <p className="mt-4 text-[11px] text-gray-300 tracking-wide text-center">
            Click left/right side to flip &middot; Swipe on mobile &middot; Arrow keys &middot; F for fullscreen
          </p>
        )}
      </div>
    </div>
  );
}
