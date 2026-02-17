'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Calendar } from 'lucide-react';
import PostCard from '@/components/PostCard';
import AnimatedSection from '@/components/AnimatedSection';
import { FeedPost } from '@/types';
import { getFeedPosts } from '@/lib/services';
import { formatDate } from '@/lib/utils';

const fallbackPosts: FeedPost[] = [
  { id: '1', title: 'Gramakam 2026 Dates Announced!', description: 'We are thrilled to announce that Gramakam 2026 will be held on April 8, 2026 at Velur, Thrissur. This year promises an even bigger celebration of theatre, literature, and culture. Stay tuned for the full lineup!', imageUrl: '/images/festival/gramakam-25.jpg', date: '2026-01-15', createdAt: '2026-01-15' },
  { id: '2', title: 'Call for Performers', description: 'Gramakam 2026 is inviting theatre groups, solo performers, and cultural collectives to submit their performances. Whether you practice traditional Kerala theatre forms or contemporary drama, we welcome all voices.', imageUrl: '/images/festival/gramakam-27.jpg', date: '2026-01-20', createdAt: '2026-01-20' },
  { id: '3', title: 'Merchandise Now Available for Pre-booking', description: 'Our exclusive Gramakam 2026 merchandise collection is here! From festival t-shirts to keychains and covers — pre-book your favourites before they run out.', imageUrl: '/images/festival/gramakam-29.jpg', date: '2026-02-01', createdAt: '2026-02-01' },
  { id: '4', title: 'Looking Back: Gramakam 2025 Highlights', description: 'Gramakam 2025 was a spectacular celebration of art and community. From powerful stage performances to engaging literary sessions, here is a recap of the best moments from last year.', imageUrl: '/images/festival/gramakam-31.jpg', date: '2025-05-10', createdAt: '2025-05-10' },
];

export default function FeedClient() {
  const [posts, setPosts] = useState<FeedPost[]>(fallbackPosts);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);

  useEffect(() => {
    async function loadPosts() {
      try {
        const fetchedPosts = await getFeedPosts();
        if (fetchedPosts.length > 0) {
          // Sort by date descending (newest first)
          const sorted = [...fetchedPosts].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
          });
          setPosts(sorted);
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
                <PostCard key={post.id} post={post} index={index} onClick={() => setSelectedPost(post)} />
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

      {/* Full Post Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {selectedPost.imageUrl && (
                <div className="relative aspect-video w-full">
                  <Image
                    src={selectedPost.imageUrl}
                    alt={selectedPost.title}
                    fill
                    className="object-cover rounded-t-2xl"
                    sizes="(max-width: 768px) 100vw, 672px"
                  />
                </div>
              )}
              {selectedPost.embedUrl && !selectedPost.imageUrl && (
                <div className="relative aspect-video w-full">
                  <iframe
                    src={selectedPost.embedUrl}
                    className="w-full h-full rounded-t-2xl"
                    allowFullScreen
                    title={selectedPost.title}
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-earth text-sm">
                    <Calendar size={14} />
                    <time>{formatDate(selectedPost.date)}</time>
                  </div>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-2 text-gray-400 hover:text-charcoal transition-colors rounded-full hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>
                <h2
                  className="text-2xl font-bold text-charcoal mb-4"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {selectedPost.title}
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {selectedPost.description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
