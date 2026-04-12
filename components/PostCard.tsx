'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Share2 } from 'lucide-react';
import { FeedPost } from '@/types';
import { formatDate, truncateText } from '@/lib/utils';

interface PostCardProps {
  post: FeedPost;
  index?: number;
  onClick?: () => void;
}

export default function PostCard({ post, index = 0, onClick }: PostCardProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/feed/${post.id}`;
    const shareText = `Check out this update from Gramakam 2026: "${post.title}" - ${post.description.substring(0, 80)}...`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.title} - Gramakam 2026`,
          text: shareText,
          url: postUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: create share links
      const encodedUrl = encodeURIComponent(postUrl);
      const encodedText = encodeURIComponent(shareText);
      const whatsappUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

      // Copy to clipboard and show alert
      const shareLinks = `WhatsApp: ${whatsappUrl}\n\nTwitter: ${twitterUrl}\n\nFacebook: ${facebookUrl}`;
      navigator.clipboard.writeText(shareLinks);
      alert('Share links copied to clipboard!');
    }
  };

  return (
    <Link href={`/feed/${post.id}`}>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        viewport={{ once: true }}
        className="card group cursor-pointer h-full"
      >
      {/* Image */}
      {post.imageUrl && (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
        </div>
      )}

      {/* Embed */}
      {post.embedUrl && !post.imageUrl && (
        <div className="relative aspect-video">
          <iframe
            src={post.embedUrl}
            className="w-full h-full"
            allowFullScreen
            loading="lazy"
            title={post.title}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-earth text-sm">
            <Calendar size={14} />
            <time dateTime={typeof post.date === 'string' ? post.date : new Date(post.date).toISOString()}>
              {formatDate(post.date)}
            </time>
          </div>
          <button
            onClick={handleShare}
            className="p-1.5 text-gray-400 hover:text-maroon transition-colors rounded-lg hover:bg-gray-100"
            title="Share this post"
            aria-label="Share post"
          >
            <Share2 size={16} />
          </button>
        </div>
        <h3
          className="text-lg font-semibold text-charcoal mb-2 group-hover:text-maroon transition-colors"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {post.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {truncateText(post.description, 150)}
        </p>
        {post.description.length > 150 && (
          <span className="text-maroon text-sm font-medium mt-2 inline-block group-hover:underline">Read more</span>
        )}
      </div>
      </motion.article>
    </Link>
  );
}
