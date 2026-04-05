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

// ==================== GAME SCORES ====================

export interface GameScore {
  id: string;
  name: string;
  score: number;
  level: number;
  createdAt: Date | string;
}

// ==================== AWARDS ====================

export interface Award {
  id: string;
  year: number;
  awardeeName: string;
  title?: string;       // award title/category
  description?: string;
  imageUrl?: string;
  cashAward?: number;
  createdAt: Date | string;
}

// ==================== MEDIA / PRESS ====================

export interface MediaItem {
  id: string;
  type: 'newspaper' | 'link';
  title: string;
  description?: string;
  source?: string;      // e.g., "Mathrubhumi", "Manorama"
  imageUrl?: string;    // newspaper cutting image
  linkUrl?: string;     // external news article URL
  year: number;
  date: string;         // ISO date string
  createdAt: Date | string;
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

export interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface MerchOrder {
  id: string;
  orderId: string;            // human-readable: "GRM-xxxx"
  items: MerchCartItem[];
  total: number;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  deliveryAddress?: DeliveryAddress;
  upiRef: string;             // UPI reference number entered by customer
  status: MerchOrderStatus;
  matchedPaymentId?: string;
  verifiedAt?: string;
  verifiedBy?: string;        // 'auto' | 'admin'
  rejectedAt?: string;
  // Razorpay fields
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentMethod?: 'razorpay' | 'upi_manual';
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
