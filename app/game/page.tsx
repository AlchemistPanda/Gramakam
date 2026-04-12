import { generateOGMetadata } from '@/lib/metadata';
import GameClient from './GameClient';

export const metadata = generateOGMetadata({
  title: 'Spotlight Game — Gramakam',
  description: 'Tap the spotlights before they fade! A fun mini-game for the Gramakam Theatre Festival.',
  image: '/images/game-og.jpg',
  url: '/game',
});

export default function GamePage() {
  return <GameClient />;
}
