import type { Metadata } from 'next';
import MediaClient from './MediaClient';

export const metadata: Metadata = {
  title: 'Media & News — Gramakam',
  description: 'Press coverage, newspaper cuttings, and news links about the Gramakam National Theatre Festival.',
};

export default function MediaPage() {
  return <MediaClient />;
}
