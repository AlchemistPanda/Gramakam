// Firebase CRUD services for Gramakam
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth, storage } from './firebase';
import type {
  GalleryItem,
  FeedPost,
  ContactSubmission,
  MerchPrebook,
  MerchOrder,
  MerchOrderStatus,
  UpiPayment,
  SiteConfig,
  MediaItem,
} from '@/types';

// Helper to ensure Firebase is ready
function requireDb() {
  if (!db) throw new Error('Firebase Firestore is not configured.');
  return db;
}
function requireAuth() {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  return auth;
}
function requireStorage() {
  if (!storage) throw new Error('Firebase Storage is not configured.');
  return storage;
}

// ==================== AUTH ====================

export async function adminLogin(email: string, password: string) {
  return signInWithEmailAndPassword(requireAuth(), email, password);
}

export async function adminLogout() {
  return signOut(requireAuth());
}

// ==================== GALLERY ====================

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const galleryRef = collection(requireDb(), 'gallery');
  const q = query(galleryRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt,
  })) as GalleryItem[];
}

export async function getGalleryYears(): Promise<number[]> {
  const items = await getGalleryItems();
  const years = [...new Set(items.map((item) => item.year))];
  return years.sort((a, b) => b - a);
}

export async function addGalleryItem(
  item: Omit<GalleryItem, 'id' | 'createdAt'>
): Promise<string> {
  const galleryRef = collection(requireDb(), 'gallery');
  const docRef = await addDoc(galleryRef, {
    ...item,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateGalleryItem(
  id: string,
  data: Partial<GalleryItem>
): Promise<void> {
  const docRef = doc(requireDb(), 'gallery', id);
  await updateDoc(docRef, data);
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const docRef = doc(requireDb(), 'gallery', id);
  await deleteDoc(docRef);
}

// ==================== FEED POSTS ====================

export async function getFeedPosts(): Promise<FeedPost[]> {
  const postsRef = collection(requireDb(), 'posts');
  const q = query(postsRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    date: d.data().date?.toDate?.()?.toISOString() || d.data().date,
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt,
  })) as FeedPost[];
}

export async function addFeedPost(
  post: Omit<FeedPost, 'id' | 'createdAt'>
): Promise<string> {
  const postsRef = collection(requireDb(), 'posts');
  const docRef = await addDoc(postsRef, {
    ...post,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateFeedPost(
  id: string,
  data: Partial<FeedPost>
): Promise<void> {
  const docRef = doc(requireDb(), 'posts', id);
  await updateDoc(docRef, data);
}

export async function deleteFeedPost(id: string): Promise<void> {
  const docRef = doc(requireDb(), 'posts', id);
  await deleteDoc(docRef);
}

// ==================== MEDIA / PRESS ====================

export async function getMediaItems(): Promise<MediaItem[]> {
  const ref = collection(requireDb(), 'media_items');
  const q = query(ref, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt,
  })) as MediaItem[];
}

export async function addMediaItem(
  item: Omit<MediaItem, 'id' | 'createdAt'>
): Promise<string> {
  const colRef = collection(requireDb(), 'media_items');
  const docRef = await addDoc(colRef, { ...item, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function deleteMediaItem(id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'media_items', id));
}

// ==================== CONTACT SUBMISSIONS ====================

export async function submitContact(data: {
  name: string;
  email: string;
  message: string;
}): Promise<string> {
  const contactsRef = collection(requireDb(), 'contacts');
  const docRef = await addDoc(contactsRef, {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  const contactsRef = collection(requireDb(), 'contacts');
  const q = query(contactsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt,
  })) as ContactSubmission[];
}

export async function markContactRead(id: string): Promise<void> {
  const docRef = doc(requireDb(), 'contacts', id);
  await updateDoc(docRef, { read: true });
}

export async function deleteContact(id: string): Promise<void> {
  const docRef = doc(requireDb(), 'contacts', id);
  await deleteDoc(docRef);
}

// ==================== MERCHANDISE PRE-BOOKINGS ====================

export async function submitPrebook(data: {
  name: string;
  email: string;
  mobile: string;
  item: string;
  size: string;
  quantity: number;
}): Promise<string> {
  const prebooksRef = collection(requireDb(), 'prebooks');
  const docRef = await addDoc(prebooksRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPrebookEntries(): Promise<MerchPrebook[]> {
  const prebooksRef = collection(requireDb(), 'prebooks');
  const q = query(prebooksRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt,
  })) as MerchPrebook[];
}

export async function deletePrebook(id: string): Promise<void> {
  const docRef = doc(requireDb(), 'prebooks', id);
  await deleteDoc(docRef);
}

// ==================== MERCH ORDERS ====================

export async function createMerchOrder(data: Omit<MerchOrder, 'id' | 'createdAt'>): Promise<string> {
  const ordersRef = collection(requireDb(), 'merch_orders');
  const docRef = await addDoc(ordersRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getMerchOrders(): Promise<MerchOrder[]> {
  const ordersRef = collection(requireDb(), 'merch_orders');
  const q = query(ordersRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt,
  })) as MerchOrder[];
}

export async function updateMerchOrderStatus(
  id: string,
  status: MerchOrderStatus,
  extra?: Partial<MerchOrder>
): Promise<void> {
  const docRef = doc(requireDb(), 'merch_orders', id);
  await updateDoc(docRef, { status, ...extra });
}

export async function deleteMerchOrder(id: string): Promise<void> {
  const docRef = doc(requireDb(), 'merch_orders', id);
  await deleteDoc(docRef);
}

// ==================== UPI PAYMENTS ====================

export async function getUpiPayments(): Promise<UpiPayment[]> {
  const paymentsRef = collection(requireDb(), 'upi_payments');
  const q = query(paymentsRef, orderBy('capturedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    capturedAt: d.data().capturedAt?.toDate?.()?.toISOString() || d.data().capturedAt,
  })) as UpiPayment[];
}

// Parses SMS datetime format "DD-MM-YYYY HH:MM:SS" → Date
function parseSmsDatetime(dt: string): Date | null {
  // "26-03-2026 09:09:40"
  const match = dt.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh, min, ss] = match;
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+05:30`);
}

export async function verifyOrderByUpiRef(
  orderId: string,
  upiRef: string,
  orderTotal: number
): Promise<boolean> {
  const database = requireDb();
  const paymentsRef = collection(database, 'upi_payments');
  const q = query(
    paymentsRef,
    where('upiRef', '==', upiRef),
    where('matched', '==', false)
  );
  const snapshot = await getDocs(q);

  const now = Date.now();
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

  const matchingPayment = snapshot.docs.find((d) => {
    const data = d.data();
    // Check amount
    if (data.amount < orderTotal) return false;
    // Check time: payment must be within the last 2 hours
    const paymentTime = parseSmsDatetime(data.datetime);
    if (!paymentTime) return true; // if we can't parse, don't block on time
    return now - paymentTime.getTime() <= TWO_HOURS_MS;
  });
  if (!matchingPayment) return false;

  // Atomically link order and payment
  const orderRef = doc(database, 'merch_orders', orderId);
  const paymentRef = doc(database, 'upi_payments', matchingPayment.id);

  await runTransaction(database, async (transaction) => {
    const paymentSnap = await transaction.get(paymentRef);
    if (paymentSnap.data()?.matched) return; // already matched by another request

    transaction.update(orderRef, {
      status: 'verified',
      matchedPaymentId: matchingPayment.id,
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'auto',
    });
    transaction.update(paymentRef, {
      matched: true,
      matchedOrderId: orderId,
    });
  });

  return true;
}

// ==================== SITE CONFIG ====================

export async function getSiteConfig(): Promise<SiteConfig | null> {
  const configDocRef = doc(requireDb(), 'config', 'site');
  const snapshot = await getDoc(configDocRef);
  if (snapshot.exists()) {
    return snapshot.data() as SiteConfig;
  }
  return null;
}

export async function updateSiteConfig(data: Partial<SiteConfig>): Promise<void> {
  const configDocRef = doc(requireDb(), 'config', 'site');
  const { setDoc } = await import('firebase/firestore');
  await setDoc(configDocRef, data, { merge: true });
}

// ==================== FILE UPLOAD ====================

export async function uploadImage(
  file: File,
  path: string
): Promise<string> {
  const storageRef = ref(requireStorage(), path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export async function deleteImage(path: string): Promise<void> {
  const storageRef = ref(requireStorage(), path);
  await deleteObject(storageRef);
}
