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
  limit,
  serverTimestamp,
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
  SiteConfig,
  MediaItem,
  Award,
  GameScore,
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

// ==================== AWARDS ====================

export async function getAwards(): Promise<Award[]> {
  const ref = collection(requireDb(), 'awards');
  const q = query(ref, orderBy('year', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt,
  })) as Award[];
}

export async function addAward(
  award: Omit<Award, 'id' | 'createdAt'>
): Promise<string> {
  const ref = collection(requireDb(), 'awards');
  const docRef = await addDoc(ref, { ...award, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function deleteAward(id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'awards', id));
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

/** Update an order by its human-readable orderId (GRM-xxx). Used by checkout flow. */
export async function updateMerchOrderByOrderId(
  orderId: string,
  data: Partial<MerchOrder>
): Promise<void> {
  const ref = collection(requireDb(), 'merch_orders');
  const q = query(ref, where('orderId', '==', orderId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error(`Order ${orderId} not found`);
  await updateDoc(snap.docs[0].ref, data);
}

export async function trackOrder(input: string): Promise<MerchOrder | null> {
  const db = requireDb();
  const ref = collection(db, 'merch_orders');
  const clean = input.trim();

  // Try by orderId first (GRM-xxxx format)
  const byId = await getDocs(query(ref, where('orderId', '==', clean.toUpperCase()), limit(1)));
  if (!byId.empty) {
    const d = byId.docs[0];
    return { id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt } as MerchOrder;
  }

  // Try by lowercase orderId (in case user typed lowercase)
  const byIdLower = await getDocs(query(ref, where('orderId', '==', clean), limit(1)));
  if (!byIdLower.empty) {
    const d = byIdLower.docs[0];
    return { id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt } as MerchOrder;
  }

  // Try by mobile (last 10 digits, most recent order)
  const mobile = clean.replace(/\D/g, '').slice(-10);
  if (mobile.length === 10) {
    const byMobile = await getDocs(query(ref, where('customerMobile', '==', mobile)));
    if (!byMobile.empty) {
      // Sort client-side to avoid requiring a composite Firestore index
      const sorted = byMobile.docs.sort((a, b) => {
        const at = a.data().createdAt?.toDate?.()?.getTime() ?? 0;
        const bt = b.data().createdAt?.toDate?.()?.getTime() ?? 0;
        return bt - at;
      });
      const d = sorted[0];
      return { id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt } as MerchOrder;
    }
  }

  return null;
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

// ==================== GAME SCORES ====================

export async function submitGameScore(data: { name: string; score: number; level: number }): Promise<string> {
  const ref = await addDoc(collection(requireDb(), 'game_scores'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTopGameScores(limitCount = 10): Promise<GameScore[]> {
  const { limit } = await import('firebase/firestore');
  const q = query(
    collection(requireDb(), 'game_scores'),
    orderBy('score', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GameScore));
}
