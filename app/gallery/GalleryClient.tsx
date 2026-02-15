'use client';

import { useState, useEffect } from 'react';
import GalleryGrid from '@/components/GalleryGrid';
import AnimatedSection from '@/components/AnimatedSection';
import { GalleryItem } from '@/types';
import { getGalleryItems, getGalleryYears } from '@/lib/services';

const fallbackItems: GalleryItem[] = [
  // 2025 edition
  { id: '1', title: 'Grand Stage Performance', imageUrl: '/images/festival/gramakam-01.jpg', year: 2025, category: 'Performance', type: 'image', createdAt: '2025-04-10' },
  { id: '2', title: 'Drama Ensemble', imageUrl: '/images/festival/gramakam-02.jpg', year: 2025, category: 'Performance', type: 'image', createdAt: '2025-04-10' },
  { id: '3', title: 'Festival Opening', imageUrl: '/images/festival/gramakam-03.jpg', year: 2025, category: 'Ceremony', type: 'image', createdAt: '2025-04-10' },
  { id: '4', title: 'Audience Moments', imageUrl: '/images/festival/gramakam-04.jpg', year: 2025, category: 'Community', type: 'image', createdAt: '2025-04-10' },
  { id: '5', title: 'Stage Lights', imageUrl: '/images/festival/gramakam-05.jpg', year: 2025, category: 'Performance', type: 'image', createdAt: '2025-04-10' },
  { id: '6', title: 'Backstage Preparations', imageUrl: '/images/festival/gramakam-06.jpg', year: 2025, category: 'Behind the Scenes', type: 'image', createdAt: '2025-04-10' },
  { id: '7', title: 'Cultural Showcase', imageUrl: '/images/festival/gramakam-07.jpg', year: 2025, category: 'Performance', type: 'image', createdAt: '2025-04-10' },
  { id: '8', title: 'Community Gathering', imageUrl: '/images/festival/gramakam-08.jpg', year: 2025, category: 'Community', type: 'image', createdAt: '2025-04-10' },
  { id: '9', title: 'Theatre Workshop', imageUrl: '/images/festival/gramakam-09.jpg', year: 2025, category: 'Workshop', type: 'image', createdAt: '2025-04-10' },
  { id: '10', title: 'Evening Performance', imageUrl: '/images/festival/gramakam-10.jpg', year: 2025, category: 'Performance', type: 'image', createdAt: '2025-04-10' },
  // 2024 edition
  { id: '11', title: 'Opening Night 2024', imageUrl: '/images/festival/gramakam-11.jpg', year: 2024, category: 'Ceremony', type: 'image', createdAt: '2024-04-12' },
  { id: '12', title: 'Street Theatre', imageUrl: '/images/festival/gramakam-12.jpg', year: 2024, category: 'Performance', type: 'image', createdAt: '2024-04-12' },
  { id: '13', title: 'Literary Discussion', imageUrl: '/images/festival/gramakam-13.jpg', year: 2024, category: 'Literature', type: 'image', createdAt: '2024-04-12' },
  { id: '14', title: 'Art Exhibition', imageUrl: '/images/festival/gramakam-14.jpg', year: 2024, category: 'Art', type: 'image', createdAt: '2024-04-12' },
  { id: '15', title: 'Drama Night', imageUrl: '/images/festival/gramakam-15.jpg', year: 2024, category: 'Performance', type: 'image', createdAt: '2024-04-12' },
  { id: '16', title: 'Festival Crowd', imageUrl: '/images/festival/gramakam-16.jpg', year: 2024, category: 'Community', type: 'image', createdAt: '2024-04-12' },
  { id: '17', title: 'Artists Meet', imageUrl: '/images/festival/gramakam-17.jpg', year: 2024, category: 'Workshop', type: 'image', createdAt: '2024-04-12' },
  { id: '18', title: 'Closing Ceremony', imageUrl: '/images/festival/gramakam-18.jpg', year: 2024, category: 'Ceremony', type: 'image', createdAt: '2024-04-12' },
  // Earlier editions
  { id: '19', title: 'Gramakam Beginnings', imageUrl: '/images/festival/gramakam-19.jpg', year: 2023, category: 'Performance', type: 'image', createdAt: '2023-04-15' },
  { id: '20', title: 'Inaugural Performance', imageUrl: '/images/festival/gramakam-20.jpg', year: 2023, category: 'Performance', type: 'image', createdAt: '2023-04-15' },
  { id: '21', title: 'Community Spirit', imageUrl: '/images/festival/gramakam-21.jpg', year: 2023, category: 'Community', type: 'image', createdAt: '2023-04-15' },
  { id: '22', title: 'Stage Moments', imageUrl: '/images/festival/gramakam-22.jpg', year: 2023, category: 'Performance', type: 'image', createdAt: '2023-04-15' },
  { id: '23', title: 'Classic Drama', imageUrl: '/images/festival/gramakam-23.jpg', year: 2023, category: 'Performance', type: 'image', createdAt: '2023-04-15' },
  { id: '24', title: 'Festival Vibes', imageUrl: '/images/festival/gramakam-24.jpg', year: 2023, category: 'Community', type: 'image', createdAt: '2023-04-15' },
];
const fallbackYears = [2025, 2024, 2023];

export default function GalleryClient() {
  const [items, setItems] = useState<GalleryItem[]>(fallbackItems);
  const [years, setYears] = useState<number[]>(fallbackYears);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGallery() {
      try {
        const [fetchedItems, fetchedYears] = await Promise.all([
          getGalleryItems(),
          getGalleryYears(),
        ]);
        if (fetchedItems.length > 0) {
          setItems(fetchedItems);
          setYears(fetchedYears);
        }
      } catch {
        // Firebase not configured — use fallback data
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  return (
    <div className="section-padding bg-white min-h-screen">
      <div className="container-custom">
        <AnimatedSection>
          <div className="text-center mb-10">
            <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-2">
              Festival Memories
            </p>
            <h1 className="heading-xl text-charcoal mb-4">Gallery</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Relive the magic of Gramakam through our collection of photos and
              videos from past editions of the festival.
            </p>
            <div className="w-16 h-0.5 bg-maroon mx-auto mt-6" />
          </div>
        </AnimatedSection>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 mt-4">Loading gallery...</p>
          </div>
        ) : (
          <GalleryGrid items={items} years={years} />
        )}
      </div>
    </div>
  );
}
