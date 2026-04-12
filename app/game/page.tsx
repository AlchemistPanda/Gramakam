import { generateOGMetadata } from '@/lib/metadata';
import GameClient from './GameClient';

export const metadata = generateOGMetadata({
  title: 'Spotlight Game — Gramakam',
  description: 'Tap the spotlights before they fade! A fun mini-game for the Gramakam Theatre Festival.',
  image: '/images/festival/gramakam-11.jpg',
  url: '/game',
});
  return <GameClient />;
}
