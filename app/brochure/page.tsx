import { generateOGMetadata } from '@/lib/metadata';
import BrochureClient from './BrochureClient';

export const metadata = generateOGMetadata({
  title: 'Digital Brochure | Gramakam 2026',
  description:
    'Explore the Gramakam 2026 interactive brochure. Flip through pages to discover the complete festival details, lineup, performance schedule, and everything you need to know about the biggest theatre festival in Kerala.',
  image: '/images/brochure/page-001.png',
  imageWidth: 1240,
  imageHeight: 1554,
  imageAlt: 'Gramakam 2026 Brochure Cover',
  url: '/brochure',
});

export default function BrochurePage() {
  return <BrochureClient />;
}
