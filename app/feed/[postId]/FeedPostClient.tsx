'use client';

import { useState, useEffect } from 'react';
import { Share2, ArrowLeft, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FeedPost } from '@/types';
import { getFeedPosts } from '@/lib/services';
import { formatDate } from '@/lib/utils';

interface FeedPostClientProps {
  postId: string;
}

export default function FeedPostClient({ postId }: FeedPostClientProps) {
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const posts = await getFeedPosts();
        const found = posts.find((p) => p.id === postId) || null;
        setPost(found);
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post) return;

    const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/feed/${post.id}`;
    const shareText = `${post.title} — ${post.description.substring(0, 80)}...`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.title} | Gramakam 2026`,
          text: shareText,
          url: postUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      const encodedUrl = encodeURIComponent(postUrl);
      const encodedText = encodeURIComponent(shareText);
      window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="section-padding bg-cream min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-maroon border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="section-padding bg-cream min-h-screen">
        <div className="container-custom">
          <Link href="/feed" className="inline-flex items-center gap-2 text-maroon transition-colors mb-8">
            <ArrowLeft size={20} />
            Back to Feed
          </Link>
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">Post not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding bg-cream min-h-screen">
      <div className="container-custom">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-maroon hover:text-maroon-dark transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back to Feed
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg overflow-hidden shadow-md max-w-3xl mx-auto"
        >
          {post.imageUrl && (
            <div className="relative w-full aspect-video">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {post.embedUrl && !post.imageUrl && (
            <div className="relative w-full aspect-video">
              <iframe
                src={post.embedUrl}
                className="w-full h-full"
                allowFullScreen
                title={post.title}
              />
            </div>
          )}

          <div className="p-8">
            <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2 text-earth text-sm">
                <Calendar size={16} />
                <time dateTime={typeof post.date === 'string' ? post.date : new Date(post.date).toISOString()}>
                  {formatDate(post.date)}
                </time>
              </div>
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-maroon transition-colors rounded-lg hover:bg-gray-100"
                title="Share this post"
                aria-label="Share"
              >
                <Share2 size={20} />
              </button>
            </div>

            <h1 className="heading-lg text-charcoal mb-4">{post.title}</h1>

            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              <p>{post.description}</p>
            </div>
          </div>
        </motion.article>

        <div className="mt-16 text-center">
          <Link
            href="/feed"
            className="inline-block px-6 py-3 bg-maroon text-white rounded-lg hover:bg-maroon-dark transition-colors"
          >
            View All Posts
          </Link>
        </div>
      </div>
    </div>
  );
}

