import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
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
  title: {
    default: 'Gramakam — A Celebration of Theatre and Culture',
    template: '%s | Gramakam',
  },
  description:
    'Gramakam is an annual theatre and cultural festival in Kerala, India. Organised by Gramakam Cultural Academy, it celebrates theatre, literature, art, and community at Velur, Thrissur.',
  keywords: [
    'Gramakam',
    'theatre festival',
    'Kerala',
    'cultural festival',
    'Gramakam Cultural Academy',
    'Thrissur',
    'Velur',
    'drama',
    'performing arts',
    'Indian theatre',
  ],
  authors: [{ name: 'Gramakam Cultural Academy' }],
  openGraph: {
    title: 'Gramakam — A Celebration of Theatre and Culture',
    description:
      'An annual theatre and cultural festival in Kerala, India, celebrating theatre, literature, and community.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Gramakam',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-16 md:pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
