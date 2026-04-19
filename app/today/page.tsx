import type { Metadata } from 'next';
import TodaySchedule from './TodaySchedule';

export const metadata: Metadata = {
  title: "Today at Gramakam 2026",
  description: "Live daily schedule for Gramakam 2026 — plays, ceremonies, talks and more at Velur, Thrissur, Kerala.",
  openGraph: {
    title: "Today at Gramakam 2026",
    description: "Live daily schedule for Gramakam 2026 — plays, ceremonies, talks and more at Velur, Thrissur, Kerala.",
    type: 'website',
    siteName: 'Gramakam',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Today at Gramakam 2026",
    description: "Live daily schedule for Gramakam 2026 — plays, ceremonies, talks and more at Velur, Thrissur, Kerala.",
  },
};

export default function TodayPage() {
  return <TodaySchedule />;
}
