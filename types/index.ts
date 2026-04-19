// Type definitions for Gramakam website

export interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  year: number;
  category: string;
  description?: string;
  type: 'image' | 'video';
  videoUrl?: string;
  createdAt: Date | string;
  fileSize?: number;       // compressed size in bytes
  originalSize?: number;   // original file size in bytes
  fileHash?: string;       // SHA-1 of original file for duplicate detection
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

// ==================== FESTIVAL SCHEDULE ====================

export type FestivalEventType = 'ceremony' | 'play' | 'talk' | 'workshop';

export interface FestivalEvent {
  time: string;
  type: FestivalEventType;
  title: string;
  titleMl?: string;
  group?: string;
  note?: string;
}

export interface FestivalDaySchedule {
  dateKey: string;   // e.g. '2026-04-18'
  day: number;
  label: string;
  date: string;      // display string
  events: FestivalEvent[];
  updatedAt?: Date | string;
}

// ==================== WORKSHOP GALLERY ====================

export interface WorkshopGalleryItem {
  id: string;
  imageUrl: string;
  year: number;
  alt?: string;
  createdAt: Date | string;
  fileSize?: number;       // compressed size in bytes
  originalSize?: number;   // original file size in bytes
  fileHash?: string;       // SHA-1 of original file for duplicate detection
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

// Fulfillment pipeline: verified → packed → shipped → delivered
export type MerchOrderStatus =
  | 'pending'           // legacy / pre-Razorpay
  | 'verified'          // payment confirmed (new order)
  | 'packed'            // order packed, ready to ship
  | 'shipped'           // handed to courier, tracking ID added
  | 'delivered'         // customer received
  | 'rejected'          // payment failed / cancelled
  | 'manual_verified';  // legacy admin-verified

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
  discount?: number;          // bulk discount amount (if any)
  coupon?: string;            // coupon code used (if any)
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  deliveryAddress?: DeliveryAddress;
  upiRef: string;             // UPI reference number entered by customer
  status: MerchOrderStatus;
  trackingId?: string;        // courier tracking number
  trackingCarrier?: string;   // courier name (e.g. "India Post", "DTDC")
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  adminNotes?: string;
  matchedPaymentId?: string;
  verifiedAt?: string;
  verifiedBy?: string;        // 'auto' | 'admin'
  rejectedAt?: string;
  rejectionReason?: string;
  stockDeducted?: boolean;
  stockReserved?: boolean;
  stockReservedAt?: string;
  stockRestored?: boolean;
  stockRestoredAt?: string;
  stockWarning?: boolean;       // true if order placed while item was recently out of stock
  stockWarningItems?: string[]; // which items were flagged
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
