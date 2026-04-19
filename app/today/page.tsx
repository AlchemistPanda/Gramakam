import type { Metadata } from 'next';
import TodaySchedule from './TodaySchedule';

export const metadata: Metadata = {
  title: "Today at Gramakam 2026",
  description: "Live schedule for today's events at Gramakam 2026 — plays, ceremonies, and more at Velur, Thrissur.",
};

export default function TodayPage() {
  return <TodaySchedule />;
}
