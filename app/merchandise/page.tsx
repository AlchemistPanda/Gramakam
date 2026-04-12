import { generateOGMetadata } from '@/lib/metadata';
import MerchandiseClient from './MerchandiseClient';

export const metadata = generateOGMetadata({
  title: 'Exclusive Merchandise | Gramakam 2026',
  description: 'Pre-book exclusive Gramakam 2026 merchandise including festival t-shirts, hoodies, accessories, and more. Limited edition items available.',
  image: '/images/festival/gramakam-09.jpg',
  url: '/merchandise',
});

export default function MerchandisePage() {
  return <MerchandiseClient />;
}
