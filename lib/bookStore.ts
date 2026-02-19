// Book Festival — Firestore-synced data store (Collection-based)
// Data is stored in separate Firestore collections (no document size limits).
// Offline persistence is enabled in firebase.ts — page refreshes read from
// IndexedDB cache, NOT from the server, saving read quota.
// Collections: bookfest_books, bookfest_bills, bookfest_publishers, bookfest/meta

import type { Book, Bill, Publisher, BookStoreData } from '@/types/books';
import { db } from './firebase';

const STORE_KEY = 'gramakam_bookfest';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ==================== IN-MEMORY CACHE ====================

let cache: BookStoreData = { books: [], bills: [], publishers: [], nextBillNumber: 1 };
let initialized = false;
let changeListeners: Array<() => void> = [];

// Write guards — prevent onSnapshot from overwriting cache while local writes are in-flight.
// Without this, the async gap between cache update and setDoc allows stale onSnapshot data
// (triggered by OTHER writes like bulk imports) to overwrite unsaved local changes.
let booksWritesInFlight = 0;
let billsWritesInFlight = 0;
let publishersWritesInFlight = 0;

function notifyListeners() {
  for (const fn of changeListeners) {
    try { fn(); } catch {}
  }
}

// Subscribe to data changes (for real-time updates across devices)
export function onDataChange(listener: () => void): () => void {
  changeListeners.push(listener);
  return () => {
    changeListeners = changeListeners.filter((l) => l !== listener);
  };
}

// ==================== LOCAL STORAGE (offline fallback) ====================

function loadFromLocalStorage(): BookStoreData {
  if (typeof window === 'undefined') {
    return { books: [], bills: [], publishers: [], nextBillNumber: 1 };
  }
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { books: [], bills: [], publishers: [], nextBillNumber: 1 };
}

function saveToLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(cache));
  } catch {}
}

// ==================== FIRESTORE LAYER (collection-based) ====================

const COL_BOOKS = 'bookfest_books';
const COL_BILLS = 'bookfest_bills';
const COL_PUBLISHERS = 'bookfest_publishers';

async function firestoreLib() {
  return await import('firebase/firestore');
}

// Firestore rejects `undefined` values — strip them before writing.
// This prevents silent write failures when optional fields (e.g. contact) are undefined.
function cleanData(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) cleaned[key] = val;
  }
  return cleaned;
}

// Individual Firestore operations (granular writes — no size limits)
async function fsSetBook(book: Book): Promise<void> {
  if (!db) return;
  booksWritesInFlight++;
  try {
    const { doc, setDoc } = await firestoreLib();
    await setDoc(doc(db, COL_BOOKS, book.id), cleanData({ ...book }));
  } catch (e) { console.warn('Firestore write book failed:', e); } finally { booksWritesInFlight--; }
}

async function fsDeleteBook(id: string): Promise<void> {
  if (!db) return;
  booksWritesInFlight++;
  try {
    const { doc, deleteDoc } = await firestoreLib();
    await deleteDoc(doc(db, COL_BOOKS, id));
  } catch (e) { console.warn('Firestore delete book failed:', e); } finally { booksWritesInFlight--; }
}

async function fsSetBill(bill: Bill): Promise<void> {
  if (!db) return;
  billsWritesInFlight++;
  try {
    const { doc, setDoc } = await firestoreLib();
    await setDoc(doc(db, COL_BILLS, bill.id), cleanData({ ...bill }));
  } catch (e) { console.warn('Firestore write bill failed:', e); } finally { billsWritesInFlight--; }
}

async function fsSetPublisher(pub: Publisher): Promise<void> {
  if (!db) return;
  publishersWritesInFlight++;
  try {
    const { doc, setDoc } = await firestoreLib();
    await setDoc(doc(db, COL_PUBLISHERS, pub.id), cleanData({ ...pub }));
  } catch (e) { console.warn('Firestore write publisher failed:', e); } finally { publishersWritesInFlight--; }
}

async function fsDeletePublisher(id: string): Promise<void> {
  if (!db) return;
  publishersWritesInFlight++;
  try {
    const { doc, deleteDoc } = await firestoreLib();
    await deleteDoc(doc(db, COL_PUBLISHERS, id));
  } catch (e) { console.warn('Firestore delete publisher failed:', e); } finally { publishersWritesInFlight--; }
}

async function fsSetMeta(): Promise<void> {
  if (!db) return;
  try {
    const { doc, setDoc } = await firestoreLib();
    await setDoc(doc(db, 'bookfest', 'meta'), { nextBillNumber: cache.nextBillNumber });
  } catch (e) { console.warn('Firestore write meta failed:', e); }
}

// Commit an array of batch operations in chunks of 500 (Firestore limit)
async function commitInBatches(ops: Array<{ type: 'set' | 'delete'; ref: any; data?: any }>): Promise<void> {
  if (!db || ops.length === 0) return;
  const { writeBatch } = await firestoreLib();
  for (let i = 0; i < ops.length; i += 500) {
    const batch = writeBatch(db);
    const chunk = ops.slice(i, i + 500);
    for (const op of chunk) {
      if (op.type === 'set') batch.set(op.ref, op.data);
      else batch.delete(op.ref);
    }
    await batch.commit();
  }
}

// Bulk write for import / migration / clear — uses batched writes
async function fsBulkWrite(data: BookStoreData): Promise<void> {
  if (!db) return;
  try {
    const { doc, collection, getDocs } = await firestoreLib();

    // Delete all existing docs in all collections
    const [oldBooks, oldBills, oldPubs] = await Promise.all([
      getDocs(collection(db, COL_BOOKS)),
      getDocs(collection(db, COL_BILLS)),
      getDocs(collection(db, COL_PUBLISHERS)),
    ]);
    const deleteOps: Array<{ type: 'set' | 'delete'; ref: any }> = [];
    oldBooks.forEach((d) => deleteOps.push({ type: 'delete', ref: d.ref }));
    oldBills.forEach((d) => deleteOps.push({ type: 'delete', ref: d.ref }));
    oldPubs.forEach((d) => deleteOps.push({ type: 'delete', ref: d.ref }));
    await commitInBatches(deleteOps);

    // Write new data in batches
    const writeOps: Array<{ type: 'set' | 'delete'; ref: any; data?: any }> = [];
    for (const book of data.books) {
      writeOps.push({ type: 'set', ref: doc(db, COL_BOOKS, book.id), data: cleanData({ ...book }) });
    }
    for (const bill of data.bills) {
      writeOps.push({ type: 'set', ref: doc(db, COL_BILLS, bill.id), data: cleanData({ ...bill }) });
    }
    for (const pub of data.publishers) {
      writeOps.push({ type: 'set', ref: doc(db, COL_PUBLISHERS, pub.id), data: cleanData({ ...pub }) });
    }
    writeOps.push({ type: 'set', ref: doc(db, 'bookfest', 'meta'), data: { nextBillNumber: data.nextBillNumber } });
    await commitInBatches(writeOps);
  } catch (e) {
    console.warn('Firestore bulk write failed:', e);
  }
}

// ==================== INITIALIZATION ====================

// Uses ONLY onSnapshot (no getDocs) — the initial snapshot from onSnapshot
// serves as the first data load. With offline persistence enabled, the
// initial snapshot comes from IndexedDB cache (0 server reads on refresh).

// Migrate data from old single-document format (bookfest/data) to new collections
async function migrateFromOldFormat(): Promise<BookStoreData | null> {
  if (!db) return null;
  try {
    const { doc, getDoc, deleteDoc } = await firestoreLib();
    const oldSnap = await getDoc(doc(db, 'bookfest', 'data'));
    if (oldSnap.exists()) {
      const oldData = oldSnap.data() as BookStoreData;
      if (oldData.books?.length > 0 || oldData.bills?.length > 0 || oldData.publishers?.length > 0) {
        console.log('Migrating data from old format to collections...');
        // Write to new collections
        await fsBulkWrite(oldData);
        // Delete old document
        await deleteDoc(doc(db, 'bookfest', 'data'));
        console.log('Migration complete.');
        return oldData;
      }
    }
  } catch (e) {
    console.warn('Migration from old format failed:', e);
  }
  return null;
}

export async function initBookStore(): Promise<void> {
  if (initialized) return;

  // Load from localStorage immediately so UI isn't empty while Firestore connects
  const localData = loadFromLocalStorage();
  cache = localData;

  initialized = true;

  if (db) {
    // Check if old single-document format exists and migrate it first
    const migratedData = await migrateFromOldFormat();
    if (migratedData) {
      cache = migratedData;
      saveToLocalStorage();
      notifyListeners();
    }

    // Set up real-time listeners — the first snapshot IS the initial data load.
    // No separate getDocs call needed (saves reads).
    setupRealtimeListeners();
  }
}

// Listen to all 3 collections + meta doc for real-time cross-device sync.
// The initial onSnapshot callback serves as the data load (no getDocs needed).
function setupRealtimeListeners(): void {
  if (!db) return;
  let booksReady = false;
  let billsReady = false;
  let pubsReady = false;
  let metaReady = false;
  let migrationChecked = false;

  function checkMigration() {
    if (!booksReady || !billsReady || !pubsReady || !metaReady || migrationChecked) return;
    migrationChecked = true;
    // If Firestore has no data but localStorage does, migrate local → Firestore
    const localData = loadFromLocalStorage();
    if (
      cache.books.length === 0 && cache.bills.length === 0 && cache.publishers.length === 0 &&
      (localData.books.length > 0 || localData.bills.length > 0 || localData.publishers.length > 0)
    ) {
      cache = localData;
      fsBulkWrite(localData).catch(() => {});
    }
  }

  firestoreLib().then(({ collection, doc, onSnapshot }) => {
    // Books collection
    onSnapshot(collection(db!, COL_BOOKS), (snap) => {
      if (booksWritesInFlight > 0) { booksReady = true; checkMigration(); return; }
      const books: Book[] = [];
      snap.forEach((d) => books.push({ ...d.data(), id: d.id } as Book));
      cache.books = books;
      saveToLocalStorage();
      booksReady = true;
      checkMigration();
      notifyListeners();
    }, (err) => console.warn('Books listener error:', err));

    // Bills collection
    onSnapshot(collection(db!, COL_BILLS), (snap) => {
      if (billsWritesInFlight > 0) { billsReady = true; checkMigration(); return; }
      const bills: Bill[] = [];
      snap.forEach((d) => bills.push({ ...d.data(), id: d.id } as Bill));
      cache.bills = bills;
      saveToLocalStorage();
      billsReady = true;
      checkMigration();
      notifyListeners();
    }, (err) => console.warn('Bills listener error:', err));

    // Publishers collection
    onSnapshot(collection(db!, COL_PUBLISHERS), (snap) => {
      if (publishersWritesInFlight > 0) { pubsReady = true; checkMigration(); return; }
      const fsPublishers: Publisher[] = [];
      snap.forEach((d) => fsPublishers.push({ ...d.data(), id: d.id } as Publisher));

      // Reconcile: if local cache has publishers with edited profitPercent/contact
      // that Firestore doesn't have yet (e.g. previous write failed), re-push them.
      for (const fsPub of fsPublishers) {
        const localPub = cache.publishers.find((p) => p.id === fsPub.id);
        if (localPub) {
          let needsPush = false;
          if (localPub.profitPercent > 0 && (fsPub.profitPercent === 0 || fsPub.profitPercent == null)) {
            fsPub.profitPercent = localPub.profitPercent;
            needsPush = true;
          }
          if (localPub.contact && !fsPub.contact) {
            fsPub.contact = localPub.contact;
            needsPush = true;
          }
          if (needsPush) {
            fsSetPublisher(fsPub).catch(() => {});
          }
        }
      }

      cache.publishers = fsPublishers;
      saveToLocalStorage();
      pubsReady = true;
      checkMigration();
      notifyListeners();
    }, (err) => console.warn('Publishers listener error:', err));

    // Meta doc (nextBillNumber)
    onSnapshot(doc(db!, 'bookfest', 'meta'), (snap) => {
      if (snap.exists()) {
        cache.nextBillNumber = snap.data().nextBillNumber ?? cache.nextBillNumber;
        saveToLocalStorage();
      }
      metaReady = true;
      checkMigration();
    }, (err) => console.warn('Meta listener error:', err));

  }).catch(() => {});
}

export function isStoreReady(): boolean {
  return initialized;
}

// ==================== BOOKS ====================

export function getBooks(): Book[] {
  return cache.books;
}

export function findBookByIsbn(isbn: string): Book | undefined {
  return cache.books.find((b) => b.isbn && b.isbn === isbn);
}

export function addBook(book: Omit<Book, 'id' | 'sold' | 'addedAt'>): Book {
  const newBook: Book = {
    ...book,
    id: generateId(),
    sold: 0,
    addedAt: new Date().toISOString(),
  };
  cache.books.push(newBook);

  // Auto-add publisher if new
  if (book.publisher && !cache.publishers.find((p) => p.name.toLowerCase() === book.publisher.toLowerCase())) {
    const pub: Publisher = { id: generateId(), name: book.publisher, profitPercent: 0 };
    cache.publishers.push(pub);
    fsSetPublisher(pub).catch(() => {});
  }

  saveToLocalStorage();
  fsSetBook(newBook).catch(() => {});
  notifyListeners();
  return newBook;
}

export function addBooksInBulk(books: Omit<Book, 'id' | 'sold' | 'addedAt'>[]): Book[] {
  const newBooks: Book[] = [];
  const newPubs: Publisher[] = [];

  for (const book of books) {
    const newBook: Book = {
      ...book,
      id: generateId(),
      sold: 0,
      addedAt: new Date().toISOString(),
    };
    cache.books.push(newBook);
    newBooks.push(newBook);

    if (book.publisher && !cache.publishers.find((p) => p.name.toLowerCase() === book.publisher.toLowerCase())) {
      const pub: Publisher = { id: generateId(), name: book.publisher, profitPercent: 0 };
      cache.publishers.push(pub);
      newPubs.push(pub);
    }
  }

  saveToLocalStorage();
  notifyListeners();

  // Write all new books + publishers in batches (not individual calls)
  if (db) {
    booksWritesInFlight++;
    if (newPubs.length > 0) publishersWritesInFlight++;
    firestoreLib().then(({ doc }) => {
      const ops: Array<{ type: 'set' | 'delete'; ref: any; data?: any }> = [];
      for (const b of newBooks) {
        ops.push({ type: 'set', ref: doc(db!, COL_BOOKS, b.id), data: cleanData({ ...b }) });
      }
      for (const p of newPubs) {
        ops.push({ type: 'set', ref: doc(db!, COL_PUBLISHERS, p.id), data: cleanData({ ...p }) });
      }
      return commitInBatches(ops);
    }).catch(() => {}).finally(() => {
      booksWritesInFlight--;
      if (newPubs.length > 0) publishersWritesInFlight--;
    });
  }

  return newBooks;
}

export function updateBook(id: string, data: Partial<Book>): void {
  const idx = cache.books.findIndex((b) => b.id === id);
  if (idx !== -1) {
    cache.books[idx] = { ...cache.books[idx], ...data };
    saveToLocalStorage();
    fsSetBook(cache.books[idx]).catch(() => {});
    notifyListeners();
  }
}

export function deleteBook(id: string): void {
  cache.books = cache.books.filter((b) => b.id !== id);
  saveToLocalStorage();
  fsDeleteBook(id).catch(() => {});
  notifyListeners();
}

export function searchBooks(query: string): Book[] {
  const q = query.toLowerCase().trim();
  if (!q) return cache.books;
  return cache.books.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.localTitle?.toLowerCase().includes(q) ||
      b.publisher.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q) ||
      b.isbn?.toLowerCase().includes(q)
  );
}

// ==================== BILLS ====================

export function getBills(): Bill[] {
  return cache.bills;
}

export function markBillAsPaid(billId: string): Bill | null {
  const idx = cache.bills.findIndex((b) => b.id === billId);
  if (idx === -1) return null;
  cache.bills[idx] = { ...cache.bills[idx], status: 'paid', paidAt: new Date().toISOString() };
  saveToLocalStorage();
  fsSetBill(cache.bills[idx]).catch(() => {});
  notifyListeners();
  return cache.bills[idx];
}

export function createBill(items: { bookId: string; quantity: number }[], discount: number = 0, customerName?: string, customerPhone?: string, status: 'paid' | 'unpaid' = 'paid'): Bill | null {
  const billItems: Bill['items'] = [];
  let total = 0;

  for (const item of items) {
    const book = cache.books.find((b) => b.id === item.bookId);
    if (!book) continue;
    const available = book.quantity - book.sold;
    if (item.quantity > available) continue;

    billItems.push({
      bookId: book.id,
      title: book.title,
      ...(book.localTitle && { localTitle: book.localTitle }),
      publisher: book.publisher,
      price: book.price,
      quantity: item.quantity,
    });
    total += book.price * item.quantity;

    // Update sold count
    book.sold += item.quantity;
    fsSetBook(book).catch(() => {});
  }

  if (billItems.length === 0) return null;

  const bill: Bill = {
    id: generateId(),
    billNumber: cache.nextBillNumber,
    items: billItems,
    total,
    discount,
    grandTotal: total - discount,
    status,
    ...(customerName?.trim() && { customerName: customerName.trim() }),
    ...(customerPhone?.trim() && { customerPhone: customerPhone.trim() }),
    createdAt: new Date().toISOString(),
  };

  cache.bills.push(bill);
  cache.nextBillNumber++;
  saveToLocalStorage();
  fsSetBill(bill).catch(() => {});
  fsSetMeta().catch(() => {});
  notifyListeners();
  return bill;
}

// Edit an existing bill — reverse old stock, apply new stock, recalculate totals
export function editBill(
  billId: string,
  newItems: { bookId: string; quantity: number }[],
  discount: number = 0,
  customerName?: string,
  customerPhone?: string
): Bill | null {
  const billIdx = cache.bills.findIndex((b) => b.id === billId);
  if (billIdx === -1) return null;
  const oldBill = cache.bills[billIdx];

  // 1. Reverse old stock — add back sold quantities
  // Save snapshots so we can rollback if new items fail
  const stockSnapshots: { bookId: string; oldSold: number }[] = [];
  for (const oldItem of oldBill.items) {
    const book = cache.books.find((b) => b.id === oldItem.bookId);
    if (book) {
      stockSnapshots.push({ bookId: book.id, oldSold: book.sold });
      book.sold = Math.max(0, book.sold - oldItem.quantity);
    }
  }

  // 2. Build new bill items and apply new stock
  const billItems: Bill['items'] = [];
  let total = 0;

  for (const item of newItems) {
    if (item.quantity <= 0) continue;
    const book = cache.books.find((b) => b.id === item.bookId);
    if (!book) continue;
    const available = book.quantity - book.sold;
    const qty = Math.min(item.quantity, available);
    if (qty <= 0) continue;

    billItems.push({
      bookId: book.id,
      title: book.title,
      ...(book.localTitle && { localTitle: book.localTitle }),
      publisher: book.publisher,
      price: book.price,
      quantity: qty,
    });
    total += book.price * qty;

    book.sold += qty;
  }

  if (billItems.length === 0) {
    // Rollback stock reversal — restore old sold counts
    for (const snap of stockSnapshots) {
      const book = cache.books.find((b) => b.id === snap.bookId);
      if (book) book.sold = snap.oldSold;
    }
    return null;
  }

  // Persist all book stock changes to Firestore
  const touchedBookIds = new Set([...stockSnapshots.map(s => s.bookId), ...billItems.map(i => i.bookId)]);
  for (const bookId of touchedBookIds) {
    const book = cache.books.find((b) => b.id === bookId);
    if (book) fsSetBook(book).catch(() => {});
  }

  // Cap discount to avoid negative total
  const cappedDiscount = Math.min(discount, total);

  // 3. Update the bill in-place (keep same id, billNumber, createdAt, status)
  // Explicitly set customer fields (don't rely on ...oldBill spread) so clearing works
  const updatedBill: Bill = {
    id: oldBill.id,
    billNumber: oldBill.billNumber,
    createdAt: oldBill.createdAt,
    status: oldBill.status,
    ...(oldBill.paidAt && { paidAt: oldBill.paidAt }),
    items: billItems,
    total,
    discount: cappedDiscount,
    grandTotal: total - cappedDiscount,
    ...(customerName?.trim() ? { customerName: customerName.trim() } : {}),
    ...(customerPhone?.trim() ? { customerPhone: customerPhone.trim() } : {}),
    editedAt: new Date().toISOString(),
  };

  cache.bills[billIdx] = updatedBill;
  saveToLocalStorage();
  fsSetBill(updatedBill).catch(() => {});
  notifyListeners();
  return updatedBill;
}

// Delete a bill entirely — reverse all stock
export function deleteBill(billId: string): boolean {
  const billIdx = cache.bills.findIndex((b) => b.id === billId);
  if (billIdx === -1) return false;
  const bill = cache.bills[billIdx];

  // Reverse stock
  for (const item of bill.items) {
    const book = cache.books.find((b) => b.id === item.bookId);
    if (book) {
      book.sold = Math.max(0, book.sold - item.quantity);
      fsSetBook(book).catch(() => {});
    }
  }

  cache.bills.splice(billIdx, 1);
  saveToLocalStorage();

  // Delete from Firestore — use write guard to prevent onSnapshot from re-adding the bill
  if (db) {
    billsWritesInFlight++;
    firestoreLib().then(({ doc, deleteDoc }) => {
      return deleteDoc(doc(db!, COL_BILLS, billId));
    }).catch(() => {}).finally(() => { billsWritesInFlight--; });
  }

  notifyListeners();
  return true;
}

// ==================== PUBLISHERS ====================

export function getPublishers(): Publisher[] {
  return cache.publishers;
}

export function addPublisher(name: string, profitPercent: number = 0, contact?: string): Publisher {
  const pub: Publisher = { id: generateId(), name, profitPercent, ...(contact ? { contact } : {}) };
  cache.publishers.push(pub);
  saveToLocalStorage();
  fsSetPublisher(pub).catch(() => {});
  notifyListeners();
  return pub;
}

export function updatePublisher(id: string, data: Partial<Publisher>): void {
  const idx = cache.publishers.findIndex((p) => p.id === id);
  if (idx !== -1) {
    const oldName = cache.publishers[idx].name;
    cache.publishers[idx] = { ...cache.publishers[idx], ...data };
    if (data.name && data.name !== oldName) {
      for (const book of cache.books) {
        if (book.publisher === oldName) {
          book.publisher = data.name;
          fsSetBook(book).catch(() => {});
        }
      }
      for (const bill of cache.bills) {
        let updated = false;
        for (const item of bill.items) {
          if (item.publisher === oldName) {
            item.publisher = data.name;
            updated = true;
          }
        }
        if (updated) fsSetBill(bill).catch(() => {});
      }
    }
    saveToLocalStorage();
    // Capture publisher snapshot BEFORE any async gap
    const pubSnapshot = { ...cache.publishers[idx] };
    fsSetPublisher(pubSnapshot).catch((e) => console.warn('Publisher write failed:', e));
    notifyListeners();
  }
}

export function deletePublisher(id: string): void {
  cache.publishers = cache.publishers.filter((p) => p.id !== id);
  saveToLocalStorage();
  fsDeletePublisher(id).catch(() => {});
  notifyListeners();
}

export function getPublisherByName(name: string): Publisher | undefined {
  return cache.publishers.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

// ==================== STATS ====================

export function getStats() {
  const totalBooks = cache.books.reduce((sum, b) => sum + b.quantity, 0);
  const totalSold = cache.books.reduce((sum, b) => sum + b.sold, 0);

  // Only count paid (or legacy) bills in revenue — unpaid/credit bills excluded
  const paidBills = cache.bills.filter((b) => (b.status ?? 'paid') === 'paid');
  const unpaidBills = cache.bills.filter((b) => b.status === 'unpaid');

  const totalRevenue = paidBills.reduce((sum, b) => sum + b.grandTotal, 0);
  const totalBills = cache.bills.length;
  const totalPaidBills = paidBills.length;
  const totalUnpaidBills = unpaidBills.length;
  const totalPendingAmount = unpaidBills.reduce((sum, b) => sum + b.grandTotal, 0);
  const uniquePublishers = cache.publishers.length;

  return { totalBooks, totalSold, totalRemaining: totalBooks - totalSold, totalRevenue, totalBills, totalPaidBills, totalUnpaidBills, totalPendingAmount, uniquePublishers };
}

export function getPublisherStats() {
  const pubMap: Record<string, { publisher: string; totalBooks: number; totalSold: number; totalRemaining: number; revenue: number; profitPercent: number; profit: number }> = {};

  // Stock counts (totalSold = physically given out, regardless of payment status)
  for (const book of cache.books) {
    if (!pubMap[book.publisher]) {
      const pub = cache.publishers.find((p) => p.name.toLowerCase() === book.publisher.toLowerCase());
      const profitPct = pub?.profitPercent ?? 0;
      pubMap[book.publisher] = { publisher: book.publisher, totalBooks: 0, totalSold: 0, totalRemaining: 0, revenue: 0, profitPercent: profitPct, profit: 0 };
    }
    pubMap[book.publisher].totalBooks += book.quantity;
    pubMap[book.publisher].totalSold += book.sold;
    pubMap[book.publisher].totalRemaining += book.quantity - book.sold;
    // revenue starts at 0 — calculated from paid bills below
  }

  // Revenue only from paid (or legacy) bills — credit/unpaid excluded
  // Discount is distributed proportionally across publishers in multi-item bills
  for (const bill of cache.bills) {
    if (bill.status === 'unpaid') continue;
    const billSubtotal = bill.items.reduce((s, i) => s + i.price * i.quantity, 0);
    for (const item of bill.items) {
      if (pubMap[item.publisher]) {
        const itemAmount = item.price * item.quantity;
        const itemDiscount = billSubtotal > 0 ? (bill.discount * itemAmount / billSubtotal) : 0;
        pubMap[item.publisher].revenue += itemAmount - itemDiscount;
      }
    }
  }

  for (const key of Object.keys(pubMap)) {
    pubMap[key].profit = (pubMap[key].revenue * pubMap[key].profitPercent) / 100;
  }

  return Object.values(pubMap).sort((a, b) => b.revenue - a.revenue);
}

// ==================== BACKUP / RESTORE ====================

export function exportAllData(): string {
  return JSON.stringify(cache, null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json) as BookStoreData;
    if (data.books && data.bills) {
      cache = data;
      saveToLocalStorage();
      fsBulkWrite(data).catch(() => {});
      notifyListeners();
      return true;
    }
  } catch {}
  return false;
}

export function clearAllData(): void {
  const empty: BookStoreData = { books: [], bills: [], publishers: [], nextBillNumber: 1 };
  cache = empty;
  saveToLocalStorage();
  fsBulkWrite(empty).catch(() => {});
  notifyListeners();
}
