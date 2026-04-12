import { generateOGMetadata } from '@/lib/metadata';
import MediaClient from './MediaClient';

export const metadata = generateOGMetadata({
  title: 'Media & News — Gramakam',
  description: 'Press coverage, newspaper cuttings, and news links about the Gramakam National Theatre Festival.',
  image: '/images/media_news.jpg',
  url: '/media',
});

export default function MediaPage() {
  return <MediaClient />;
}
