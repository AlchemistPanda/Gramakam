import Image from 'next/image';
import Link from 'next/link';
import CountdownSection from '@/components/CountdownSection';
import Carousel from '@/components/Carousel';
import AnimatedSection from '@/components/AnimatedSection';
import GameLeaderboard from '@/components/GameLeaderboard';
import InstagramFeed from '@/components/InstagramFeed';
import { Camera, Newspaper, ShoppingBag, Mail, ArrowRight, MapPin, Calendar, Trophy, BookOpen, Mic2, Image as ImageIcon, Gamepad2, BookMarked, Phone, FileText } from 'lucide-react';

// Real festival images from past editions
const carouselImages = [
  { src: '/images/festival/gramakam-01.jpg', alt: 'Gramakam Theatre Festival performance' },
  { src: '/images/festival/gramakam-03.jpg', alt: 'Artists performing at Gramakam' },
  { src: '/images/festival/gramakam-05.jpg', alt: 'Stage moments at the festival' },
  { src: '/images/festival/gramakam-07.jpg', alt: 'Cultural celebration at Gramakam' },
  { src: '/images/festival/gramakam-09.jpg', alt: 'Audience at the festival grounds' },
  { src: '/images/festival/gramakam-11.jpg', alt: 'Drama performance at Gramakam' },
  { src: '/images/festival/gramakam-13.jpg', alt: 'Community gathering at the festival' },
  { src: '/images/festival/gramakam-15.jpg', alt: 'Theatre arts at Gramakam' },
];

const quickLinks = [
  { href: '/about', label: 'About', icon: BookMarked, description: 'The story behind Gramakam' },
  { href: '/gallery', label: 'Gallery', icon: Camera, description: 'Festival moments over the years' },
  { href: '/feed', label: 'Latest Feed', icon: Newspaper, description: 'News, updates & announcements' },
  { href: '/awards', label: 'Awards', icon: Trophy, description: 'Celebrating excellence in theatre' },
  { href: '/bookfest', label: 'Book Festival', icon: BookOpen, description: 'Celebrating Malayalam literature' },
  { href: '/workshop', label: 'Workshop', icon: Mic2, description: "Children's theatre workshop" },
  { href: '/brochure', label: 'Brochure', icon: FileText, description: 'Flip through the 2026 festival brochure' },
  { href: '/media', label: 'Media', icon: ImageIcon, description: 'Press coverage & media gallery' },
  { href: '/merchandise', label: 'Merchandise', icon: ShoppingBag, description: 'Exclusive festival collectibles' },
  { href: '/game', label: 'Spotlight Game', icon: Gamepad2, description: 'Play & win Gramakam prizes' },
  { href: '/contact', label: 'Contact Us', icon: Phone, description: 'Reach out to the Gramakam team' },
];

export default function HomePage() {
  return (
    <>
      {/* ===== HERO SECTION — Full-bleed background image ===== */}
      <section className="relative min-h-screen flex items-center justify-center text-white overflow-hidden">
        {/* Background Image */}
        <Image
          src="/images/festival/gramakam-01.jpg"
          alt="Gramakam Festival"
          fill
          className="object-cover"
          priority
          quality={85}
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        {/* Subtle grain texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

        <div className="container-custom text-center relative z-10 py-20">
          <AnimatedSection>
            {/* Organised by */}
            <p className="text-white/60 uppercase tracking-[0.4em] text-xs sm:text-sm mb-6 font-medium">
              Organised by IF Creations
            </p>

            {/* Festival Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/images/gramakam-logo-white.png"
                alt="Gramakam 2026 Logo"
                width={400}
                height={400}
                className="w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain drop-shadow-2xl"
                priority
              />
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 drop-shadow-lg" style={{ fontFamily: 'var(--font-heading)' }}>
              Gramakam
            </h1>

            {/* Tagline */}
            <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-4 max-w-2xl mx-auto font-light" style={{ fontFamily: 'var(--font-heading)' }}>
              A Celebration of Theatre &amp; Culture
            </p>

            {/* Date & Location pill */}
            <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm text-white/70">
              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Calendar size={14} /> April 18, 2026
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <MapPin size={14} /> Velur, Thrissur, Kerala
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/gallery" className="bg-maroon hover:bg-maroon-dark text-white px-8 py-3.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 shadow-lg shadow-maroon/30 hover:shadow-xl hover:shadow-maroon/40 hover:scale-105">
                Explore Gallery <ArrowRight size={16} />
              </Link>
              <Link href="/brochure" className="border-2 border-white/30 text-white px-8 py-3.5 rounded-full font-medium hover:bg-white hover:text-charcoal transition-all duration-300 backdrop-blur-sm hover:scale-105 flex items-center gap-2">
                <FileText size={16} /> View Brochure
              </Link>
              <Link href="/feed" className="border-2 border-white/20 text-white/80 px-8 py-3.5 rounded-full font-medium hover:bg-white/10 transition-all duration-300 backdrop-blur-sm hover:scale-105">
                Latest Updates
              </Link>
            </div>
          </AnimatedSection>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* ===== COUNTDOWN SECTION — with bg image ===== */}
      <section className="relative section-padding overflow-hidden">
        {/* Background image at low opacity */}
        <Image
          src="/images/festival/gramakam-07.jpg"
          alt=""
          fill
          className="object-cover"
          quality={60}
        />
        <div className="absolute inset-0 bg-cream/90 backdrop-blur-sm" />

        <div className="container-custom text-center relative z-10">
          <AnimatedSection>
            <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-2 font-semibold">Mark Your Calendar</p>
            <h2 className="heading-lg text-charcoal mb-2">Gramakam 2026</h2>
            <CountdownSection />
            
            {/* Profile Picture Invitation */}
            <div className="mt-12 pt-12 border-t border-maroon/20">
              <div className="max-w-md mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-maroon/10 text-maroon text-xs font-bold uppercase tracking-widest mb-4">
                  <Camera size={14} /> Celebrate with Us
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-charcoal mb-3">Change Your Profile Picture</h3>
                <p className="text-gray-600 text-sm mb-6">Join the Gramakam community and update your profile with our festival frame!</p>
                <Link
                  href="/profile-frame"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-maroon text-white rounded-lg font-semibold hover:bg-maroon/90 transition-all duration-300 hover:shadow-lg hover:shadow-maroon/20"
                >
                  Get Your Frame
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== ABOUT SECTION — split layout with image ===== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Image side */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/festival/gramakam-04.jpg"
                  alt="Gramakam Festival moments"
                  fill
                  className="object-cover"
                  quality={80}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              {/* Text side */}
              <div>
                <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-3 font-semibold">About the Festival</p>
                <h2 className="heading-lg text-charcoal mb-6">What is Gramakam?</h2>
                <div className="w-16 h-1 bg-maroon rounded-full mb-8" />
                <p className="text-gray-600 leading-relaxed text-lg">
                  <strong className="text-charcoal">Gramakam</strong> is an annual theatre and cultural
                  festival held in the historic village of Velur, Thrissur. As a vibrant celebration of
                  theatre, literature, art, and community, the festival serves as a bridge between
                  Kerala&apos;s deep-rooted traditions and contemporary creative expression.
                </p>
                <p className="text-gray-600 leading-relaxed text-lg mt-4">
                  Each year, Gramakam transforms Velur into a cultural hub, bringing together a diverse
                  community of playwrights, actors, directors, writers, and art enthusiasts from across
                  the state and beyond.
                </p>
                <p className="text-gray-600 leading-relaxed text-lg mt-4">
                  The journey began in 2016, when <strong className="text-charcoal">IF Creations Cultural
                  Organization</strong> Velur initiated the first organizing activities for the festival.
                  Gramakam is organized by a dedicated committee of art-loving residents from Velur and
                  neighbouring villages. The success of every edition is fueled by the immense
                  participation and support of the local community.
                </p>
                <Link href="/gallery" className="inline-flex items-center gap-2 mt-8 text-maroon font-semibold hover:gap-3 transition-all duration-300">
                  View Festival Gallery <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== PHOTO CAROUSEL — dark section ===== */}
      <section className="relative section-padding bg-charcoal overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="container-custom relative z-10">
          <AnimatedSection>
            <div className="text-center mb-10">
              <p className="text-maroon-light uppercase tracking-[0.2em] text-sm mb-2 font-semibold">Festival Memories</p>
              <h2 className="heading-lg text-cream">Moments from Gramakam</h2>
            </div>
            <Carousel images={carouselImages} />
          </AnimatedSection>
        </div>
      </section>

      {/* ===== GAME LEADERBOARD SECTION ===== */}
      <GameLeaderboard />

      {/* ===== INSTAGRAM FEED SECTION ===== */}
      <InstagramFeed />

      {/* ===== DISCOVER GRAMAKAM — last section ===== */}
      <section className="relative section-padding overflow-hidden">
        <Image
          src="/images/festival/gramakam-20.jpg"
          alt=""
          fill
          className="object-cover"
          quality={50}
        />
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm" />

        <div className="container-custom relative z-10">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-maroon uppercase tracking-[0.2em] text-sm mb-2 font-semibold">Explore</p>
              <h2 className="heading-lg text-charcoal">Discover Gramakam</h2>
              <p className="text-gray-600 mt-3 max-w-xl mx-auto">Everything Gramakam has to offer — all in one place</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {quickLinks.map((link, index) => (
                <AnimatedSection key={link.href} delay={index * 0.05}>
                  <Link
                    href={link.href}
                    className="group block bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-100 shadow-sm hover:shadow-xl hover:border-maroon/30 hover:-translate-y-1 transition-all duration-300 w-44"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-maroon/10 to-maroon/5 flex items-center justify-center mx-auto mb-4 group-hover:from-maroon group-hover:to-maroon-dark group-hover:scale-110 transition-all duration-300">
                      <link.icon
                        size={22}
                        className="text-maroon group-hover:text-white transition-colors duration-300"
                      />
                    </div>
                    <h3
                      className="text-sm font-semibold text-charcoal mb-1"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {link.label}
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{link.description}</p>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
