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

// ==================== MERCH ORDERS ====================

export interface MerchCartItem {
  productId: string;
  name: string;
  price: number;
  size: string;       // 'N/A' for non-sized items
  quantity: number;
}

export type MerchOrderStatus = 'pending' | 'verified' | 'rejected' | 'manual_verified';

export interface MerchOrder {
  id: string;
  orderId: string;            // human-readable: "GRM-xxxx"
  items: MerchCartItem[];
  total: number;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  upiRef: string;             // UPI reference number entered by customer
  status: MerchOrderStatus;
  matchedPaymentId?: string;
  verifiedAt?: string;
  verifiedBy?: string;        // 'auto' | 'admin'
  rejectedAt?: string;
  createdAt: Date | string;
}

export interface UpiPayment {
  id: string;
  amount: number;
  datetime: string;           // from SMS: "26-03-2026 09:09:40"
  senderUpi: string;
  upiRef: string;
  bank: string;
  rawSms: string;
  capturedAt: Date | string;
  matched: boolean;
  matchedOrderId?: string;
}
