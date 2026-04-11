'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AnimatedSection from '@/components/AnimatedSection';

interface GalleryImage {
  src: string;
  alt: string;
  year: number;
}

interface WorkshopGalleryProps {
  images: GalleryImage[];
}

export default function WorkshopGallery({ images }: WorkshopGalleryProps) {
  const [groupedImages, setGroupedImages] = useState<Record<number, GalleryImage[]>>({});
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Group images by year
    const grouped: Record<number, GalleryImage[]> = {};

    images.forEach((img) => {
      if (!grouped[img.year]) {
        grouped[img.year] = [];
      }
      grouped[img.year].push(img);
    });

    // Check if this is the first load (not cached)
    const isFirstLoad = !localStorage.getItem('workshop-gallery-loaded');

    // Only shuffle on subsequent visits (cached loads)
    if (!isFirstLoad) {
      Object.keys(grouped).forEach((year) => {
        grouped[Number(year)] = [...grouped[Number(year)]].sort(() => Math.random() - 0.5);
      });
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGroupedImages(grouped);

    // Mark that gallery has been loaded
    if (isFirstLoad) {
      localStorage.setItem('workshop-gallery-loaded', 'true');
    }

    // Re-shuffle when user returns to tab (only if not first load)
    const handleVisibilityChange = () => {
      if (!document.hidden && !isFirstLoad) {
        const newGrouped: Record<number, GalleryImage[]> = {};

        Object.keys(grouped).forEach((year) => {
          newGrouped[Number(year)] = [...grouped[Number(year)]].sort(() => Math.random() - 0.5);
        });

        setGroupedImages(newGrouped);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [images]);

  const handleImageLoad = (src: string) => {
    setLoadedImages((prev) => new Set(prev).add(src));
  };

  // Get sorted years (newest first)
  const sortedYears = Object.keys(groupedImages)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <section className="section-padding bg-charcoal text-white">
      <div className="container-custom">
        <AnimatedSection>
          <div className="text-center mb-10">
            <p className="text-white/50 uppercase tracking-[0.2em] text-sm mb-2 font-medium">Gallery</p>
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Memories
            </h2>
            <div className="w-12 h-0.5 bg-maroon mx-auto mt-5" />
          </div>
        </AnimatedSection>

        {sortedYears.map((year) => (
          <div key={year} className="mb-16 last:mb-0">
            <AnimatedSection>
              <h3 className="text-2xl font-bold text-maroon mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
                Gramakam {year}
              </h3>
            </AnimatedSection>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {groupedImages[year].map((img, i) => (
                <AnimatedSection key={`${img.src}-${i}`} delay={i * 0.07}>
                  <div className="relative aspect-square rounded-2xl overflow-hidden group bg-gray-800">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      quality={70}
                      loading="lazy"
                      onLoad={() => handleImageLoad(img.src)}
                      placeholder="empty"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    {!loadedImages.has(img.src) && (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse" />
                    )}
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
