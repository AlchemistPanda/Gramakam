import { Metadata } from 'next';
import { generateOGMetadata } from '@/lib/metadata';
import FeedPostClient from './FeedPostClient';

interface Props {
  params: {
    postId: string;
  };
}

/**
 * Fetch a single post directly from Firestore REST API.
 * This avoids the Firebase client SDK which uses IndexedDB (browser-only).
 */
async function fetchPostFromFirestore(postId: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey) return null;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts/${postId}?key=${apiKey}`;

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return null;

  const doc = await res.json();
  if (!doc.fields) return null;

  // Parse Firestore REST format → plain object
  const fields = doc.fields as Record<string, Record<string, string>>;
  return {
    id: postId,
    title: fields.title?.stringValue || '',
    description: fields.description?.stringValue || '',
    imageUrl: fields.imageUrl?.stringValue || '',
    embedUrl: fields.embedUrl?.stringValue || '',
    date: fields.date?.timestampValue || fields.date?.stringValue || '',
  };
}

// Generate dynamic metadata with OG tags for social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPostFromFirestore(params.postId);

  if (!post || !post.title) {
    return generateOGMetadata({
      title: 'Feed Post | Gramakam',
      description: 'Read the latest updates from Gramakam theatre festival.',
      url: `/feed/${params.postId}`,
    });
  }

  return generateOGMetadata({
    title: `${post.title} | Gramakam`,
    description: post.description.substring(0, 160),
    image: post.imageUrl || '/images/gramakam-logo.png',
    url: `/feed/${params.postId}`,
    type: 'article',
  });
}

// The page itself is rendered client-side for Firebase data
export default function FeedPostPage({ params }: Props) {
  return <FeedPostClient postId={params.postId} />;
}
