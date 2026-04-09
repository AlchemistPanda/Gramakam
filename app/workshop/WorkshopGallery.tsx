'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AnimatedSection from '@/components/AnimatedSection';

interface GalleryImage {
  src: string;
  alt: string;
}

interface WorkshopGalleryProps {
  images: GalleryImage[];
}

export default function WorkshopGallery({ images }: WorkshopGalleryProps) {
  const [shuffledImages, setShuffledImages] = useState<GalleryImage[]>(images);

  useEffect(() => {
    // Shuffle images on mount and whenever window gains focus
    const shuffleImages = () => {
      const shuffled = [...images].sort(() => Math.random() - 0.5);
      setShuffledImages(shuffled);
    };

    shuffleImages();

    // Re-shuffle when user returns to the tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        shuffleImages();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [images]);

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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {shuffledImages.map((img, i) => (
            <AnimatedSection key={`${img.src}-${i}`} delay={i * 0.07}>
              <div className="relative aspect-square rounded-2xl overflow-hidden group">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  quality={70}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
