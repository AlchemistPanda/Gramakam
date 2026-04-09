'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AnimatedSection from '@/components/AnimatedSection';
import { getAwards } from '@/lib/services';
import type { Award } from '@/types';
import { Award as AwardIcon, Trophy } from 'lucide-react';

const fallbackAwards: Award[] = [
  {
    id: 'award-2019',
    year: 2019,
    awardeeName: 'E.T. Varghese',
    title: 'Gramakam Award 2019',
    description: 'Inaugural Gramakam Award recognizing outstanding contributions to theatre activities',
    cashAward: 10001,
    createdAt: '2019-04-15',
  },
];

export default function AwardsClient() {
  const [awards, setAwards] = useState<Award[]>(fallbackAwards);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAwards()
      .then((data) => { if (data.length > 0) setAwards([...data, ...fallbackAwards]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const yearGroups = awards.reduce(
    (acc, award) => {
      const year = award.year;
      if (!acc[year]) acc[year] = [];
      acc[year].push(award);
      return acc;
    },
    {} as Record<number, Award[]>
  );

  const sortedYears = Object.keys(yearGroups)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-charcoal text-white pt-28 pb-16">
        <div className="container-custom">
          <AnimatedSection>
            <Trophy size={48} className="text-gold mb-4" />
            <h1
              className="text-4xl md:text-5xl font-bold text-cream mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Gramakam Awards
            </h1>
            <p className="text-gray-300 max-w-2xl leading-relaxed">
              Established in 2019, the Gramakam Award honors individuals whose extraordinary work in theatre enriches our collective cultural landscape. We believe in celebrating the dedication of those who keep the spirit of theatre and art alive in Kerala and beyond.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Award Criteria */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="container-custom max-w-2xl">
          <AnimatedSection>
            <h2 className="heading-lg text-charcoal mb-8">Award Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              <div>
                <div className="text-3xl font-bold text-maroon mb-2">₹11,111</div>
                <p className="text-sm text-gray-600">Cash Award</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-charcoal mb-2">Certificate</div>
                <p className="text-sm text-gray-600">Commendation</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-charcoal mb-2">Memento</div>
                <p className="text-sm text-gray-600">Keepsake</p>
              </div>
            </div>

            {/* Memento Information */}
            <div className="bg-maroon/5 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-charcoal mb-3">Bespoke Memento</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                From 2024 onwards, the Gramakam Memento has been elevated from a traditional award to a bespoke work of art. Envisioned and crafted by the celebrated artist <span className="font-medium">Jayan Pathramangalam</span>.
              </p>
            </div>

            <p className="text-gray-600 text-sm pt-6 border-t border-gray-200">
              Recipients are selected by a jury formed by the Gramakam Festival Organizing Committee, recognizing excellence and dedication to theatre and cultural advancement.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Awards Timeline */}
      <section className="container-custom py-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-maroon border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedYears.length === 0 ? (
          <AnimatedSection>
            <div className="text-center py-20">
              <AwardIcon size={56} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-charcoal mb-2">No awards yet</h3>
              <p className="text-gray-500">Awards will be displayed here as they are announced.</p>
            </div>
          </AnimatedSection>
        ) : (
          <div className="space-y-12">
            {sortedYears.map((year) => (
              <div key={year}>
                <AnimatedSection>
                  <h2
                    className="text-3xl font-bold text-maroon mb-8 pb-4 border-b-2 border-maroon/20"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Gramakam {year}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {yearGroups[year].map((award) => (
                      <div
                        key={award.id}
                        className="bg-white rounded-xl border-2 border-gold/20 hover:border-gold/40 transition-colors overflow-hidden shadow-sm hover:shadow-md"
                      >
                        {/* Award Image */}
                        {award.imageUrl && (
                          <div className="relative aspect-square bg-gray-100 overflow-hidden">
                            <Image
                              src={award.imageUrl}
                              alt={award.awardeeName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        <div className="p-6">
                          {/* Icon & Title */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3
                                className="text-2xl font-bold text-charcoal"
                                style={{ fontFamily: 'var(--font-heading)' }}
                              >
                                {award.awardeeName}
                              </h3>
                              {award.title && (
                                <p className="text-sm text-maroon font-medium mt-1">
                                  {award.title}
                                </p>
                              )}
                            </div>
                            <Trophy size={24} className="text-gold shrink-0 mt-1" />
                          </div>

                          {/* Description */}
                          {award.description && (
                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                              {award.description}
                            </p>
                          )}

                          {/* Award Details */}
                          <div className="bg-maroon/5 rounded-lg p-4 mt-4">
                            <div className="space-y-2 text-sm">
                              {award.cashAward && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Cash Award:</span>
                                  <span className="font-semibold text-maroon">
                                    ₹{award.cashAward.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">Certificate:</span>
                                <span className="font-semibold text-charcoal">Commendation</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Memento:</span>
                                <span className="font-semibold text-charcoal">Keepsake</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AnimatedSection>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
