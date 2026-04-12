import { generateOGMetadata } from '@/lib/metadata';
import ContactClient from './ContactClient';

export const metadata = generateOGMetadata({
  title: 'Contact Us | Gramakam',
  description: 'Have questions about Gramakam? Want to participate or collaborate? Get in touch with us through this contact form or our social media channels.',
  image: '/images/festival/gramakam-15.jpg',
  url: '/contact',
});

export default function ContactPage() {
  return <ContactClient />;
}
