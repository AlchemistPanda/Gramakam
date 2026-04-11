'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';
import { soundManager } from '@/lib/sounds';
import { BROCHURE_PAGES, getBrochurePageImage } from '@/lib/brochureData';

export default function BrochureClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_DRAG = 40; // Minimum drag distance to trigger flip
  const PAGE_FLIP_DURATION = 0.6; // seconds

  // Handle sound mute toggle
  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

  // Go to next page
  const goToNextPage = () => {
    if (currentPage < BROCHURE_PAGES && !isFlipping) {
      setIsFlipping(true);
      soundManager.playPageFlip();
      setTimeout(() => {
        setCurrentPage((prev) => Math.min(prev + 1, BROCHURE_PAGES));
        setIsFlipping(false);
      }, PAGE_FLIP_DURATION * 1000);
    }
  };

  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1 && !isFlipping) {
      setIsFlipping(true);
      soundManager.playPageFlip();
      setTimeout(() => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
        setIsFlipping(false);
      }, PAGE_FLIP_DURATION * 1000);
    }
  };

  // Handle pointer down (start drag)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isFlipping) return;
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset(0);
  };

  // Handle pointer move (drag)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.x || isFlipping) return;
    const offset = e.clientX - dragStart.x;
    setDragOffset(offset);
  };

  // Handle pointer up (end drag)
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (Math.abs(dragOffset) > MIN_DRAG) {
      if (dragOffset > 0) {
        // Dragged right → previous page
        goToPreviousPage();
      } else {
        // Dragged left → next page
        goToNextPage();
      }
    }
    setDragStart({ x: 0, y: 0 });
    setDragOffset(0);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousPage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, isFlipping]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-cream/80 py-8 md:py-12">
      <div className="container-custom max-w-5xl">
        {/* Header */}
        <AnimatedSection className="text-center mb-8">
          <h1
            className="text-3xl md:text-4xl font-bold text-charcoal mb-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Gramakam 2026 Brochure
          </h1>
          <p className="text-gray-600">Explore the complete festival details and lineup</p>
        </AnimatedSection>

        {/* Main Brochure Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8"
        >
          {/* Book Container */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="relative w-full aspect-[8.5/11] md:aspect-[8.5/11] bg-charcoal/5 cursor-grab active:cursor-grabbing select-none"
            style={{
              perspective: '1000px',
              willChange: 'transform',
            }}
          >
            {/* Page Container with 3D Flip Effect */}
            <motion.div
              animate={{
                rotateY: isFlipping ? -180 : 0,
                x: dragOffset * 0.5, // Subtle parallax on drag
              }}
              transition={{
                rotateY: { type: 'tween', duration: PAGE_FLIP_DURATION, ease: 'easeInOut' },
                x: { type: 'spring', stiffness: 300, damping: 30 },
              }}
              style={{
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              } as React.CSSProperties}
              className="absolute inset-0"
            >
              {/* Current Page */}
              <div className="w-full h-full relative">
                <Image
                  src={getBrochurePageImage(currentPage)}
                  alt={`Brochure page ${currentPage}`}
                  fill
                  className="object-contain"
                  priority
                  quality={75}
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
            </motion.div>

            {/* Next Page (Behind, visible on flip) */}
            <div
              style={{
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              } as React.CSSProperties}
              className="absolute inset-0"
            >
              <div className="w-full h-full relative">
                {currentPage < BROCHURE_PAGES && (
                  <Image
                    src={getBrochurePageImage(currentPage + 1)}
                    alt={`Brochure page ${currentPage + 1}`}
                    fill
                    className="object-contain"
                    quality={75}
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                )}
              </div>
            </div>

            {/* Loading skeleton on first page load */}
            {currentPage === 1 && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            )}
          </div>

          {/* Navigation Controls */}
          <div className="bg-charcoal text-white px-6 py-4 flex items-center justify-between gap-4">
            {/* Previous Button */}
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1 || isFlipping}
              aria-label="Previous page"
              className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Page Counter */}
            <div className="text-center flex-1 md:flex-none">
              <p className="text-sm font-medium">
                Page{' '}
                <span className="font-bold text-maroon text-lg">
                  {currentPage}
                </span>{' '}
                of{' '}
                <span className="font-bold">
                  {BROCHURE_PAGES}
                </span>
              </p>
            </div>

            {/* Progress Bar */}
            <div className="hidden sm:flex flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden mx-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentPage / BROCHURE_PAGES) * 100}%` }}
                transition={{ duration: 0.3 }}
                className="bg-maroon h-full"
              />
            </div>

            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="p-2 rounded-lg hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            {/* Next Button */}
            <button
              onClick={goToNextPage}
              disabled={currentPage === BROCHURE_PAGES || isFlipping}
              aria-label="Next page"
              className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </motion.div>

        {/* Mobile Instructions */}
        <div className="md:hidden text-center text-sm text-gray-600 space-y-2">
          <p>Swipe left or right to flip pages</p>
          <p>Use arrow keys on keyboard to navigate</p>
        </div>

        {/* Desktop Instructions */}
        <AnimatedSection
          delay={0.2}
          className="hidden md:block bg-maroon/5 border border-maroon/20 rounded-xl p-6 text-center"
        >
          <p className="text-gray-700">
            💡 <strong>Tip:</strong> Drag the pages, click the arrows, or use arrow keys to navigate.
            Click the sound icon to toggle page flip sounds.
          </p>
        </AnimatedSection>
      </div>
    </div>
  );
}
