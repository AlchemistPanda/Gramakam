import type { Metadata } from 'next';
import ProfileFrameGenerator from './ProfileFrameGenerator';

export const metadata: Metadata = {
  title: 'Profile Frame Generator — Gramakam 2026',
  description:
    'Create your Gramakam 2026 festival profile picture frame. Upload your photo, add the official Gramakam frame, and download it — optimized for Instagram, WhatsApp & Facebook. Your photo never leaves your device.',
  openGraph: {
    title: 'Create Your Gramakam 2026 Profile Frame',
    description:
      'Add the official Gramakam 2026 festival frame to your profile picture. Optimized for all social media platforms.',
    type: 'website',
    images: [
      {
        url: '/images/gramakam-logo.png',
        width: 1200,
        height: 630,
        alt: 'Gramakam 2026 Profile Frame Generator',
      },
    ],
  },
};

export default function ProfileFramePage() {
  return <ProfileFrameGenerator />;
}
