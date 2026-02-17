// Type definitions for Gramakam website

export interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  year: number;
  category: string;
  type: 'image' | 'video';
  videoUrl?: string;
  createdAt: Date | string;
}

export interface FeedPost {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  embedUrl?: string;
  date: Date | string;
  createdAt: Date | string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date | string;
  read: boolean;
}

export interface MerchItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price?: number;
  sizes?: string[];
}

export interface MerchPrebook {
  id: string;
  name: string;
  email: string;
  mobile: string;
  item: string;
  size: string;
  quantity: number;
  createdAt: Date | string;
}

export interface SiteConfig {
  countdownDate: string; // ISO date string
  heroTitle: string;
  heroTagline: string;
  aboutText: string;
}

export interface AdminUser {
  uid: string;
  email: string;
}
