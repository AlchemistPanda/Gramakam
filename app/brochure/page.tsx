import type { Metadata } from 'next';
import BrochureClient from './BrochureClient';

export const metadata: Metadata = {
  title: 'Brochure | Gramakam 2026',
  description:
    'Explore the Gramakam 2026 interactive brochure. Flip through pages to discover the complete festival details, lineup, performance schedule, and everything you need to know about the biggest theatre festival in Kerala.',
  openGraph: {
    title: 'Gramakam 2026 Interactive Brochure',
    description: 'Flip through the official Gramakam 2026 brochure with an interactive book experience.',
    type: 'website',
    images: [
      {
        url: '/images/brochure/page-001.png',
        width: 1240,
        height: 1554,
        alt: 'Gramakam 2026 Brochure Cover',
      },
    ],
  },
};

export default function BrochurePage() {
  return <BrochureClient />;
}
