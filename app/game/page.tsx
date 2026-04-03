import type { Metadata } from 'next';
import GameClient from './GameClient';

export const metadata: Metadata = {
  title: 'Spotlight Game — Gramakam',
  description: 'Tap the spotlights before they fade! A fun mini-game for the Gramakam Theatre Festival.',
};

export default function GamePage() {
  return <GameClient />;
}
