'use client';

import { useState, useEffect } from 'react';
import PostCard from '@/components/PostCard';
import AnimatedSection from '@/components/AnimatedSection';
import { FeedPost } from '@/types';
import { getFeedPosts } from '@/lib/services';

const fallbackPosts: FeedPost[] = [
  { id: '1', title: 'Gramakam 2026 Dates Announced!', description: 'We are thrilled to announce that Gramakam 2026 will be held on April 8, 2026 at Velur, Thrissur. This year promises an even bigger celebration of theatre, literature, and culture. Stay tuned for the full lineup!', imageUrl: '/images/festival/gramakam-25.jpg', date: '2026-01-15', createdAt: '2026-01-15' },
  { id: '2', title: 'Call for Performers', description: 'Gramakam 2026 is inviting theatre groups, solo performers, and cultural collectives to submit their performances. Whether you practice traditional Kerala theatre forms or contemporary drama, we welcome all voices.', imageUrl: '/images/festival/gramakam-27.jpg', date: '2026-01-20', createdAt: '2026-01-20' },
  { id: '3', title: 'Merchandise Now Available for Pre-booking', description: 'Our exclusive Gramakam 2026 merchandise collection is here! From festival t-shirts to keychains and covers — pre-book your favourites before they run out.', imageUrl: '/images/festival/gramakam-29.jpg', date: '2026-02-01', createdAt: '2026-02-01' },
  { id: '4', title: 'Looking Back: Gramakam 2025 Highlights', description: 'Gramakam 2025 was a spectacular celebration of art and community. From powerful stage performances to engaging literary sessions, here is a recap of the best moments from last year.', imageUrl: '/images/festival/gramakam-31.jpg', date: '2025-05-10', createdAt: '2025-05-10' },
];

export default function FeedClient() {
  const [posts, setPosts] = useState<FeedPost[]>(fallbackPosts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        const fetchedPosts = await getFeedPosts();
        if (fetchedPosts.length > 0) {
          setPosts(fetchedPosts);
        }
      } catch {
        // Firebase not configured — use fallback data
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  return (
    <div className="section-padding bg-cream min-h-screen">
      <div className="container-custom">
        <AnimatedSection>
          <div className="text-center mb-10">
            <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-2">
              News & Updates
            </p>
            <h1 className="heading-xl text-charcoal mb-4">Current Feed</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Stay up to date with the latest announcements, behind-the-scenes
              moments, and highlights from Gramakam.
            </p>
            <div className="w-16 h-0.5 bg-maroon mx-auto mt-6" />
          </div>
        </AnimatedSection>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 mt-4">Loading feed...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </div>
            {posts.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg">No posts yet. Check back soon!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
