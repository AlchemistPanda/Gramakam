import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import AnimatedSection from '@/components/AnimatedSection';
import { Users, Star, ArrowRight, Sparkles, Calendar, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: "Children's Acting Workshop | Gramakam 2026",
  description:
    "Join the Gramakam Children's Acting Workshop — a fun, immersive theatre experience for young performers. Register now for the 2026 edition.",
};

const galleryImages = [
  { src: '/images/festival/gramakam-04.jpg', alt: 'Kids at the acting workshop' },
  { src: '/images/festival/gramakam-06.jpg', alt: 'Young performers on stage' },
  { src: '/images/festival/gramakam-08.jpg', alt: 'Workshop activities' },
  { src: '/images/festival/gramakam-10.jpg', alt: 'Theatre exercises' },
  { src: '/images/festival/gramakam-12.jpg', alt: 'Group performance' },
  { src: '/images/festival/gramakam-14.jpg', alt: 'Children performing' },
];

const highlights = [
  {
    icon: Sparkles,
    title: 'Voice & Expression',
    desc: 'Learn to project emotions through voice modulation, facial expression, and body language.',
  },
  {
    icon: Users,
    title: 'Ensemble Work',
    desc: 'Build trust, teamwork, and stage presence through collaborative improv and scene work.',
  },
  {
    icon: Star,
    title: 'Stage Performance',
    desc: 'Workshop culminates in a short showcase performance in front of an audience.',
  },
];

const details = [
  { icon: Users, label: 'Age Group', value: '10 – 18 years' },
  { icon: Calendar, label: 'Dates', value: 'April 18 – 22, 2026' },
  { icon: MapPin, label: 'Venue', value: 'Govt. RSRVHSS Velur' },
];

export default function WorkshopPage() {
  return (
    <div className="bg-white min-h-screen">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/festival/gramakam-06.jpg"
          alt="Children's Acting Workshop"
          fill
          className="object-cover"
          priority
          quality={85}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/80" />

        <div className="relative z-10 text-center px-4 py-20 max-w-4xl mx-auto">
          <AnimatedSection>
            <p className="text-white/60 uppercase tracking-[0.35em] text-xs sm:text-sm mb-4 font-medium">
              Gramakam 2026 — Special Programme
            </p>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-5 drop-shadow-lg"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Children&apos;s<br />Acting Workshop
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
              A five-day immersive theatre experience for young minds — discover the magic
              of storytelling, movement, and the stage.
            </p>
            <Link
              href="/workshop/register"
              className="inline-flex items-center gap-2.5 bg-maroon hover:bg-maroon-dark text-white font-semibold px-8 py-4 rounded-full text-base transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-maroon/40 shadow-lg"
            >
              Register Now
              <ArrowRight size={18} />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* ── QUICK DETAILS PILLS ─────────────────────────────────────────────── */}
      <section className="bg-maroon text-white py-6">
        <div className="container-custom">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {details.map((d) => (
              <div key={d.label} className="flex items-center gap-2.5 text-sm sm:text-base">
                <d.icon size={16} className="text-white/70 shrink-0" />
                <span className="text-white/70 font-medium">{d.label}:</span>
                <span className="font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-cream/30">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-3 font-medium">
                About the Workshop
              </p>
              <h2
                className="text-3xl sm:text-4xl font-bold text-charcoal mb-5 leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Where Every Child Finds Their Stage
              </h2>
              <div className="w-12 h-0.5 bg-maroon mb-6" />
              <p className="text-gray-600 leading-relaxed mb-4">
                As part of the Gramakam Theatre Festival 2026, we are proud to present an
                exclusive five-day acting workshop designed for children and young adults.
                Guided by experienced theatre practitioners, participants will explore the
                fundamentals of acting, improvisation, and storytelling in a nurturing,
                playful environment.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                No prior experience is needed — just curiosity, energy, and a love for
                stories. The workshop is fully in Malayalam and English, with activities
                rooted in traditional Kerala performance arts as well as contemporary theatre.
              </p>
              <Link
                href="/workshop/register"
                className="inline-flex items-center gap-2 bg-maroon hover:bg-maroon-dark text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-all duration-300 hover:scale-105 shadow-md"
              >
                Secure Your Spot
                <ArrowRight size={16} />
              </Link>
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
                <Image
                  src="/images/festival/gramakam-08.jpg"
                  alt="Workshop in action"
                  fill
                  className="object-cover"
                  quality={80}
                />
                {/* Decorative corner accent */}
                <div className="absolute top-4 left-4 bg-maroon text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                  Limited Seats
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHTS ─────────────────────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-2 font-medium">What You&apos;ll Learn</p>
              <h2
                className="text-3xl sm:text-4xl font-bold text-charcoal"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Workshop Highlights
              </h2>
              <div className="w-12 h-0.5 bg-maroon mx-auto mt-5" />
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((h, i) => (
              <AnimatedSection key={h.title} delay={i * 0.1}>
                <div className="bg-cream/40 rounded-3xl p-7 border border-cream-dark/30 hover:shadow-lg transition-shadow duration-300 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-maroon/10 flex items-center justify-center mb-4">
                    <h.icon size={22} className="text-maroon" />
                  </div>
                  <h3
                    className="text-lg font-bold text-charcoal mb-2"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {h.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{h.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAST WORKSHOP GALLERY ───────────────────────────────────────────── */}
      <section className="section-padding bg-charcoal text-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="text-center mb-10">
              <p className="text-white/50 uppercase tracking-[0.2em] text-sm mb-2 font-medium">Memories</p>
              <h2
                className="text-3xl sm:text-4xl font-bold"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                From Our Last Workshop
              </h2>
              <div className="w-12 h-0.5 bg-maroon mx-auto mt-5" />
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {galleryImages.map((img, i) => (
              <AnimatedSection key={img.src} delay={i * 0.07}>
                <div className="relative aspect-square rounded-2xl overflow-hidden group">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    quality={70}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="section-padding bg-maroon text-white text-center">
        <div className="container-custom max-w-3xl">
          <AnimatedSection>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Ready to Step into the Spotlight?
            </h2>
            <p className="text-white/75 text-lg mb-8 leading-relaxed">
              Seats are limited to ensure every child gets personal attention.
              Register early to avoid disappointment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/workshop/register"
                className="inline-flex items-center gap-2.5 bg-white text-maroon font-bold px-8 py-4 rounded-full text-base transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg"
              >
                Register Now
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-full text-base transition-all duration-300 border border-white/20"
              >
                Have a Question?
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}
