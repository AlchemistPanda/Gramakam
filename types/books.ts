// Book Festival Management System — Type Definitions

export interface Publisher {
  id: string;
  name: string;
  contact?: string;
  profitPercent: number;    // % of revenue that is our profit
}

export interface Book {
  id: string;
  title: string;
  publisher: string;       // publisher name
  price: number;
  quantity: number;         // total stock received
  sold: number;             // total sold
  category?: string;
  isbn?: string;            // ISBN / barcode number
  addedAt: string;          // ISO date
}

export interface BillItem {
  bookId: string;
  title: string;
  publisher: string;
  price: number;
  quantity: number;         // quantity in this bill
}

export interface Bill {
  id: string;
  billNumber: number;
  items: BillItem[];
  total: number;
  discount: number;
  grandTotal: number;
  customerName?: string;    // optional customer name
  customerPhone?: string;   // optional phone number
  createdAt: string;        // ISO date
}

export interface OCRLine {
  id: string;
  title: string;
  publisher: string;
  price: number;
  quantity: number;
  confirmed: boolean;       // user verified this line
}

export interface BookStoreData {
  books: Book[];
  bills: Bill[];
  publishers: Publisher[];
  nextBillNumber: number;
}
