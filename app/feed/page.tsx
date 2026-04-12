import { generateOGMetadata } from '@/lib/metadata';
import FeedClient from './FeedClient';

export const metadata = generateOGMetadata({
  title: 'Current Feed | Gramakam',
  description: 'Latest news, updates, and announcements from Gramakam theatre festival.',
  image: '/images/festival/gramakam-01.jpg',
  url: '/feed',
});

export default function FeedPage() {
  return <FeedClient />;
}
