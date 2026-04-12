import { generateOGMetadata } from '@/lib/metadata';
import GalleryClient from './GalleryClient';

export const metadata = generateOGMetadata({
  title: 'Gallery | Gramakam',
  description: 'Explore photos and videos from past Gramakam theatre festival editions.',
  image: '/images/festival/gramakam-03.jpg',
  url: '/gallery',
});

export default function GalleryPage() {
  return <GalleryClient />;
}
