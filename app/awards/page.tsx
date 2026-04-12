import { generateOGMetadata } from '@/lib/metadata';
import AwardsClient from './AwardsClient';

export const metadata = generateOGMetadata({
  title: 'Awards — Gramakam',
  description: 'Gramakam Awards recognizing outstanding contributions to theatre and cultural activities.',
  image: '/images/award.jpg',
  url: '/awards',
});

export default function AwardsPage() {
  return <AwardsClient />;
}
