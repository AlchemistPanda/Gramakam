'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { FeedPost } from '@/types';
import { formatDate, truncateText } from '@/lib/utils';

interface PostCardProps {
  post: FeedPost;
  index?: number;
  onClick?: () => void;
}

export default function PostCard({ post, index = 0, onClick }: PostCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="card group cursor-pointer"
      onClick={onClick}
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
        <div className="flex items-center gap-2 text-earth text-sm mb-2">
          <Calendar size={14} />
          <time dateTime={typeof post.date === 'string' ? post.date : new Date(post.date).toISOString()}>
            {formatDate(post.date)}
          </time>
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
  );
}
