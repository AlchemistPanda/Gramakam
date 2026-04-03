import type { Metadata } from 'next';
import Image from 'next/image';
import AnimatedSection from '@/components/AnimatedSection';
import { Theater, Users, Award, BookOpen, Music, Palette } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About — Gramakam',
  description: 'Learn about IF Creations and the Gramakam National Theatre Festival, a celebration of theatre and culture since 2016 in Velur, Thrissur, Kerala.',
};

const festivalYears = [
  {
    year: 2016,
    chair: 'P.R. Mohanan',
    convener: 'K.J. Prasobh',
    director: 'Prabalan Velur',
    note: 'Inaugural edition — strong community participation in first year.',
  },
  {
    year: 2017,
    chair: 'P.R. Mohanan',
    convener: 'K.J. Prasobh',
    director: 'Prabalan Velur',
    note: 'Second edition with growing regional recognition.',
  },
  {
    year: 2018,
    chair: 'P.C. Pankajam',
    convener: '',
    director: '',
    note: 'Festival held April 7–11. Thrissur District Panchayath support extended.',
  },
  {
    year: 2019,
    chair: 'Dr. V.K. Vijayan',
    convener: 'E.M. Vineeth',
    director: 'C.R. Rajan',
    note: 'Inaugural Gramakam Award presented to E.T. Varghese.',
  },
];

const activities = [
  { icon: Theater, label: 'Theatre', desc: 'Five-day national theatre festival featuring performances from across India.' },
  { icon: Music, label: 'Music & Arts', desc: 'Musical performances, folk art, and cultural events alongside the main festival.' },
  { icon: Palette, label: 'Painting & Sculpture', desc: 'Visual arts exhibitions showcasing works by local and national artists.' },
  { icon: BookOpen, label: 'Book Festival', desc: 'Literary seminars, book launches, and a dedicated book festival zone.' },
  { icon: Users, label: "Children's Workshop", desc: 'Annual five-day theatre workshop for children covering acting, painting, and sculpture.' },
  { icon: Award, label: 'Gramakam Award', desc: 'Annual award (₹10,001 + certificate + memento) recognising contributions to theatre.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="relative h-72 md:h-96 flex items-end overflow-hidden">
        <Image
          src="/images/festival/gramakam-03.jpg"
          alt="Gramakam Festival"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent" />
        <div className="container-custom relative z-10 pb-12">
          <AnimatedSection>
            <p className="text-white/60 uppercase tracking-widest text-xs mb-2">Organised by</p>
            <h1
              className="text-4xl md:text-6xl font-bold text-white"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              IF Creations
            </h1>
            <p className="text-white/70 mt-2 text-lg">Velur, Thrissur, Kerala</p>
          </AnimatedSection>
        </div>
      </section>

      {/* About IF Creations */}
      <section className="container-custom py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <h2 className="heading-lg text-charcoal mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
              About IF Creations
            </h2>
            <div className="prose prose-lg text-gray-700 space-y-4">
              <p>
                IF Creations is a non-profit cultural organisation based in Velur, a village in Thrissur
                District, Kerala — a region known for its vibrant political and cultural heritage. We
                are dedicated to creating democratic platforms for cultural events that contribute to
                the growth and togetherness of society.
              </p>
              <p>
                Our work spans drama, music, painting, and sculpture. We operate entirely on community
                support, drawing financial assistance from village residents and local well-wishers to
                sustain our programmes. Our team is diverse — spanning different ages, skills, and
                perspectives — united by a shared belief in the transformative power of art.
              </p>
              <p className="italic text-maroon font-medium text-xl border-l-4 border-maroon pl-4">
                "The theatre is a mirror — it reflects the society."
              </p>
              <p>
                Since 2017, the Thrissur District Panchayath has extended substantial support to
                Gramakam, recognising its cultural significance and community impact.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Gramakam Festival */}
      <section className="bg-white py-16 md:py-20">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="heading-lg text-charcoal mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Gramakam — National Theatre Festival
              </h2>
              <p className="text-gray-600 text-lg">
                Gramakam was launched in April 2016 as an annual five-day celebration of theatre,
                literature, and culture. Held every April in Velur, it brings together artists,
                performers, writers, and audiences from across India in a vibrant festival of
                creative expression.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-maroon/30 transition-colors"
                >
                  <div className="w-11 h-11 bg-maroon/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon size={22} className="text-maroon" />
                  </div>
                  <h3 className="font-semibold text-charcoal mb-2">{label}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Festival History */}
      <section className="container-custom py-16 md:py-20">
        <AnimatedSection>
          <h2
            className="heading-lg text-charcoal mb-10 text-center"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Festival History
          </h2>
          <div className="relative max-w-2xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-maroon/20 hidden sm:block" />

            <div className="space-y-8">
              {festivalYears.map((edition) => (
                <div key={edition.year} className="sm:pl-16 relative">
                  {/* Year dot */}
                  <div className="hidden sm:flex absolute left-0 top-1 w-12 h-12 bg-maroon rounded-full items-center justify-center text-white font-bold text-sm shrink-0">
                    {String(edition.year).slice(2)}
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="sm:hidden bg-maroon text-white text-sm font-bold px-3 py-1 rounded-full">
                        {edition.year}
                      </span>
                      <h3
                        className="text-xl font-bold text-charcoal hidden sm:block"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Gramakam {edition.year}
                      </h3>
                      <h3
                        className="text-lg font-bold text-charcoal sm:hidden"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Gramakam {edition.year}
                      </h3>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      {edition.chair && (
                        <p><span className="font-medium text-charcoal">Chair:</span> {edition.chair}</p>
                      )}
                      {edition.convener && (
                        <p><span className="font-medium text-charcoal">General Convener:</span> {edition.convener}</p>
                      )}
                      {edition.director && (
                        <p><span className="font-medium text-charcoal">Festival Director:</span> {edition.director}</p>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">{edition.note}</p>
                  </div>
                </div>
              ))}

              {/* 2026 current */}
              <div className="sm:pl-16 relative">
                <div className="hidden sm:flex absolute left-0 top-1 w-12 h-12 bg-gold rounded-full items-center justify-center text-charcoal font-bold text-sm shrink-0 ring-2 ring-gold/40">
                  26
                </div>
                <div className="bg-maroon/5 border border-maroon/20 rounded-xl p-6">
                  <h3
                    className="text-xl font-bold text-maroon mb-2"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Gramakam 2026 — Coming Soon
                  </h3>
                  <p className="text-gray-600 text-sm">
                    April 18–22, 2026 · Govt. RSRVHSS Velur, Thrissur, Kerala
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Award Section */}
      <section className="bg-charcoal text-white py-16">
        <div className="container-custom text-center max-w-2xl mx-auto">
          <AnimatedSection>
            <Award size={48} className="text-gold mx-auto mb-6" />
            <h2
              className="heading-lg text-cream mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              The Gramakam Award
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Established in 2019 during the fourth Gramakam National Theatre Festival, the
              Gramakam Award recognises outstanding contributions to theatre. Recipients receive
              a cash award of ₹10,001, a certificate, and a memento — selected by a jury formed
              by the festival's organising committee.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Inaugural awardee (2019): <span className="text-cream font-medium">E.T. Varghese</span>
            </p>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
