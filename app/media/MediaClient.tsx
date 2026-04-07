'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AnimatedSection from '@/components/AnimatedSection';
import { getMediaItems } from '@/lib/services';
import type { MediaItem } from '@/types';
import { Newspaper, ExternalLink, X, ChevronLeft, ChevronRight, Calendar, BookOpen } from 'lucide-react';

// Press coverage scraped from the old IF Creations site
const staticMediaItems: MediaItem[] = [
  { id: 's1',  type: 'newspaper', title: 'Gramakam 2019 — Press Coverage',         source: 'Press', year: 2019, date: '2019-05-11', imageUrl: '/images/media/img-20190511-wa0001.jpg',                    createdAt: '2019-05-11' },
  { id: 's2',  type: 'newspaper', title: 'Gramakam 2019 — Festival News',           source: 'Press', year: 2019, date: '2019-04-13', imageUrl: '/images/media/img-20190413-wa0006.jpg',                    createdAt: '2019-04-13' },
  { id: 's3',  type: 'newspaper', title: 'Gramakam 2019 — Media Coverage',          source: 'Press', year: 2019, date: '2019-04-12', imageUrl: '/images/media/img-20190412-wa0086.jpg',                    createdAt: '2019-04-12' },
  { id: 's4',  type: 'newspaper', title: 'Gramakam 2019 — Festival Report',         source: 'Press', year: 2019, date: '2019-04-11', imageUrl: '/images/media/img-20190411-wa0001.jpg',                    createdAt: '2019-04-11' },
  { id: 's5',  type: 'newspaper', title: 'Gramakam 2019 — Day 3 Coverage',          source: 'Press', year: 2019, date: '2019-04-10', imageUrl: '/images/media/img-20190410-wa0021.jpg',                    createdAt: '2019-04-10' },
  { id: 's6',  type: 'newspaper', title: 'Gramakam 2019 — Festival Announcement',   source: 'Press', year: 2019, date: '2019-01-07', imageUrl: '/images/media/img-20190107-wa0082.jpg',                    createdAt: '2019-01-07' },
  { id: 's7',  type: 'newspaper', title: 'Gramakam 2019 — Event Preview',           source: 'Press', year: 2019, date: '2019-01-07', imageUrl: '/images/media/img-20190107-wa0007.jpg',                    createdAt: '2019-01-07' },
  { id: 's8',  type: 'newspaper', title: 'Gramakam 2019 — Programme Notice',        source: 'Press', year: 2019, date: '2019-02-19', imageUrl: '/images/media/img-20190219-wa0010.jpg',                    createdAt: '2019-02-19' },
  { id: 's9',  type: 'newspaper', title: 'Gramakam 2019 — Pre-festival Coverage',   source: 'Press', year: 2019, date: '2019-04-15', imageUrl: '/images/media/img-20190415-wa0047.jpg',                    createdAt: '2019-04-15' },
  { id: 's10', type: 'newspaper', title: 'Gramakam 2018 — Press Release',           source: 'Press', year: 2018, date: '2018-04-10', imageUrl: '/images/media/img-20180410-wa0069-copy-e1587991050103.jpg', createdAt: '2018-04-10' },
  { id: 's11', type: 'newspaper', title: 'Gramakam 2018 — Festival Coverage',       source: 'Press', year: 2018, date: '2018-04-06', imageUrl: '/images/media/20180406_075719-e1587990421722.jpg',          createdAt: '2018-04-06' },
  { id: 's12', type: 'newspaper', title: 'Gramakam 2018 — Year-End Report',         source: 'Press', year: 2018, date: '2018-12-31', imageUrl: '/images/media/img-20181231-wa0001-e1587994265617.jpg',      createdAt: '2018-12-31' },
  { id: 's13', type: 'newspaper', title: 'Gramakam 2018 — Post-festival Report',    source: 'Press', year: 2018, date: '2018-09-08', imageUrl: '/images/media/img-20180908-wa0000-e1587991192973.jpg',      createdAt: '2018-09-08' },
  { id: 's14', type: 'newspaper', title: 'Gramakam 2019 — Morning News',            source: 'Press', year: 2019, date: '2019-04-09', imageUrl: '/images/media/20190409_063133-e1587990860337.jpg',          createdAt: '2019-04-09' },
  { id: 's15', type: 'link', title: 'Gramakam — IF Creations Facebook Page',        source: 'Facebook', year: 2019, date: '2019-04-01', linkUrl: 'https://www.facebook.com/graamakam', createdAt: '2019-04-01' },
];

export default function MediaClient() {
  const [items, setItems] = useState<MediaItem[]>(staticMediaItems);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<'all' | 'newspaper' | 'link'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    getMediaItems()
      .then((data) => {
        // Merge Firestore items with static ones (Firestore takes precedence, shown first)
        if (data.length > 0) setItems([...data, ...staticMediaItems]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const years = [...new Set(items.map((i) => i.year))].sort((a, b) => b - a);

  const filtered = items.filter((item) => {
    if (filterYear !== 'all' && item.year !== filterYear) return false;
    if (filterType !== 'all' && item.type !== filterType) return false;
    return true;
  });

  // Only newspaper items (have images) for lightbox
  const imageItems = filtered.filter((i) => i.type === 'newspaper' && i.imageUrl);
  const imageIndexOf = (item: MediaItem) => imageItems.findIndex((i) => i.id === item.id);

  const openLightbox = (item: MediaItem) => {
    const idx = imageIndexOf(item);
    if (idx !== -1) setLightboxIndex(idx);
  };

  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => setLightboxIndex((i) => (i !== null ? Math.max(0, i - 1) : null));
  const nextImage = () => setLightboxIndex((i) => (i !== null ? Math.min(imageItems.length - 1, i + 1) : null));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-charcoal text-white pt-28 pb-16">
        <div className="container-custom">
          <AnimatedSection>
            <p className="text-white/50 uppercase tracking-widest text-xs mb-3">Press &amp; Coverage</p>
            <h1
              className="text-4xl md:text-5xl font-bold text-cream mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Media &amp; News
            </h1>
            <p className="text-gray-400 max-w-xl">
              Newspaper cuttings, articles, and press coverage of the Gramakam National Theatre Festival.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-16 md:top-20 z-30">
        <div className="container-custom py-3 flex flex-wrap items-center gap-3">
          {/* Type filter */}
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            {(['all', 'newspaper', 'link'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterType === t ? 'bg-maroon text-white' : 'text-gray-600 hover:text-charcoal'
                }`}
              >
                {t === 'all' ? 'All' : t === 'newspaper' ? 'Newspaper' : 'News Links'}
              </button>
            ))}
          </div>

          {/* Year filter */}
          {years.length > 0 && (
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 flex-wrap">
              <button
                onClick={() => setFilterYear('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterYear === 'all' ? 'bg-maroon text-white' : 'text-gray-600 hover:text-charcoal'
                }`}
              >
                All Years
              </button>
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setFilterYear(y)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filterYear === y ? 'bg-maroon text-white' : 'text-gray-600 hover:text-charcoal'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="container-custom py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-maroon border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <AnimatedSection>
            <div className="text-center py-20">
              <BookOpen size={56} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-charcoal mb-2">No media items yet</h3>
              <p className="text-gray-500 text-sm">
                Press coverage and newspaper cuttings will appear here once uploaded.
              </p>
            </div>
          </AnimatedSection>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <AnimatedSection key={item.id}>
                {item.type === 'newspaper' ? (
                  <NewspaperCard item={item} onClick={() => openLightbox(item)} />
                ) : (
                  <LinkCard item={item} />
                )}
              </AnimatedSection>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && imageItems[lightboxIndex] && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={28} />
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 text-white/70 hover:text-white transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={40} />
            </button>
          )}

          <div
            className="relative max-w-3xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={imageItems[lightboxIndex].imageUrl!}
              alt={imageItems[lightboxIndex].title}
              width={900}
              height={1200}
              className="object-contain max-h-[75vh] mx-auto rounded-lg"
            />
            <div className="text-center mt-4">
              <p className="text-white font-medium">{imageItems[lightboxIndex].title}</p>
              {imageItems[lightboxIndex].source && (
                <p className="text-white/60 text-sm">{imageItems[lightboxIndex].source} · {imageItems[lightboxIndex].year}</p>
              )}
            </div>
          </div>

          {lightboxIndex < imageItems.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 text-white/70 hover:text-white transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={40} />
            </button>
          )}

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-sm">
            {lightboxIndex + 1} / {imageItems.length}
          </p>
        </div>
      )}
    </div>
  );
}

function NewspaperCard({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:border-maroon/30 transition-all group"
    >
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Newspaper size={48} className="text-gray-300" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-charcoal/80 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
            <Newspaper size={11} /> Newspaper
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-charcoal text-sm leading-snug group-hover:text-maroon transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          {item.source && <span>{item.source}</span>}
          <span className="flex items-center gap-1"><Calendar size={11} /> {item.year}</span>
        </div>
        {item.description && (
          <p className="text-gray-500 text-xs mt-2 line-clamp-2">{item.description}</p>
        )}
      </div>
    </button>
  );
}

function LinkCard({ item }: { item: MediaItem }) {
  return (
    <a
      href={item.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-maroon/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
          <ExternalLink size={18} className="text-blue-500" />
        </div>
        <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-full font-medium">
          News Link
        </span>
      </div>
      <h3 className="font-semibold text-charcoal text-sm leading-snug group-hover:text-maroon transition-colors mb-2">
        {item.title}
      </h3>
      {item.description && (
        <p className="text-gray-500 text-xs mb-3 line-clamp-3">{item.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        {item.source && <span className="font-medium text-gray-500">{item.source}</span>}
        <span className="flex items-center gap-1"><Calendar size={11} /> {item.year}</span>
      </div>
    </a>
  );
}
