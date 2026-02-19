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
  localTitle?: string;     // title in local language (Malayalam, Hindi, etc.) — Unicode
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
  localTitle?: string;     // local language title (for bill display/print)
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
  status?: 'paid' | 'unpaid'; // payment status (legacy bills default to 'paid')
  paymentMethod?: 'cash' | 'upi'; // how the customer paid (optional)
  paidAt?: string;          // ISO date when unpaid bill was later marked paid
  editedAt?: string;        // ISO date when bill was last edited
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

export interface BookRequest {
  id: string;
  customerName: string;
  phone: string;
  bookTitle: string;        // English title (may be free-text if not in inventory)
  bookId?: string;          // Inventory Book.id if matched from inventory
  address?: string;         // optional delivery / contact address
  notes?: string;           // any other notes
  status: 'pending' | 'fulfilled';
  createdAt: string;        // ISO date
}
