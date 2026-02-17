// Book Festival — Firestore-synced data store
// Data is stored in Firebase Firestore (shared across all devices).
// Falls back to localStorage if Firebase is not configured.

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

// ==================== STORAGE LAYER ====================

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

function saveToLocalStorage(data: BookStoreData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch {}
}

async function loadFromFirestore(): Promise<BookStoreData | null> {
  if (!db) return null;
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(db, 'bookfest', 'data'));
    if (snap.exists()) {
      return snap.data() as BookStoreData;
    }
  } catch (e) {
    console.warn('Firestore read failed:', e);
  }
  return null;
}

async function saveToFirestore(data: BookStoreData): Promise<void> {
  if (!db) return;
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'bookfest', 'data'), {
      books: data.books,
      bills: data.bills,
      publishers: data.publishers,
      nextBillNumber: data.nextBillNumber,
    });
  } catch (e) {
    console.warn('Firestore write failed:', e);
  }
}

// Save to both cache + localStorage + Firestore
function persist(data: BookStoreData): void {
  cache = { ...data };
  saveToLocalStorage(cache);
  saveToFirestore(cache).catch(() => {});
}

// ==================== INITIALIZATION ====================

export async function initBookStore(): Promise<void> {
  if (initialized) return;

  // Try Firestore first
  const firestoreData = await loadFromFirestore();
  if (firestoreData && (firestoreData.books.length > 0 || firestoreData.bills.length > 0 || firestoreData.publishers.length > 0)) {
    cache = firestoreData;
    saveToLocalStorage(cache);
  } else {
    // Fall back to localStorage (first-time migration or offline)
    const localData = loadFromLocalStorage();
    cache = localData;
    // If local has data but Firestore doesn't, push local data up
    if (localData.books.length > 0 || localData.bills.length > 0 || localData.publishers.length > 0) {
      saveToFirestore(localData).catch(() => {});
    }
  }

  initialized = true;
  setupRealtimeListener();
}

function setupRealtimeListener(): void {
  if (!db) return;
  import('firebase/firestore').then(({ doc, onSnapshot }) => {
    onSnapshot(doc(db!, 'bookfest', 'data'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as BookStoreData;
        cache = data;
        saveToLocalStorage(data);
        notifyListeners();
      }
    }, (err) => {
      console.warn('Firestore listener error:', err);
    });
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
    cache.publishers.push({ id: generateId(), name: book.publisher, profitPercent: 0 });
  }

  persist(cache);
  return newBook;
}

export function addBooksInBulk(books: Omit<Book, 'id' | 'sold' | 'addedAt'>[]): Book[] {
  const newBooks: Book[] = [];

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
      cache.publishers.push({ id: generateId(), name: book.publisher, profitPercent: 0 });
    }
  }

  persist(cache);
  return newBooks;
}

export function updateBook(id: string, data: Partial<Book>): void {
  const idx = cache.books.findIndex((b) => b.id === id);
  if (idx !== -1) {
    cache.books[idx] = { ...cache.books[idx], ...data };
    persist(cache);
  }
}

export function deleteBook(id: string): void {
  cache.books = cache.books.filter((b) => b.id !== id);
  persist(cache);
}

export function searchBooks(query: string): Book[] {
  const q = query.toLowerCase().trim();
  if (!q) return cache.books;
  return cache.books.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.publisher.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q) ||
      b.isbn?.toLowerCase().includes(q)
  );
}

// ==================== BILLS ====================

export function getBills(): Bill[] {
  return cache.bills;
}

export function createBill(items: { bookId: string; quantity: number }[], discount: number = 0): Bill | null {
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
      publisher: book.publisher,
      price: book.price,
      quantity: item.quantity,
    });
    total += book.price * item.quantity;

    // Update sold count
    book.sold += item.quantity;
  }

  if (billItems.length === 0) return null;

  const bill: Bill = {
    id: generateId(),
    billNumber: cache.nextBillNumber,
    items: billItems,
    total,
    discount,
    grandTotal: total - discount,
    createdAt: new Date().toISOString(),
  };

  cache.bills.push(bill);
  cache.nextBillNumber++;
  persist(cache);
  return bill;
}

// ==================== PUBLISHERS ====================

export function getPublishers(): Publisher[] {
  return cache.publishers;
}

export function addPublisher(name: string, profitPercent: number = 0, contact?: string): Publisher {
  const pub: Publisher = { id: generateId(), name, profitPercent, contact };
  cache.publishers.push(pub);
  persist(cache);
  return pub;
}

export function updatePublisher(id: string, data: Partial<Publisher>): void {
  const idx = cache.publishers.findIndex((p) => p.id === id);
  if (idx !== -1) {
    const oldName = cache.publishers[idx].name;
    cache.publishers[idx] = { ...cache.publishers[idx], ...data };
    if (data.name && data.name !== oldName) {
      for (const book of cache.books) {
        if (book.publisher === oldName) book.publisher = data.name;
      }
      for (const bill of cache.bills) {
        for (const item of bill.items) {
          if (item.publisher === oldName) item.publisher = data.name;
        }
      }
    }
    persist(cache);
  }
}

export function deletePublisher(id: string): void {
  cache.publishers = cache.publishers.filter((p) => p.id !== id);
  persist(cache);
}

export function getPublisherByName(name: string): Publisher | undefined {
  return cache.publishers.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

// ==================== STATS ====================

export function getStats() {
  const totalBooks = cache.books.reduce((sum, b) => sum + b.quantity, 0);
  const totalSold = cache.books.reduce((sum, b) => sum + b.sold, 0);
  const totalRevenue = cache.bills.reduce((sum, b) => sum + b.grandTotal, 0);
  const totalBills = cache.bills.length;
  const uniquePublishers = cache.publishers.length;

  return { totalBooks, totalSold, totalRemaining: totalBooks - totalSold, totalRevenue, totalBills, uniquePublishers };
}

export function getPublisherStats() {
  const pubMap: Record<string, { publisher: string; totalBooks: number; totalSold: number; totalRemaining: number; revenue: number; profitPercent: number; profit: number }> = {};

  for (const book of cache.books) {
    if (!pubMap[book.publisher]) {
      const pub = cache.publishers.find((p) => p.name.toLowerCase() === book.publisher.toLowerCase());
      const profitPct = pub?.profitPercent ?? 0;
      pubMap[book.publisher] = { publisher: book.publisher, totalBooks: 0, totalSold: 0, totalRemaining: 0, revenue: 0, profitPercent: profitPct, profit: 0 };
    }
    pubMap[book.publisher].totalBooks += book.quantity;
    pubMap[book.publisher].totalSold += book.sold;
    pubMap[book.publisher].totalRemaining += book.quantity - book.sold;
    pubMap[book.publisher].revenue += book.sold * book.price;
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
      persist(data);
      return true;
    }
  } catch {}
  return false;
}

export function clearAllData(): void {
  persist({ books: [], bills: [], publishers: [], nextBillNumber: 1 });
}
