import { generateOGMetadata } from '@/lib/metadata';
import Image from 'next/image';
import AnimatedSection from '@/components/AnimatedSection';
import { BookOpen, Globe, MapPin, Users, Feather } from 'lucide-react';

export const metadata = generateOGMetadata({
  title: 'Book Festival — Gramakam',
  description:
    'Gramakam Book Festival — an annual celebration of literature featuring Malayalam and international books, publishers from around the world, and a special spotlight on local native writers.',
  image: '/images/book_festival.jpg',
  url: '/bookfest',
});

const galleryImages = [
  { src: '/images/bookfest/014A2144.jpg', alt: 'Book festival stalls' },
  { src: '/images/bookfest/014A2187.jpg', alt: 'Books on display' },
  { src: '/images/bookfest/014A2194.jpg', alt: 'Book festival visitors' },
  { src: '/images/bookfest/014A2309.jpg', alt: 'Literary seminar' },
  { src: '/images/bookfest/014A2323.jpg', alt: 'Book fair atmosphere' },
  { src: '/images/bookfest/014A2333.jpg', alt: 'Publishers and readers' },
  { src: '/images/bookfest/014A2341.jpg', alt: 'Gramakam Book Festival' },
];

const highlights = [
  {
    icon: BookOpen,
    title: 'Malayalam Literature',
    desc: 'A curated selection of the finest Malayalam titles — from contemporary fiction to classical heritage.',
  },
  {
    icon: Globe,
    title: 'International Publishers',
    desc: 'Books from publishers across India and the world, bringing global literature to Velur.',
  },
  {
    icon: Feather,
    title: 'Native Writers Spotlight',
    desc: 'A dedicated section promoting works by writers born and raised in the region — celebrating local voices.',
  },
  {
    icon: Users,
    title: 'Literary Sessions',
    desc: 'Author meets, seminars, book launches, and discussions that bring readers and writers together.',
  },
];

export default function BookFestPage() {
  return (
    <div className="min-h-screen bg-cream">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/bookfest/014A2309.jpg"
          alt="Gramakam Book Festival"
          fill
          className="object-cover object-top"
          priority
          quality={85}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />

        <div className="relative z-10 text-center px-4 py-20 max-w-4xl mx-auto">
          <AnimatedSection>
            <p className="text-white/60 uppercase tracking-[0.35em] text-xs sm:text-sm mb-4 font-medium">
              Gramakam — Annual Programme
            </p>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-5 drop-shadow-lg"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Book Festival
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
              An annual celebration of literature — bringing Malayalam and world books,
              publishers, authors, and passionate readers together in the heart of Velur.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-4">
              <BookOpen size={28} className="text-maroon" />
              <p className="text-maroon uppercase tracking-[0.2em] text-sm font-medium">About the Festival</p>
            </div>
            <h2
              className="text-3xl sm:text-4xl font-bold text-charcoal mb-5 leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Where Stories Find Their Readers
            </h2>
            <div className="w-12 h-0.5 bg-maroon mb-6" />
            <div className="space-y-4 text-gray-600 leading-relaxed text-base">
              <p>
                The Gramakam Book Festival is an integral part of the annual Gramakam Theatre Festival,
                held every year in Velur, Thrissur. Born from a deep belief in the power of the written
                word, the book festival brings together readers, writers, and publishers under one roof —
                creating a vibrant literary space alongside the theatre and cultural festivities.
              </p>
              <p>
                The festival features an expansive collection of <strong>Malayalam books</strong> alongside
                titles from publishers across India and the world. From timeless classics to newly released
                works, the shelves reflect the breadth of human thought and storytelling across languages
                and cultures.
              </p>
              <p>
                What makes our book festival truly unique is its commitment to celebrating
                <strong> native voices</strong> — writers who have roots in and around Velur and the
                broader Thrissur region. A dedicated section spotlights their works, ensuring that local
                literature finds the recognition and audience it deserves.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── HIGHLIGHTS ──────────────────────────────────────────────────────── */}
      <section className="section-padding bg-cream/50">
        <div className="container-custom">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-2 font-medium">What to Expect</p>
              <h2
                className="text-3xl sm:text-4xl font-bold text-charcoal"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Festival Highlights
              </h2>
              <div className="w-12 h-0.5 bg-maroon mx-auto mt-5" />
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((h, i) => (
              <AnimatedSection key={h.title} delay={i * 0.1}>
                <div className="bg-white rounded-3xl p-7 border border-cream-dark/30 hover:shadow-lg transition-shadow duration-300 h-full">
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

      {/* ── NATIVE WRITERS ───────────────────────────────────────────────────── */}
      <section className="section-padding bg-charcoal text-white">
        <div className="container-custom max-w-3xl text-center">
          <AnimatedSection>
            <MapPin size={36} className="text-maroon mx-auto mb-4" />
            <p className="text-white/50 uppercase tracking-[0.2em] text-sm mb-3 font-medium">Special Section</p>
            <h2
              className="text-3xl sm:text-4xl font-bold mb-5"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Native Writers
            </h2>
            <div className="w-12 h-0.5 bg-maroon mx-auto mb-6" />
            <p className="text-white/75 leading-relaxed text-base mb-4">
              Every year, Gramakam Book Festival dedicates a special section to authors from
              Velur and the surrounding region. We believe literature flourishes when local
              voices are amplified — these writers carry the stories, histories, and
              sensibilities of the land itself.
            </p>
            <p className="text-white/75 leading-relaxed text-base">
              Their books occupy a place of honour at the festival, giving visitors a chance
              to discover, read, and connect directly with the authors who call this place home.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── GALLERY ──────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-cream">
        <div className="container-custom">
          <AnimatedSection>
            <div className="text-center mb-10">
              <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-2 font-medium">Gallery</p>
              <h2
                className="text-3xl sm:text-4xl font-bold text-charcoal"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Moments from the Festival
              </h2>
              <div className="w-12 h-0.5 bg-maroon mx-auto mt-5" />
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Featured first image — spans 2 columns */}
            <AnimatedSection delay={0} className="col-span-2">
              <div className="relative aspect-video rounded-2xl overflow-hidden group">
                <Image
                  src={galleryImages[0].src}
                  alt={galleryImages[0].alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  quality={80}
                  loading="eager"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
              </div>
            </AnimatedSection>

            {galleryImages.slice(1).map((img, i) => (
              <AnimatedSection key={img.src} delay={(i + 1) * 0.07}>
                <div className="relative aspect-square rounded-2xl overflow-hidden group bg-gray-200">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    quality={75}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-maroon text-white text-center">
        <div className="container-custom max-w-3xl">
          <AnimatedSection>
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Join Us at the Next Book Festival
            </h2>
            <p className="text-white/75 text-lg leading-relaxed">
              Held every year as part of the Gramakam Theatre Festival in Velur, Thrissur.
              Come browse, discover, and take home stories that stay with you.
            </p>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}
