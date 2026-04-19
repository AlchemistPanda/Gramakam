import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const MAROON = '#800020';
const CREAM  = '#FFF8DC';
const CHARCOAL = '#1a1a1a';

const SCHEDULE: Record<string, { day: number; label: string; date: string; events: { time: string; type: string; title: string; titleMl?: string }[] }> = {
  '2026-04-18': {
    day: 1, label: 'Day 1 — Inauguration', date: 'Saturday, April 18',
    events: [
      { time: '9:00 AM',  type: 'Workshop',  title: "Children's Theatre Workshop" },
      { time: '6:00 PM',  type: 'Ceremony',  title: 'Inauguration Ceremony', titleMl: 'ഉദ്ഘാടനസദസ്സ്' },
      { time: '7:30 PM',  type: 'Play',      title: 'Tantu Laavanam', titleMl: 'തന്തു ലാവണം' },
    ],
  },
  '2026-04-19': {
    day: 2, label: 'Day 2', date: 'Sunday, April 19',
    events: [
      { time: '6:30 PM',  type: 'Talk',  title: 'Play Introduction' },
      { time: '7:00 PM',  type: 'Play',  title: 'Verumaadikulam', titleMl: 'വെറുമാടിക്കൂലം' },
    ],
  },
  '2026-04-20': {
    day: 3, label: 'Day 3', date: 'Monday, April 20',
    events: [
      { time: '6:30 PM',  type: 'Talk',  title: 'Play Introduction' },
      { time: '7:00 PM',  type: 'Play',  title: 'Lenaril', titleMl: 'ലേനറിൽ' },
    ],
  },
  '2026-04-21': {
    day: 4, label: 'Day 4', date: 'Tuesday, April 21',
    events: [
      { time: '6:00 PM',  type: 'Talk',  title: 'Theatre Talk' },
      { time: '6:30 PM',  type: 'Play',  title: 'Chaav Saakyam', titleMl: 'ചാവ് സാക്ഷ്യം' },
      { time: '7:30 PM',  type: 'Play',  title: 'KOOHOO' },
    ],
  },
  '2026-04-22': {
    day: 5, label: 'Day 5 — Closing', date: 'Wednesday, April 22',
    events: [
      { time: '6:00 PM',  type: 'Ceremony', title: 'Closing Ceremony & Gramakam Award', titleMl: 'സമാപനസദസ്സ്' },
      { time: '7:30 PM',  type: 'Play',     title: "N'Lanil Bolo... Karupinothe" },
    ],
  },
};

function getISTDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

const TYPE_COLOR: Record<string, string> = {
  Play: MAROON,
  Ceremony: '#92400e',
  Talk: '#1e40af',
  Workshop: '#166534',
};

export default function OGImage() {
  const today = getISTDate();
  const day   = SCHEDULE[today];

  // Before or after festival — generic card
  if (!day) {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200, height: 630,
            background: CHARCOAL,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: 'serif',
          }}
        >
          <div style={{ color: MAROON, fontSize: 20, letterSpacing: 8, textTransform: 'uppercase', marginBottom: 24 }}>
            Gramakam 2026
          </div>
          <div style={{ color: CREAM, fontSize: 64, fontWeight: 700, marginBottom: 16 }}>
            Theatre &amp; Culture Festival
          </div>
          <div style={{ color: '#9ca3af', fontSize: 28 }}>
            April 18–22, 2026 · Velur, Thrissur
          </div>
        </div>
      ),
      { ...size },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          background: CHARCOAL,
          display: 'flex', flexDirection: 'column',
          fontFamily: 'serif',
          overflow: 'hidden',
        }}
      >
        {/* Header bar */}
        <div
          style={{
            background: MAROON,
            padding: '28px 56px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, letterSpacing: 6, textTransform: 'uppercase' }}>
              Today at Gramakam 2026
            </div>
            <div style={{ color: CREAM, fontSize: 40, fontWeight: 700 }}>
              {day.label}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 18 }}>{day.date}</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>Velur, Thrissur, Kerala</div>
          </div>
        </div>

        {/* Events list */}
        <div
          style={{
            flex: 1,
            padding: '40px 56px',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}
        >
          {day.events.map((ev, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 28,
              }}
            >
              {/* Time */}
              <div style={{ color: '#9ca3af', fontSize: 20, minWidth: 90, fontVariantNumeric: 'tabular-nums' }}>
                {ev.time}
              </div>

              {/* Divider */}
              <div style={{ width: 2, height: 44, background: TYPE_COLOR[ev.type] ?? MAROON, borderRadius: 2, opacity: 0.6 }} />

              {/* Type badge + title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    background: (TYPE_COLOR[ev.type] ?? MAROON) + '22',
                    color: TYPE_COLOR[ev.type] ?? MAROON,
                    fontSize: 13, fontWeight: 700,
                    letterSpacing: 3, textTransform: 'uppercase',
                    padding: '3px 10px', borderRadius: 20,
                    width: 'fit-content',
                  }}
                >
                  {ev.type}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ color: CREAM, fontSize: 26, fontWeight: 700 }}>{ev.title}</span>
                  {ev.titleMl && (
                    <span style={{ color: '#6b7280', fontSize: 20 }}>{ev.titleMl}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 56px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ color: '#6b7280', fontSize: 16 }}>gramakam.org/today</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: MAROON }} />
            <div style={{ color: '#9ca3af', fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' }}>Live</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
