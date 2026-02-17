// Book Festival — LocalStorage-based data store
// Works fully offline. Data persists in the browser.
// Can be synced to Firebase later if needed.

import type { Book, Bill, Publisher, BookStoreData } from '@/types/books';

const STORE_KEY = 'gramakam_bookfest';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadStore(): BookStoreData {
  if (typeof window === 'undefined') {
    return { books: [], bills: [], publishers: [], nextBillNumber: 1 };
  }
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { books: [], bills: [], publishers: [], nextBillNumber: 1 };
}

function saveStore(data: BookStoreData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

// ==================== BOOKS ====================

export function getBooks(): Book[] {
  return loadStore().books;
}

export function addBook(book: Omit<Book, 'id' | 'sold' | 'addedAt'>): Book {
  const store = loadStore();
  const newBook: Book = {
    ...book,
    id: generateId(),
    sold: 0,
    addedAt: new Date().toISOString(),
  };
  store.books.push(newBook);

  // Auto-add publisher if new
  if (book.publisher && !store.publishers.find((p) => p.name.toLowerCase() === book.publisher.toLowerCase())) {
    store.publishers.push({ id: generateId(), name: book.publisher, profitPercent: 0 });
  }

  saveStore(store);
  return newBook;
}

export function addBooksInBulk(books: Omit<Book, 'id' | 'sold' | 'addedAt'>[]): Book[] {
  const store = loadStore();
  const newBooks: Book[] = [];

  for (const book of books) {
    const newBook: Book = {
      ...book,
      id: generateId(),
      sold: 0,
      addedAt: new Date().toISOString(),
    };
    store.books.push(newBook);
    newBooks.push(newBook);

    if (book.publisher && !store.publishers.find((p) => p.name.toLowerCase() === book.publisher.toLowerCase())) {
      store.publishers.push({ id: generateId(), name: book.publisher, profitPercent: 0 });
    }
  }

  saveStore(store);
  return newBooks;
}

export function updateBook(id: string, data: Partial<Book>): void {
  const store = loadStore();
  const idx = store.books.findIndex((b) => b.id === id);
  if (idx !== -1) {
    store.books[idx] = { ...store.books[idx], ...data };
    saveStore(store);
  }
}

export function deleteBook(id: string): void {
  const store = loadStore();
  store.books = store.books.filter((b) => b.id !== id);
  saveStore(store);
}

export function searchBooks(query: string): Book[] {
  const store = loadStore();
  const q = query.toLowerCase().trim();
  if (!q) return store.books;
  return store.books.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.publisher.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q)
  );
}

// ==================== BILLS ====================

export function getBills(): Bill[] {
  return loadStore().bills;
}

export function createBill(items: { bookId: string; quantity: number }[], discount: number = 0): Bill | null {
  const store = loadStore();
  const billItems: Bill['items'] = [];
  let total = 0;

  for (const item of items) {
    const book = store.books.find((b) => b.id === item.bookId);
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
    billNumber: store.nextBillNumber,
    items: billItems,
    total,
    discount,
    grandTotal: total - discount,
    createdAt: new Date().toISOString(),
  };

  store.bills.push(bill);
  store.nextBillNumber++;
  saveStore(store);
  return bill;
}

// ==================== PUBLISHERS ====================

export function getPublishers(): Publisher[] {
  return loadStore().publishers;
}

export function addPublisher(name: string, profitPercent: number = 0, contact?: string): Publisher {
  const store = loadStore();
  const pub: Publisher = { id: generateId(), name, profitPercent, contact };
  store.publishers.push(pub);
  saveStore(store);
  return pub;
}

export function updatePublisher(id: string, data: Partial<Publisher>): void {
  const store = loadStore();
  const idx = store.publishers.findIndex((p) => p.id === id);
  if (idx !== -1) {
    const oldName = store.publishers[idx].name;
    store.publishers[idx] = { ...store.publishers[idx], ...data };
    // If name changed, update all books referencing the old name
    if (data.name && data.name !== oldName) {
      for (const book of store.books) {
        if (book.publisher === oldName) book.publisher = data.name;
      }
      for (const bill of store.bills) {
        for (const item of bill.items) {
          if (item.publisher === oldName) item.publisher = data.name;
        }
      }
    }
    saveStore(store);
  }
}

export function deletePublisher(id: string): void {
  const store = loadStore();
  store.publishers = store.publishers.filter((p) => p.id !== id);
  saveStore(store);
}

export function getPublisherByName(name: string): Publisher | undefined {
  const store = loadStore();
  return store.publishers.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

// ==================== STATS ====================

export function getStats() {
  const store = loadStore();
  const totalBooks = store.books.reduce((sum, b) => sum + b.quantity, 0);
  const totalSold = store.books.reduce((sum, b) => sum + b.sold, 0);
  const totalRevenue = store.bills.reduce((sum, b) => sum + b.grandTotal, 0);
  const totalBills = store.bills.length;
  const uniquePublishers = store.publishers.length;

  return { totalBooks, totalSold, totalRemaining: totalBooks - totalSold, totalRevenue, totalBills, uniquePublishers };
}

export function getPublisherStats() {
  const store = loadStore();
  const pubMap: Record<string, { publisher: string; totalBooks: number; totalSold: number; totalRemaining: number; revenue: number; profitPercent: number; profit: number }> = {};

  for (const book of store.books) {
    if (!pubMap[book.publisher]) {
      const pub = store.publishers.find((p) => p.name.toLowerCase() === book.publisher.toLowerCase());
      const profitPct = pub?.profitPercent ?? 0;
      pubMap[book.publisher] = { publisher: book.publisher, totalBooks: 0, totalSold: 0, totalRemaining: 0, revenue: 0, profitPercent: profitPct, profit: 0 };
    }
    pubMap[book.publisher].totalBooks += book.quantity;
    pubMap[book.publisher].totalSold += book.sold;
    pubMap[book.publisher].totalRemaining += book.quantity - book.sold;
    pubMap[book.publisher].revenue += book.sold * book.price;
  }

  // Calculate profit for each publisher
  for (const key of Object.keys(pubMap)) {
    pubMap[key].profit = (pubMap[key].revenue * pubMap[key].profitPercent) / 100;
  }

  return Object.values(pubMap).sort((a, b) => b.revenue - a.revenue);
}

// ==================== BACKUP / RESTORE ====================

export function exportAllData(): string {
  return JSON.stringify(loadStore(), null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json) as BookStoreData;
    if (data.books && data.bills) {
      saveStore(data);
      return true;
    }
  } catch {}
  return false;
}

export function clearAllData(): void {
  saveStore({ books: [], bills: [], publishers: [], nextBillNumber: 1 });
}
