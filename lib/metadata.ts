import type { Metadata } from 'next';

interface OGMetadataOptions {
  title?: string;
  description?: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  url?: string;
  type?: 'website' | 'article';
}

const DEFAULT_BASE_URL = 'https://gramakam.org';
const DEFAULT_IMAGE = '/images/gramakam-logo.png';
const DEFAULT_TITLE = 'Gramakam — A Celebration of Theatre and Culture';
const DEFAULT_DESCRIPTION =
  'An annual theatre and cultural festival in Kerala, India, celebrating theatre, literature, and community.';

/**
 * Generate consistent Open Graph metadata for all pages
 * Ensures proper social media sharing with custom thumbnails
 */
export function generateOGMetadata(options: OGMetadataOptions): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL;
  const imageUrl = options.image || DEFAULT_IMAGE;
  const title = options.title || DEFAULT_TITLE;
  const description = options.description || DEFAULT_DESCRIPTION;
  const imageWidth = options.imageWidth || 1200;
  const imageHeight = options.imageHeight || 630;
  const imageAlt = options.imageAlt || title;
  const type = options.type || 'website';

  // Ensure image URL is absolute
  const absoluteImageUrl = imageUrl.startsWith('http')
    ? imageUrl
    : `${baseUrl}${imageUrl}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type,
      locale: 'en_IN',
      siteName: 'Gramakam',
      url: options.url,
      images: [
        {
          url: absoluteImageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteImageUrl],
    },
  };
}
