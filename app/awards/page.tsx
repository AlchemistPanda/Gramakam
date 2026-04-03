import type { Metadata } from 'next';
import AwardsClient from './AwardsClient';

export const metadata: Metadata = {
  title: 'Awards — Gramakam',
  description: 'Gramakam Awards recognizing outstanding contributions to theatre and cultural activities.',
};

export default function AwardsPage() {
  return <AwardsClient />;
}
