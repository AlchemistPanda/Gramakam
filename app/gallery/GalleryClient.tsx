'use client';

import { useState, useEffect } from 'react';
import GalleryGrid from '@/components/GalleryGrid';
import AnimatedSection from '@/components/AnimatedSection';
import { GalleryItem } from '@/types';
import { getGalleryItems, getGalleryYears } from '@/lib/services';

const fallbackItems: GalleryItem[] = [
  // ── Gramakam 2016 (inaugural edition) ──
  { id: 'a16-1',  title: 'Gramakam 2016 — Festival Moment',       imageUrl: '/images/archive/2016/img_0009.jpg', year: 2016, category: 'Performance',  type: 'image', createdAt: '2016-04-10' },
  { id: 'a16-2',  title: 'Gramakam 2016 — Stage Performance',     imageUrl: '/images/archive/2016/img_0050.jpg', year: 2016, category: 'Performance',  type: 'image', createdAt: '2016-04-10' },
  { id: 'a16-3',  title: 'Gramakam 2016 — Community Gathering',   imageUrl: '/images/archive/2016/img_0095.jpg', year: 2016, category: 'Community',    type: 'image', createdAt: '2016-04-10' },
  { id: 'a16-4',  title: 'Gramakam 2016 — Cultural Event',        imageUrl: '/images/archive/2016/img_0103.jpg', year: 2016, category: 'Ceremony',     type: 'image', createdAt: '2016-04-10' },
  { id: 'a16-5',  title: 'Gramakam 2016 — Theatre Arts',          imageUrl: '/images/archive/2016/img_0110.jpg', year: 2016, category: 'Performance',  type: 'image', createdAt: '2016-04-11' },
  { id: 'a16-6',  title: 'Gramakam 2016 — Festival Scene',        imageUrl: '/images/archive/2016/img_0115.jpg', year: 2016, category: 'Performance',  type: 'image', createdAt: '2016-04-11' },
  { id: 'a16-7',  title: 'Gramakam 2016 — Drama on Stage',        imageUrl: '/images/archive/2016/img_0130.jpg', year: 2016, category: 'Performance',  type: 'image', createdAt: '2016-04-11' },
  { id: 'a16-8',  title: 'Gramakam 2016 — Evening Performance',   imageUrl: '/images/archive/2016/img_0149.jpg', year: 2016, category: 'Performance',  type: 'image', createdAt: '2016-04-12' },
  { id: 'a16-9',  title: 'Gramakam 2016 — Audience Moments',      imageUrl: '/images/archive/2016/img_0158.jpg', year: 2016, category: 'Community',    type: 'image', createdAt: '2016-04-12' },
  { id: 'a16-10', title: 'Gramakam 2016 — Closing Night',         imageUrl: '/images/archive/2016/img_0176.jpg', year: 2016, category: 'Ceremony',     type: 'image', createdAt: '2016-04-12' },

  // ── Gramakam 2017 ──
  { id: 'a17-1',  title: 'Gramakam 2017 — Stage Performance',     imageUrl: '/images/archive/2017/img_5270.jpg', year: 2017, category: 'Performance',  type: 'image', createdAt: '2017-04-10' },
  { id: 'a17-2',  title: 'Gramakam 2017 — Theatre Arts',          imageUrl: '/images/archive/2017/img_4699.jpg', year: 2017, category: 'Performance',  type: 'image', createdAt: '2017-04-10' },
  { id: 'a17-3',  title: 'Gramakam 2017 — Festival Gathering',    imageUrl: '/images/archive/2017/img_0072.jpg', year: 2017, category: 'Community',    type: 'image', createdAt: '2017-04-10' },
  { id: 'a17-4',  title: 'Gramakam 2017 — Drama Performance',     imageUrl: '/images/archive/2017/img_4653.jpg', year: 2017, category: 'Performance',  type: 'image', createdAt: '2017-04-11' },
  { id: 'a17-5',  title: 'Gramakam 2017 — Cultural Show',         imageUrl: '/images/archive/2017/img_5395.jpg', year: 2017, category: 'Performance',  type: 'image', createdAt: '2017-04-11' },
  { id: 'a17-6',  title: 'Gramakam 2017 — Evening Scene',         imageUrl: '/images/archive/2017/img_5358.jpg', year: 2017, category: 'Performance',  type: 'image', createdAt: '2017-04-11' },
  { id: 'a17-7',  title: 'Gramakam 2017 — Stage Moments',         imageUrl: '/images/archive/2017/img_5404.jpg', year: 2017, category: 'Performance',  type: 'image', createdAt: '2017-04-12' },
  { id: 'a17-8',  title: 'Gramakam 2017 — Festival Finale',       imageUrl: '/images/archive/2017/img_5402.jpg', year: 2017, category: 'Ceremony',     type: 'image', createdAt: '2017-04-12' },
  { id: 'a17-9',  title: 'Gramakam 2017 — Workshop Session',      imageUrl: '/images/archive/2017/img_5288.jpg', year: 2017, category: 'Workshop',     type: 'image', createdAt: '2017-04-10' },
  { id: 'a17-10', title: 'Gramakam 2017 — Behind the Scenes',     imageUrl: '/images/archive/2017/img_5282.jpg', year: 2017, category: 'Behind the Scenes', type: 'image', createdAt: '2017-04-10' },
  { id: 'a17-11', title: 'Gramakam 2017 — Backstage',             imageUrl: '/images/archive/2017/img_4812.jpg', year: 2017, category: 'Behind the Scenes', type: 'image', createdAt: '2017-04-11' },
  { id: 'a17-12', title: 'Gramakam 2017 — Artists at Work',       imageUrl: '/images/archive/2017/img_5133.jpg', year: 2017, category: 'Workshop',     type: 'image', createdAt: '2017-04-11' },
  { id: 'a17-13', title: 'Gramakam 2017 — Community Spirit',      imageUrl: '/images/archive/2017/img_5126.jpg', year: 2017, category: 'Community',    type: 'image', createdAt: '2017-04-12' },
  { id: 'a17-14', title: 'Gramakam 2017 — Opening Night',         imageUrl: '/images/archive/2017/img_5101.jpg', year: 2017, category: 'Ceremony',     type: 'image', createdAt: '2017-04-09' },

  // ── Gramakam 2018 ──
  { id: 'a18-1',  title: 'Gramakam 2018 — Festival Performance',  imageUrl: '/images/archive/2018/28058720_775055232691655_6966281045718395530_n.jpg', year: 2018, category: 'Performance',  type: 'image', createdAt: '2018-04-07' },
  { id: 'a18-2',  title: 'Gramakam 2018 — Stage Drama',           imageUrl: '/images/archive/2018/28166248_775055319358313_6085606736929321343_n.jpg', year: 2018, category: 'Performance',  type: 'image', createdAt: '2018-04-07' },
  { id: 'a18-3',  title: 'Gramakam 2018 — Cultural Event',        imageUrl: '/images/archive/2018/28166303_1987737631239795_4105687573656303939_n.jpg', year: 2018, category: 'Ceremony',     type: 'image', createdAt: '2018-04-08' },
  { id: 'a18-4',  title: 'Gramakam 2018 — Theatre Arts',          imageUrl: '/images/archive/2018/28166660_1987737744573117_8783068195989532978_n.jpg', year: 2018, category: 'Performance',  type: 'image', createdAt: '2018-04-08' },
  { id: 'a18-5',  title: 'Gramakam 2018 — Community Moment',      imageUrl: '/images/archive/2018/28167286_775055436024968_2844618791679476428_n.jpg', year: 2018, category: 'Community',    type: 'image', createdAt: '2018-04-09' },
  { id: 'a18-6',  title: 'Gramakam 2018 — Audience',              imageUrl: '/images/archive/2018/28276743_775055126024999_8257317321838956998_n.jpg', year: 2018, category: 'Community',    type: 'image', createdAt: '2018-04-09' },
  { id: 'a18-7',  title: 'Gramakam 2018 — Drama Scene',           imageUrl: '/images/archive/2018/27867306_1987737734573118_7876097761777348687_n.jpg', year: 2018, category: 'Performance',  type: 'image', createdAt: '2018-04-09' },
  { id: 'a18-8',  title: 'Gramakam 2018 — Evening Show',          imageUrl: '/images/archive/2018/27973259_1987736477906577_3948157211369445839_n.jpg', year: 2018, category: 'Performance',  type: 'image', createdAt: '2018-04-10' },
  { id: 'a18-9',  title: 'Gramakam 2018 — Festival Scene',        imageUrl: '/images/archive/2018/27972384_775055279358317_8770405322238235323_n.jpg', year: 2018, category: 'Performance',  type: 'image', createdAt: '2018-04-10' },
  { id: 'a18-10', title: 'Gramakam 2018 — Backstage',             imageUrl: '/images/archive/2018/28056524_735933449951269_3797917077129701159_n.jpg', year: 2018, category: 'Behind the Scenes', type: 'image', createdAt: '2018-04-10' },
  { id: 'a18-11', title: 'Gramakam 2018 — Workshop',              imageUrl: '/images/archive/2018/27971551_775054812691697_1239931995052317970_n.jpg', year: 2018, category: 'Workshop',     type: 'image', createdAt: '2018-04-11' },
  { id: 'a18-12', title: 'Gramakam 2018 — Closing Night',         imageUrl: '/images/archive/2018/28055661_775055532691625_4696393427297220956_n.jpg', year: 2018, category: 'Ceremony',     type: 'image', createdAt: '2018-04-11' },
];
const fallbackYears = [2018, 2017, 2016];

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
