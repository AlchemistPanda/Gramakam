import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://gramakam.org'),
  title: {
    default: 'Gramakam — A Celebration of Theatre and Culture',
    template: '%s | Gramakam',
  },
  description:
    'Gramakam is an annual theatre and cultural festival in Kerala, India. Organised by IF Creations, it celebrates theatre, literature, art, and community at Velur, Thrissur.',
  keywords: [
    'Gramakam',
    'theatre festival',
    'Kerala',
    'cultural festival',
    'IF Creations',
    'Thrissur',
    'Velur',
    'drama',
    'performing arts',
    'Indian theatre',
  ],
  authors: [{ name: 'IF Creations' }],
  openGraph: {
    title: 'Gramakam — A Celebration of Theatre and Culture',
    description:
      'An annual theatre and cultural festival in Kerala, India, celebrating theatre, literature, and community.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Gramakam',
    url: 'https://gramakam.org',
    images: [
      {
        url: '/images/gramakam-logo.png',
        width: 1200,
        height: 630,
        alt: 'Gramakam — A Celebration of Theatre and Culture',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gramakam — A Celebration of Theatre and Culture',
    description:
      'An annual theatre and cultural festival in Kerala, India, celebrating theatre, literature, and community.',
    images: ['/images/gramakam-logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#800020" />
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
        <Navbar />
        <main className="flex-grow pt-16 md:pt-20">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
