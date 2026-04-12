import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Spotlight Game — Gramakam 2026';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0d0c0b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Spotlight glow circles */}
        {[
          { top: '8%',  left: '12%', size: 220, opacity: 0.18 },
          { top: '55%', left: '72%', size: 280, opacity: 0.14 },
          { top: '20%', left: '60%', size: 180, opacity: 0.12 },
          { top: '70%', left: '25%', size: 200, opacity: 0.10 },
          { top: '40%', left: '88%', size: 160, opacity: 0.09 },
        ].map((spot, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: spot.top,
              left: spot.left,
              width: spot.size,
              height: spot.size,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(255,220,100,${spot.opacity}) 0%, transparent 70%)`,
            }}
          />
        ))}

        {/* Spotlight rings (game UI hint) */}
        {[
          { top: '10%',  left: '14%',  size: 90,  ring: 1 },
          { top: '57%',  left: '74%',  size: 110, ring: 1 },
          { top: '22%',  left: '63%',  size: 75,  ring: 0.6 },
        ].map((spot, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: spot.top,
              left: spot.left,
              width: spot.size,
              height: spot.size,
              borderRadius: '50%',
              border: `3px solid rgba(255,210,60,${spot.ring * 0.5})`,
              boxShadow: `0 0 30px rgba(255,210,60,${spot.ring * 0.3})`,
            }}
          />
        ))}

        {/* Top label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(128,0,32,0.85)',
            border: '1px solid rgba(200,0,50,0.4)',
            borderRadius: 999,
            padding: '8px 24px',
            marginBottom: 28,
            letterSpacing: 3,
            fontSize: 14,
            color: 'rgba(255,225,200,0.9)',
            textTransform: 'uppercase',
          }}
        >
          ⚡ Gramakam 2026 · Theatre Festival
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: 86,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: -1,
            lineHeight: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>Spotlight</span>
          <span style={{ color: '#f5c842' }}>Game</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 24,
            fontSize: 26,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: 0.5,
          }}
        >
          Tap the spotlights before they fade!
        </div>

        {/* CTA bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '18px 0',
            fontSize: 18,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: 1,
          }}
        >
          gramakam.org/game
        </div>
      </div>
    ),
    { ...size }
  );
}
