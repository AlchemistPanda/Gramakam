import { Metadata } from 'next';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import { FeedPost } from '@/types';
import { getFeedPosts } from '@/lib/services';
import { formatDate } from '@/lib/utils';
import { generateOGMetadata } from '@/lib/metadata';
import FeedPostClient from './FeedPostClient';

interface Props {
  params: {
    postId: string;
  };
}

// Generate dynamic metadata with OG tags for social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const posts = await getFeedPosts();
    const post = posts.find((p) => p.id === params.postId);

    if (!post) {
      return generateOGMetadata({
        title: 'Post Not Found | Gramakam',
        description: 'This feed post could not be found.',
        url: `/feed/${params.postId}`,
      });
    }

    const description = post.description.substring(0, 160);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gramakam.org';

    return generateOGMetadata({
      title: `${post.title} | Gramakam`,
      description,
      image: post.imageUrl || '/images/gramakam-logo.png',
      url: `/feed/${post.id}`,
      type: 'article',
    });
  } catch (error) {
    return generateOGMetadata({
      title: 'Feed Post | Gramakam',
      description: 'Read this update from Gramakam theatre festival.',
      url: `/feed/${params.postId}`,
    });
  }
}

export default async function FeedPostPage({ params }: Props) {
  let post: FeedPost | null = null;

  try {
    const posts = await getFeedPosts();
    post = posts.find((p) => p.id === params.postId) || null;
  } catch {
    post = null;
  }

  if (!post) {
    return (
      <div className="section-padding bg-cream min-h-screen">
        <div className="container-custom">
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 text-maroon hover:text-maroon-dark mb-8"
          >
            <ArrowLeft size={20} />
            Back to Feed
          </Link>
          <div className="text-center py-16">
            <p className="text-lg text-gray-500">Post not found</p>
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
          {/* Featured Image */}
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

          {/* Embed Content */}
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

          {/* Content */}
          <div className="p-8">
            {/* Meta */}
            <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2 text-earth text-sm">
                <Calendar size={16} />
                <time dateTime={typeof post.date === 'string' ? post.date : new Date(post.date).toISOString()}>
                  {formatDate(post.date)}
                </time>
              </div>
              <FeedPostClient post={post} />
            </div>

            {/* Title */}
            <h1 className="heading-lg text-charcoal mb-4">{post.title}</h1>

            {/* Description */}
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              <p>{post.description}</p>
            </div>
          </div>
        </motion.article>

        {/* Related Posts Teaser */}
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
