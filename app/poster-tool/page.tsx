import { generateOGMetadata } from '@/lib/metadata';
import PosterToolClient from './PosterToolClient';

export const metadata = generateOGMetadata({
  title: 'AI Poster Generator | Gramakam 2026',
  description: 'Create stunning AI-generated event posters for Gramakam using our poster tool. Design custom promotional materials for the festival.',
  image: '/images/festival/gramakam-05.jpg',
  url: '/poster-tool',
});

export default function PosterToolPage() {
  return <PosterToolClient />;
}
