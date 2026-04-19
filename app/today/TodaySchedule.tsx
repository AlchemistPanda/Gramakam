'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Star, Mic2, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { getFestivalSchedule } from '@/lib/services';
import type { FestivalDaySchedule, FestivalEvent, FestivalEventType } from '@/types';

// ─── Hardcoded fallback (used if Firestore is unreachable) ────────────────────

const FALLBACK: FestivalDaySchedule[] = [
  {
    dateKey: '2026-04-18', day: 1, label: 'Day 1 — Inauguration', date: 'Saturday, April 18',
    events: [
      { time: '9:00 AM', type: 'workshop', title: "Children's Theatre Workshop", note: 'Inauguration · Govt. RSRVHSS Velur · Facilitated by Nisheent Master' },
      { time: '6:00 PM', type: 'ceremony', title: 'Inauguration Ceremony', titleMl: 'ഉദ്ഘാടനസദസ്സ്', note: 'Chief Guest: Prof. V.I. Madhusoodanan Nair (Prominent Poet)\nDistinguished guests: Smt. Mary George · Sri. Premennan · Smt. Pushpavalli Karpagasham' },
      { time: '7:30 PM', type: 'play', title: 'Tantu Laavanam', titleMl: 'തന്തു ലാവണം', group: 'Free Live Theatre Collective (Trinare)', note: 'Script: Yusupettan · Direction: KS Prathapan' },
    ],
  },
  {
    dateKey: '2026-04-19', day: 2, label: 'Day 2', date: 'Sunday, April 19',
    events: [
      { time: '6:30 PM', type: 'talk', title: 'Play Introduction', note: 'Speaker: Vijeesh Anguseenam (Theatre Practitioner)' },
      { time: '7:00 PM', type: 'play', title: 'Verumaadikulam', titleMl: 'വെറുമാടിക്കൂലം' },
    ],
  },
  {
    dateKey: '2026-04-20', day: 3, label: 'Day 3', date: 'Monday, April 20',
    events: [
      { time: '6:30 PM', type: 'talk', title: 'Play Introduction' },
      { time: '7:00 PM', type: 'play', title: 'Lenaril', titleMl: 'ലേനറിൽ', group: 'Santhekal Kilakootur Aavarthikkunna Santheeranyudara' },
    ],
  },
  {
    dateKey: '2026-04-21', day: 4, label: 'Day 4', date: 'Tuesday, April 21',
    events: [
      { time: '6:00 PM', type: 'talk', title: 'Theatre Talk', note: 'Speaker: Dr. V.K. Anilkumar (Kerala Sahitya Academy)' },
      { time: '6:30 PM', type: 'play', title: 'Chaav Saakyam', titleMl: 'ചാവ് സാക്ഷ്യം', note: 'Directors: Aneesh Aloor & Naveen Payan · Script: Babu Vylathoor' },
      { time: '7:30 PM', type: 'play', title: 'KOOHOO', titleMl: 'An Anthology on Rails', group: 'Little Earth School of Theatre', note: 'Direction: Arun Lal · Presented by Prakash Raj' },
    ],
  },
  {
    dateKey: '2026-04-22', day: 5, label: 'Day 5 — Closing', date: 'Wednesday, April 22',
    events: [
      { time: '6:00 PM', type: 'ceremony', title: 'Closing Ceremony & Gramakam Award', titleMl: 'സമാപനസദസ്സ്', note: 'Chief Guest: Prof. K.V. Ramakrishnan\nPresided by: Pampiri Mathanur Thakarantkutty (Deputy Chairman, Kerala Sahitya Naaka Academy)' },
      { time: '7:30 PM', type: 'play', title: "N'Lanil Bolo... Karupinothe", titleMl: 'ന്ൾനില ബോലോ... കരിഞ്ഞ', note: 'Director: Aliyar Ali' },
    ],
  },
];

const FESTIVAL_START = '2026-04-18';
const FESTIVAL_END   = '2026-04-22';

// ─── Utilities ────────────────────────────────────────────────────────────────

function getISTDateString(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now).split('-');
  return `${parts[0]}-${parts[1]}-${parts[2]}`;
}

function addDays(dateStr: string, n: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + n));
  return d.toISOString().slice(0, 10);
}

// ─── Event type config ────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<FestivalEventType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ceremony: { label: 'Ceremony', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200',   icon: Trophy    },
  play:     { label: 'Play',     color: 'text-maroon',    bg: 'bg-maroon/5 border-maroon/20',   icon: Star      },
  talk:     { label: 'Talk',     color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200',     icon: Mic2      },
  workshop: { label: 'Workshop', color: 'text-green-700', bg: 'bg-green-50 border-green-200',   icon: Sparkles  },
};

// ─── Components ───────────────────────────────────────────────────────────────

function EventCard({ event, featured = false }: { event: FestivalEvent; featured?: boolean }) {
  const cfg = TYPE_CONFIG[event.type];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl border p-5 ${featured ? 'shadow-md' : 'shadow-sm'} ${cfg.bg}`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0 text-center min-w-[60px]">
          <Clock size={13} className={`${cfg.color} mx-auto mb-1`} />
          <span className={`text-xs font-bold ${cfg.color}`}>{event.time}</span>
        </div>
        <div className={`w-px self-stretch ${cfg.color} opacity-30`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.color}`}>
              <Icon size={10} /> {cfg.label}
            </span>
          </div>
          <h3 className={`font-bold text-charcoal leading-snug ${featured ? 'text-xl' : 'text-base'}`}>
            {event.title}
          </h3>
          {event.titleMl && <p className="text-gray-500 text-sm mt-0.5">{event.titleMl}</p>}
          {event.group  && <p className={`text-sm font-medium mt-1 ${cfg.color}`}>{event.group}</p>}
          {event.note   && <p className="text-gray-600 text-xs mt-2 leading-relaxed whitespace-pre-line">{event.note}</p>}
        </div>
      </div>
    </div>
  );
}

function DaySection({ schedule, title, dimmed = false }: { schedule: FestivalDaySchedule; title: string; dimmed?: boolean }) {
  return (
    <section className={dimmed ? 'opacity-70' : ''}>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-maroon mb-0.5">{title}</p>
        <h2 className="text-2xl font-bold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>
          {schedule.label}
        </h2>
        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
          <Calendar size={13} /> {schedule.date} &middot; Velur, Thrissur
        </p>
      </div>
      <div className="space-y-3">
        {schedule.events.map((event, i) => (
          <EventCard key={i} event={event} featured={!dimmed && event.type === 'play'} />
        ))}
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TodaySchedule() {
  const [todayKey, setTodayKey] = useState<string>(() => getISTDateString());
  const [scheduleMap, setScheduleMap] = useState<Record<string, FestivalDaySchedule>>({});
  const [fetchDone, setFetchDone] = useState(false);

  // Fetch Firestore schedule once on mount
  useEffect(() => {
    getFestivalSchedule()
      .then((days) => {
        const map: Record<string, FestivalDaySchedule> = {};
        const source = days.length > 0 ? days : FALLBACK;
        source.forEach((d) => { map[d.dateKey] = d; });
        setScheduleMap(map);
      })
      .catch(() => {
        const map: Record<string, FestivalDaySchedule> = {};
        FALLBACK.forEach((d) => { map[d.dateKey] = d; });
        setScheduleMap(map);
      })
      .finally(() => setFetchDone(true));
  }, []);

  // Re-check date every minute to flip at midnight IST
  useEffect(() => {
    const id = setInterval(() => setTodayKey(getISTDateString()), 60_000);
    return () => clearInterval(id);
  }, []);

  const tomorrowKey     = addDays(todayKey, 1);
  const todaySchedule   = scheduleMap[todayKey];
  const tomorrowSchedule = scheduleMap[tomorrowKey];
  const isBefore = todayKey < FESTIVAL_START;
  const isAfter  = todayKey > FESTIVAL_END;

  // Loading state
  if (!fetchDone) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-maroon border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // After festival
  if (isAfter) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-6">🎭</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-charcoal mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            See You in 2027!
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Gramakam 2026 has come to a close. Thank you for being part of this incredible celebration of theatre and culture. Until next year — keep the spirit of the stage alive!
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/gallery" className="inline-flex items-center gap-2 bg-maroon text-white px-6 py-3 rounded-full font-semibold hover:bg-maroon/90 transition-all">
              <Star size={16} /> View Gallery
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 border-2 border-maroon/30 text-maroon px-6 py-3 rounded-full font-semibold hover:bg-maroon/5 transition-all">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Before festival
  if (isBefore) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="text-center max-w-lg">
          <h1 className="text-3xl font-bold text-charcoal mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
            Gramakam 2026 begins April 18
          </h1>
          <p className="text-gray-600 mb-6">Check back on the day of the festival for the live schedule.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-maroon text-white px-6 py-3 rounded-full font-semibold hover:bg-maroon/90 transition-all">
            Back to Home <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // During festival
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-charcoal text-white pt-28 pb-10">
        <div className="container-custom">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-maroon text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping inline-block" />
              Live
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-cream mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Today at Gramakam
          </h1>
          <p className="text-gray-400 flex items-center gap-2 text-sm">
            <MapPin size={14} /> Govt. RSRVHSS Velur, Thrissur, Kerala
          </p>
        </div>
      </div>

      <div className="container-custom py-10 space-y-12 max-w-2xl">
        {todaySchedule ? (
          <DaySection schedule={todaySchedule} title="Today" />
        ) : (
          <p className="text-gray-500 text-center py-10">No scheduled events today.</p>
        )}

        {tomorrowSchedule && (
          <>
            <div className="border-t border-gray-200" />
            <DaySection schedule={tomorrowSchedule} title="Tomorrow" dimmed />
          </>
        )}

        {todayKey === FESTIVAL_END && (
          <div className="bg-maroon/5 border border-maroon/20 rounded-2xl p-6 text-center">
            <p className="text-maroon font-semibold text-lg mb-1">Last Day of Gramakam 2026</p>
            <p className="text-gray-600 text-sm">What a journey it&apos;s been! Come celebrate the closing night.</p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-8 text-center">
          <p className="text-gray-500 text-sm mb-4">Want to see the full programme?</p>
          <Link href="/brochure" className="inline-flex items-center gap-2 text-maroon font-semibold hover:underline">
            View Full Brochure <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
