import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book Festival Manager — Gramakam',
  robots: 'noindex, nofollow',
};

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
