'use client';

import { useEffect, useState } from 'react';
import Countdown from './Countdown';

const FALLBACK_DATE = '2026-04-18T00:00:00+05:30';

function formatDisplayDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export default function CountdownSection() {
  const [targetDate, setTargetDate] = useState(FALLBACK_DATE);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        if (data?.countdownDate) setTargetDate(data.countdownDate);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <p className="text-gray-600 mb-10">{formatDisplayDate(targetDate)} &middot; Velur, Thrissur, Kerala</p>
      <Countdown targetDate={targetDate} />
    </>
  );
}
