'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AnimatedSection from '@/components/AnimatedSection';
import { getWorkshopGalleryItems } from '@/lib/services';

interface GalleryImage {
  src: string;
  alt: string;
  year: number;
}

interface WorkshopGalleryProps {
  fallbackImages: GalleryImage[];
}

export default function WorkshopGallery({ fallbackImages }: WorkshopGalleryProps) {
  const [current2026, setCurrent2026] = useState<GalleryImage[]>([]);
  const [pastImages, setPastImages] = useState<GalleryImage[]>([]);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    getWorkshopGalleryItems()
      .then((items) => {
        const all: GalleryImage[] = items.map((item) => ({
          src: item.imageUrl,
          alt: item.alt || 'Workshop image',
          year: item.year,
        }));

        const firestore2026 = all.filter((img) => img.year === 2026);
        const firestorePast = all.filter((img) => img.year !== 2026);

        // Use Firestore 2026 if available; always use fallback for past (static photos)
        setCurrent2026(firestore2026);
        // For past: if Firestore has past-year items use those, else use fallback static images
        setPastImages(firestorePast.length > 0 ? firestorePast : fallbackImages);
      })
      .catch(() => {
        // On error, show fallback static images as past years
        setPastImages(fallbackImages);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageLoad = (src: string) => {
    setLoadedImages((prev) => new Set(prev).add(src));
  };

  const has2026 = current2026.length > 0;
  const hasPast = pastImages.length > 0;

  if (!has2026 && !hasPast) return null;

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

        {/* 2026 — current year, shown first */}
        {has2026 && (
          <div className="mb-16">
            <AnimatedSection>
              <h3 className="text-2xl font-bold text-maroon mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
                Gramakam 2026
              </h3>
            </AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {current2026.map((img, i) => (
                <AnimatedSection key={`2026-${i}`} delay={i * 0.07}>
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
        )}

        {/* Past years — all grouped together */}
        {hasPast && (
          <div className="mb-16 last:mb-0">
            <AnimatedSection>
              <h3 className="text-2xl font-bold text-maroon mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
                Past Workshops
              </h3>
            </AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {pastImages.map((img, i) => (
                <AnimatedSection key={`past-${i}`} delay={i * 0.07}>
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
        )}
      </div>
    </section>
  );
}
