'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';
import { soundManager } from '@/lib/sounds';
import { BROCHURE_PAGES, getBrochurePageImage } from '@/lib/brochureData';

export default function BrochureClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  const PAGE_FLIP_DURATION = 0.8;

  // Sound Management
  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

  // Handle Flip
  const flipToNext = useCallback(() => {
    if (currentPage < BROCHURE_PAGES && !isFlipping) {
      setFlipDirection('next');
      setIsFlipping(true);
      soundManager.playPageFlip();
      
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, PAGE_FLIP_DURATION * 1000);
    }
  }, [currentPage, isFlipping]);

  const flipToPrev = useCallback(() => {
    if (currentPage > 1 && !isFlipping) {
      setFlipDirection('prev');
      setIsFlipping(true);
      soundManager.playPageFlip();
      
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, PAGE_FLIP_DURATION * 1000);
    }
  }, [currentPage, isFlipping]);

  // Zoom / Pan Handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    const newZoom = Math.max(prev => prev - 0.5, 1);
    setZoom(newZoom);
    if (newZoom === 1) setPan({ x: 0, y: 0 });
  };
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handlePointerUp = () => setIsDragging(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') flipToNext();
      if (e.key === 'ArrowLeft') flipToPrev();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === 'Escape') resetZoom();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipToNext, flipToPrev]);

  return (
    <div className="min-h-screen bg-[#fdfaf6] py-12 px-4 selection:bg-maroon/10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <AnimatedSection className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-maroon/5 text-maroon text-xs font-bold uppercase tracking-widest mb-4">
            <BookOpen size={14} /> Official Guide
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-charcoal mb-4 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Digital <span className="text-maroon">Brochure</span> 2026
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">
            Experience the 9th edition of Gramakam. Flip through the pages to explore artists, 
            schedules, and the heritage of our village.
          </p>
        </AnimatedSection>

        {/* Browser Tooling */}
        <div className="flex justify-center mb-6 gap-3">
          <div className="flex items-center bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <button onClick={handleZoomOut} className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-500"><ZoomOut size={18} /></button>
            <span className="px-3 text-sm font-bold text-gray-400 w-16 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-500"><ZoomIn size={18} /></button>
            <div className="w-px h-6 bg-gray-100 mx-1" />
            <button onClick={resetZoom} className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-500"><RotateCcw size={18} /></button>
          </div>
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className={`p-3 rounded-xl shadow-sm border border-gray-100 transition-all ${isMuted ? 'bg-gray-100 text-gray-400' : 'bg-white text-maroon hover:bg-maroon hover:text-white'}`}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        {/* Flipbook Container */}
        <div className="relative flex justify-center items-center py-4">
          
          {/* Navigation Arrows (Desktop) */}
          <button 
            onClick={flipToPrev}
            disabled={currentPage === 1 || isFlipping}
            className="hidden md:flex absolute left-0 z-20 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg border border-gray-100 text-charcoal hover:bg-maroon hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft size={24} />
          </button>

          {/* THE BOOK */}
          <div 
            ref={bookRef}
            className="book-container relative w-full max-w-[800px] aspect-[1/1.4] md:aspect-[1/1.414] select-none"
            style={{ perspective: '2000px' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* Zoom / Pan Wrapper */}
            <motion.div 
              className="w-full h-full relative"
              animate={{ 
                scale: zoom,
                x: pan.x,
                y: pan.y
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Spine Effect */}
              <div className="absolute top-0 bottom-0 left-1/2 w-8 -translate-x-1/2 z-10 pointer-events-none bg-gradient-to-r from-black/5 via-black/20 to-black/5" />
              
              <div className="relative w-full h-full bg-white shadow-2xl rounded-sm overflow-hidden border border-gray-200">
                
                {/* Pages Logic */}
                <div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d' }}>
                  
                  {/* UNDER Page (The destination) */}
                  <div className="absolute inset-0 z-0">
                    <Image 
                      src={getBrochurePageImage(flipDirection === 'next' ? currentPage + 1 : flipDirection === 'prev' ? currentPage - 1 : currentPage)}
                      alt="Next content"
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* FLIPPING Page */}
                  <AnimatePresence mode="wait">
                    {isFlipping && (
                      <motion.div
                        key={`flip-${currentPage}-${flipDirection}`}
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: flipDirection === 'next' ? -180 : 180 }}
                        transition={{ duration: PAGE_FLIP_DURATION, ease: "easeInOut" }}
                        style={{ 
                          transformStyle: 'preserve-3d', 
                          transformOrigin: flipDirection === 'next' ? 'left' : 'right',
                          width: '100%',
                          height: '100%',
                          position: 'absolute',
                          top: 0
                        }}
                        className="z-20"
                      >
                        {/* Front of the flipping page */}
                        <div className="absolute inset-0 bg-white" style={{ backfaceVisibility: 'hidden' }}>
                           <div className="relative w-full h-full">
                              <Image src={getBrochurePageImage(currentPage)} alt="page front" fill className="object-contain shadow-2xl" />
                              {/* Page Bend Shadow Overlay */}
                              <motion.div 
                                className="absolute inset-0 bg-gradient-to-r from-black/0 via-black/10 to-black/30"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: PAGE_FLIP_DURATION }}
                              />
                           </div>
                        </div>

                        {/* Back of the flipping page */}
                        <div className="absolute inset-0 bg-white shadow-2xl" style={{ backfaceVisibility: 'hidden', transform: flipDirection === 'next' ? 'rotateY(180deg)' : 'rotateY(-180deg)' }}>
                           <div className="relative w-full h-full">
                              <Image src={getBrochurePageImage(flipDirection === 'next' ? currentPage + 1 : currentPage - 1)} alt="page back" fill className="object-contain" />
                              {/* Back of page light shimmer */}
                              <div className="absolute inset-0 bg-gradient-to-l from-white/10 via-transparent to-black/10" />
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* STATIC Page (The one not flipping) */}
                  {!isFlipping && (
                    <div className="absolute inset-0 z-10">
                       <Image src={getBrochurePageImage(currentPage)} alt={`Page ${currentPage}`} fill className="object-contain" />
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          </div>

          <button 
            onClick={flipToNext}
            disabled={currentPage === BROCHURE_PAGES || isFlipping}
            className="hidden md:flex absolute right-0 z-20 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg border border-gray-100 text-charcoal hover:bg-maroon hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronRight size={24} />
          </button>

        </div>

        {/* Mobile Navigation / Controls */}
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 w-full">
            <button 
              onClick={flipToPrev} 
              disabled={currentPage === 1 || isFlipping}
              className="flex-1 py-3 bg-gray-50 rounded-xl text-gray-500 hover:text-maroon transition-colors disabled:opacity-20"
            >
              <ChevronLeft className="mx-auto" size={24} />
            </button>
            <div className="text-center px-6">
              <span className="text-xs uppercase font-bold text-gray-400 block mb-1">Page</span>
              <span className="text-2xl font-black text-charcoal">{currentPage} / {BROCHURE_PAGES}</span>
            </div>
            <button 
              onClick={flipToNext} 
              disabled={currentPage === BROCHURE_PAGES || isFlipping}
              className="flex-1 py-3 bg-gray-50 rounded-xl text-gray-500 hover:text-maroon transition-colors disabled:opacity-20"
            >
              <ChevronRight className="mx-auto" size={24} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-maroon"
               animate={{ width: `${(currentPage / BROCHURE_PAGES) * 100}%` }}
               transition={{ type: 'spring', damping: 20, stiffness: 100 }}
             />
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><BookOpen size={12} /> Swipe to Flip</span>
            <span className="flex items-center gap-1.5"><Maximize2 size={12} /> Double Tap to Zoom</span>
            <span className="flex items-center gap-1.5"><Move size={12} /> Drag to Pan</span>
          </div>
        </div>

      </div>

      <style jsx>{`
        .book-container {
          cursor: ${zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'};
        }
      `}</style>
    </div>
  );
}
