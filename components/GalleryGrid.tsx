'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Images } from 'lucide-react';
import { GalleryItem } from '@/types';

interface GalleryGridProps {
  items: GalleryItem[];
  years: number[];
}

const PAGE_SIZE = 24;

function GalleryCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-100"
      onClick={onClick}
    >
      {/* Skeleton shimmer while loading */}
      {!loaded && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
      )}
      <Image
        src={item.imageUrl}
        alt={item.title}
        fill
        className={`object-cover group-hover:scale-110 transition-all duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
      {loaded && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-sm font-medium truncate">{item.title}</p>
            <p className="text-xs text-white/70">{item.year}</p>
          </div>
          {item.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                <Play size={20} className="text-maroon ml-1" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function GalleryGrid({ items, years }: GalleryGridProps) {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredItems =
    selectedYear === 'all'
      ? items
      : items.filter((item) => item.year === selectedYear);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  const handleYearChange = useCallback((year: number | 'all') => {
    setSelectedYear(year);
    setVisibleCount(PAGE_SIZE);
  }, []);

  return (
    <>
      {/* Year Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <button
          onClick={() => handleYearChange('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            selectedYear === 'all'
              ? 'bg-maroon text-white'
              : 'bg-gray-100 text-charcoal hover:bg-gray-200'
          }`}
        >
          All Years
        </button>
        {years.map((year) => (
          <button
            key={year}
            onClick={() => handleYearChange(year)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedYear === year
                ? 'bg-maroon text-white'
                : 'bg-gray-100 text-charcoal hover:bg-gray-200'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Count badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Images size={14} />
          <span>
            Showing <span className="font-semibold text-charcoal">{visibleItems.length}</span> of{' '}
            <span className="font-semibold text-charcoal">{filteredItems.length}</span> photos
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <AnimatePresence mode="popLayout">
          {visibleItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, delay: Math.min(index, 11) * 0.04 }}
            >
              <GalleryCard item={item} onClick={() => setLightboxItem(item)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No gallery items found for this filter.</p>
        </div>
      )}

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center mt-10">
          <motion.button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-3 rounded-full bg-maroon text-white text-sm font-semibold shadow hover:bg-maroon/90 transition-colors"
          >
            Load more &mdash; {filteredItems.length - visibleCount} remaining
          </motion.button>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxItem(null)}
          >
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
              aria-label="Close lightbox"
            >
              <X size={20} />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl max-h-[85vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxItem.type === 'video' && lightboxItem.videoUrl ? (
                <div className="relative aspect-video">
                  <iframe
                    src={lightboxItem.videoUrl}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                    title={lightboxItem.title}
                  />
                </div>
              ) : (
                <div className="relative aspect-video">
                  <Image
                    src={lightboxItem.imageUrl}
                    alt={lightboxItem.title}
                    fill
                    className="object-contain rounded-lg"
                    sizes="100vw"
                  />
                </div>
              )}
              <div className="mt-4 text-white text-center">
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  {lightboxItem.title}
                </h3>
                <p className="text-white/60 text-sm mt-1">
                  {lightboxItem.year} &middot; {lightboxItem.category}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
