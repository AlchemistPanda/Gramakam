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

/** Returns the set of all fileHash values already in the gallery — for duplicate detection. */
export async function getGalleryHashes(): Promise<Set<string>> {
  const items = await getGalleryItems();
  const hashes = new Set<string>();
  items.forEach((i) => { if (i.fileHash) hashes.add(i.fileHash); });
  return hashes;
}

/** Compute a SHA-1 hex hash of a File (browser-side). */
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
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

  const stripUndefinedDeep = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(stripUndefinedDeep);
    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefinedDeep(v)]);
      return Object.fromEntries(entries);
    }
    return value;
  };

  const docRef = await addDoc(ordersRef, {
    ...(stripUndefinedDeep(data) as Omit<MerchOrder, 'id' | 'createdAt'>),
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

function toMerchOrder(d: { id: string; data: () => Record<string, unknown> }): MerchOrder {
  return { id: d.id, ...d.data(), createdAt: (d.data().createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString() || d.data().createdAt } as MerchOrder;
}

function sortByDateDesc(docs: { id: string; data: () => Record<string, unknown> }[]) {
  return docs.sort((a, b) => {
    const at = (a.data().createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() ?? 0;
    const bt = (b.data().createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() ?? 0;
    return bt - at;
  });
}

/** Returns all orders matching an email or mobile, or a single order by orderId. */
export async function trackOrders(input: string): Promise<MerchOrder[]> {
  const db = requireDb();
  const ref = collection(db, 'merch_orders');
  const clean = input.trim();

  // Try by orderId first (GRM-xxxx format)
  const byId = await getDocs(query(ref, where('orderId', '==', clean.toUpperCase()), limit(1)));
  if (!byId.empty) return [toMerchOrder(byId.docs[0])];

  const byIdLower = await getDocs(query(ref, where('orderId', '==', clean), limit(1)));
  if (!byIdLower.empty) return [toMerchOrder(byIdLower.docs[0])];

  // Try by email — return ALL orders sorted newest first
  if (clean.includes('@')) {
    const byEmail = await getDocs(query(ref, where('customerEmail', '==', clean.toLowerCase())));
    if (!byEmail.empty) return sortByDateDesc([...byEmail.docs]).map(toMerchOrder);
  }

  // Try by mobile — return ALL orders sorted newest first
  const mobile = clean.replace(/\D/g, '').slice(-10);
  if (mobile.length === 10) {
    const byMobile = await getDocs(query(ref, where('customerMobile', '==', mobile)));
    if (!byMobile.empty) return sortByDateDesc([...byMobile.docs]).map(toMerchOrder);
  }

  return [];
}

export async function trackOrder(input: string): Promise<MerchOrder | null> {
  const results = await trackOrders(input);
  return results[0] ?? null;
}

// ==================== STOCK MANAGEMENT ====================
// Stock is stored in Firestore `merch_stock` collection.
// Each doc has id = productId, fields:
//   count: number (-1 = unlimited, 0 = paused)
//   sizes?: Record<string, number> — per-size stock for sized products (-1 = unlimited per size)
//   resumedFromOutOfStock?: string — ISO timestamp set when admin resumes from paused

export interface StockDoc {
  count: number;
  sizes?: Record<string, number>;
  resumedFromOutOfStock?: string;
}

export async function getStockDocs(): Promise<Record<string, StockDoc>> {
  const ref = collection(requireDb(), 'merch_stock');
  const snap = await getDocs(ref);
  const docs: Record<string, StockDoc> = {};
  snap.docs.forEach((d) => {
    docs[d.id] = {
      count: d.data().count ?? -1,
      sizes: d.data().sizes ?? undefined,
      resumedFromOutOfStock: d.data().resumedFromOutOfStock ?? undefined,
    };
  });
  return docs;
}

// Legacy compat — returns just counts
export async function getStockCounts(): Promise<Record<string, number>> {
  const docs = await getStockDocs();
  const counts: Record<string, number> = {};
  for (const [id, doc] of Object.entries(docs)) {
    counts[id] = doc.count;
  }
  return counts;
}

export async function setStockDoc(productId: string, data: Partial<StockDoc>): Promise<void> {
  const docRef = doc(requireDb(), 'merch_stock', productId);
  const { setDoc: firestoreSetDoc } = await import('firebase/firestore');
  await firestoreSetDoc(docRef, data, { merge: true });
}

export async function setStockCount(productId: string, count: number): Promise<void> {
  await setStockDoc(productId, { count });
}

export async function setSizeStock(productId: string, size: string, count: number): Promise<void> {
  const docRef = doc(requireDb(), 'merch_stock', productId);
  const { setDoc: firestoreSetDoc } = await import('firebase/firestore');
  await firestoreSetDoc(docRef, { sizes: { [size]: count } }, { merge: true });
}

export async function addStockCount(productId: string, quantity: number): Promise<number> {
  const { runTransaction } = await import('firebase/firestore');
  const database = requireDb();

  return runTransaction(database, async (transaction) => {
    const stockRef = doc(database, 'merch_stock', productId);
    const snap = await transaction.get(stockRef);
    const existingData = snap.exists() ? snap.data() : {};
    const current = existingData.count ?? -1;
    const next = current === -1 ? quantity : current + quantity;
    // Preserve all existing fields (sizes, resumedFromOutOfStock, etc.)
    transaction.set(stockRef, { ...existingData, count: next });
    return next;
  });
}

export async function addSizeStock(productId: string, size: string, quantity: number): Promise<number> {
  const { runTransaction } = await import('firebase/firestore');
  const database = requireDb();

  return runTransaction(database, async (transaction) => {
    const stockRef = doc(database, 'merch_stock', productId);
    const snap = await transaction.get(stockRef);
    const existingData = snap.exists() ? snap.data() : {};
    const currentSizes = existingData.sizes ?? {};
    const current = currentSizes[size] ?? -1;
    const next = current === -1 ? quantity : current + quantity;
    // Preserve all existing fields and merge sizes properly
    transaction.set(stockRef, {
      ...existingData,
      sizes: { ...currentSizes, [size]: next },
    });
    return next;
  });
}

/** Get effective stock for a specific product+size. Returns -1 for unlimited, 0+ for count. */
export function getEffectiveSizeStock(stockDoc: StockDoc | undefined, size?: string): number {
  if (!stockDoc) return -1; // no stock doc → unlimited
  if (stockDoc.count === 0) return 0; // product paused
  if (size && stockDoc.sizes && size in stockDoc.sizes) {
    return stockDoc.sizes[size];
  }
  return stockDoc.count; // fall back to product-level count
}

/** Decrement stock for purchased items. Returns true if stock was sufficient. */
export async function decrementStock(items: { productId: string; size?: string; quantity: number }[]): Promise<boolean> {
  const { runTransaction } = await import('firebase/firestore');
  const database = requireDb();

  return runTransaction(database, async (transaction) => {
    const reads: { productId: string; size?: string; quantity: number; ref: ReturnType<typeof doc>; data: StockDoc }[] = [];
    for (const item of items) {
      const stockRef = doc(database, 'merch_stock', item.productId);
      const snap = await transaction.get(stockRef);
      const data: StockDoc = snap.exists()
        ? { count: snap.data().count ?? -1, sizes: snap.data().sizes, resumedFromOutOfStock: snap.data().resumedFromOutOfStock }
        : { count: -1 };
      reads.push({ productId: item.productId, size: item.size, quantity: item.quantity, ref: stockRef, data });
    }

    // Check sufficiency
    for (const r of reads) {
      const effective = getEffectiveSizeStock(r.data, r.size);
      if (effective !== -1 && effective < r.quantity) {
        return false;
      }
    }

    // Decrement
    for (const r of reads) {
      if (r.size && r.data.sizes && r.size in r.data.sizes && r.data.sizes[r.size] !== -1) {
        // Decrement per-size stock
        transaction.update(r.ref, { [`sizes.${r.size}`]: r.data.sizes[r.size] - r.quantity });
      } else if (r.data.count !== -1) {
        // Decrement product-level stock
        transaction.update(r.ref, { count: r.data.count - r.quantity });
      }
    }

    return true;
  });
}


/** Restore stock for deleted/cancelled orders. Inverse of decrementStock. */
export async function restoreStock(items: { productId: string; size?: string; quantity: number }[]): Promise<void> {
  const { runTransaction } = await import('firebase/firestore');
  const database = requireDb();

  await runTransaction(database, async (transaction) => {
    for (const item of items) {
      const stockRef = doc(database, 'merch_stock', item.productId);
      const snap = await transaction.get(stockRef);
      if (!snap.exists()) continue; // no stock doc → unlimited, nothing to restore
      const data: StockDoc = {
        count: snap.data().count ?? -1,
        sizes: snap.data().sizes,
      };
      if (item.size && data.sizes && item.size in data.sizes && data.sizes[item.size] !== -1) {
        transaction.update(stockRef, { [`sizes.${item.size}`]: data.sizes[item.size] + item.quantity });
      } else if (data.count !== -1) {
        transaction.update(stockRef, { count: data.count + item.quantity });
      }
      // -1 (unlimited) stocks are never touched
    }
  });
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
