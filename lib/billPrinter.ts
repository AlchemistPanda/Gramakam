// Bluetooth Thermal Printer — Hybrid Bill Printing
// Supports: Web Bluetooth (ESC/POS) → falls back to browser window.print()
// Compatible with 58mm and 80mm thermal printers via Bluetooth Low Energy (BLE)

import type { Bill } from '@/types/books';
import QRCode from 'qrcode';

// ==================== UPI CONFIG ====================

const UPI_VPA = '9400186188@cnrb';
const UPI_NAME = 'Gramakam Book Festival';

/** Generate a UPI payment QR code as a data URL with amount pre-filled */
export async function generateUpiQR(amount: number, note: string = 'Gramakam Book Festival'): Promise<string> {
  const upiUri = `upi://pay?pa=${UPI_VPA}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  return QRCode.toDataURL(upiUri, { width: 180, margin: 1, color: { dark: '#000000', light: '#ffffff' } });
}

// ==================== BLUETOOTH STATE ====================

let bluetoothDevice: BluetoothDevice | null = null;
let printerCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
let printerConnected = false;

// Common BLE Serial/Printer service UUIDs
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic printer
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // RD Printer
];

const PRINTER_CHAR_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb', // Write characteristic
  '0000ff02-0000-1000-8000-00805f9b34fb', // Generic write
  '49535343-8841-43f4-a8d4-ecbe34729bb3', // ISSC Transparent UART TX
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f', // RD Write
];

// ==================== WEB BLUETOOTH CHECK ====================

export function isBluetoothAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export function isPrinterConnected(): boolean {
  return printerConnected && bluetoothDevice !== null && bluetoothDevice.gatt?.connected === true;
}

export function getConnectedPrinterName(): string | null {
  if (isPrinterConnected() && bluetoothDevice) {
    return bluetoothDevice.name || 'Thermal Printer';
  }
  return null;
}

// ==================== CONNECT / DISCONNECT ====================

// Helper: wait ms
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Helper: connect GATT with retries (handles "GATT Server is disconnected" race condition)
async function connectGATTWithRetry(device: BluetoothDevice, maxRetries: number = 3): Promise<BluetoothRemoteGATTServer> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`GATT connect attempt ${attempt}/${maxRetries}...`);
      const server = await device.gatt!.connect();
      // Wait for connection to stabilise before discovering services
      await delay(500 + attempt * 200);
      // Verify still connected
      if (!server.connected) {
        throw new Error('GATT Server disconnected immediately after connect');
      }
      return server;
    } catch (e) {
      lastError = e;
      console.warn(`GATT connect attempt ${attempt} failed:`, (e as Error).message);
      if (attempt < maxRetries) {
        // Disconnect cleanly before retry
        try { device.gatt?.disconnect(); } catch {}
        await delay(1000 * attempt);
      }
    }
  }
  throw lastError;
}

// Helper: discover writable characteristic with GATT reconnect on failure
async function discoverCharacteristic(device: BluetoothDevice, server: BluetoothRemoteGATTServer): Promise<BluetoothRemoteGATTCharacteristic | null> {
  let foundChar: BluetoothRemoteGATTCharacteristic | null = null;

  // Ensure GATT is still connected before service discovery
  if (!server.connected) {
    console.log('GATT disconnected before service discovery, reconnecting...');
    server = await connectGATTWithRetry(device, 2);
  }

  // Try getting all services first
  try {
    const services = await server.getPrimaryServices();
    for (const service of services) {
      try {
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            foundChar = char;
            break;
          }
        }
        if (foundChar) break;
      } catch {
        continue;
      }
    }
  } catch (e) {
    console.warn('getPrimaryServices failed:', (e as Error).message);
    // If GATT disconnected during discovery, reconnect and retry
    if ((e as Error).message?.includes('GATT') || (e as Error).message?.includes('disconnected')) {
      console.log('Reconnecting GATT for service discovery...');
      try { device.gatt?.disconnect(); } catch {}
      await delay(1000);
      server = await connectGATTWithRetry(device, 2);
    }
  }

  if (!foundChar) {
    // Try known service/characteristic UUIDs directly
    for (const serviceUUID of PRINTER_SERVICE_UUIDS) {
      try {
        const service = await server.getPrimaryService(serviceUUID);
        for (const charUUID of PRINTER_CHAR_UUIDS) {
          try {
            const char = await service.getCharacteristic(charUUID);
            if (char.properties.write || char.properties.writeWithoutResponse) {
              foundChar = char;
              break;
            }
          } catch {
            continue;
          }
        }
        if (foundChar) break;
      } catch {
        continue;
      }
    }
  }

  return foundChar;
}

export async function connectPrinter(): Promise<{ success: boolean; name?: string; error?: string }> {
  if (!isBluetoothAvailable()) {
    return { success: false, error: 'Bluetooth not available in this browser' };
  }

  try {
    // Request device — show picker with all devices (thermal printers use various UUIDs)
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICE_UUIDS,
    });

    if (!bluetoothDevice.gatt) {
      return { success: false, error: 'Device does not support GATT' };
    }

    bluetoothDevice.addEventListener('gattserverdisconnected', () => {
      printerConnected = false;
      printerCharacteristic = null;
      console.log('Printer disconnected');
    });

    // Connect GATT with retry logic (fixes "GATT Server is disconnected" error)
    const server = await connectGATTWithRetry(bluetoothDevice);

    // Discover writable characteristic (with reconnect fallback)
    const foundChar = await discoverCharacteristic(bluetoothDevice, server);

    if (!foundChar) {
      await bluetoothDevice.gatt.disconnect();
      return { success: false, error: 'No writable characteristic found. This device may not be a supported printer.' };
    }

    printerCharacteristic = foundChar;
    printerConnected = true;

    // Save device name for UI
    const name = bluetoothDevice.name || 'Thermal Printer';
    if (typeof window !== 'undefined') {
      localStorage.setItem('gramakam_printer_name', name);
    }

    return { success: true, name };
  } catch (e) {
    if ((e as Error & { name?: string }).name === 'NotFoundError') {
      return {
        success: false,
        error: 'No device selected. Note: Web Bluetooth only detects BLE printers. Most cheap thermal printers use Classic Bluetooth and won\'t appear in the list. Use the browser print option instead — it works with any printer connected to your phone/PC.'
      };
    }
    if ((e as Error & { name?: string }).name === 'SecurityError') {
      return { success: false, error: 'Bluetooth permission denied. Please allow Bluetooth access in your browser settings.' };
    }
    return { success: false, error: (e as Error).message || 'Failed to connect' };
  }
}

export async function disconnectPrinter(): Promise<void> {
  if (bluetoothDevice?.gatt?.connected) {
    bluetoothDevice.gatt.disconnect();
  }
  printerConnected = false;
  printerCharacteristic = null;
  bluetoothDevice = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gramakam_printer_name');
  }
}

// ==================== ESC/POS COMMANDS ====================

const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

function textEncoder(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function cmd(...bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

// ESC/POS command builders
const ESCPOS = {
  init: () => cmd(ESC, 0x40),                       // Initialize printer
  bold: (on: boolean) => cmd(ESC, 0x45, on ? 1 : 0), // Bold on/off
  alignCenter: () => cmd(ESC, 0x61, 1),              // Center alignment
  alignLeft: () => cmd(ESC, 0x61, 0),                // Left alignment
  alignRight: () => cmd(ESC, 0x61, 2),               // Right alignment
  doubleSize: (on: boolean) => cmd(GS, 0x21, on ? 0x11 : 0x00), // Double width+height
  feed: (lines: number = 1) => cmd(...Array(lines).fill(LF)),
  cut: () => cmd(GS, 0x56, 0x00),                   // Full cut
  partialCut: () => cmd(GS, 0x56, 0x01),             // Partial cut
  text: (s: string) => textEncoder(s),
  line: (char: string = '-', width: number = 32) => textEncoder(char.repeat(width) + '\n'),
};

/**
 * Load an image URL and convert it to ESC/POS GS v 0 raster bytes.
 * The image is resized to fit within `targetWidthDots` (default 240 for 58mm).
 * Pixels are thresholded to 1-bit: dark → printed, light → blank.
 */
async function loadImageAsEscposRaster(
  url: string,
  targetWidthDots: number = 240,
): Promise<Uint8Array[] | null> {
  if (typeof window === 'undefined') return null;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });

    // Scale image proportionally to fit target width
    const scale = targetWidthDots / img.naturalWidth;
    const w = targetWidthDots;
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    // White background so transparent PNGs print cleanly
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data; // RGBA flat array

    // Build 1-bit bitmap: ESC/POS packs 8 horizontal dots per byte, MSB = leftmost dot
    // widthBytes must be a multiple of 1 (any value); round up to whole bytes
    const widthBytes = Math.ceil(w / 8);
    const bitmapBytes = widthBytes * h;
    const bitmap = new Uint8Array(bitmapBytes);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        if (luminance < 128) {
          // Dark pixel → set bit (printed dot)
          const byteIdx = y * widthBytes + Math.floor(x / 8);
          const bitPos = 7 - (x % 8); // MSB first
          bitmap[byteIdx] |= (1 << bitPos);
        }
      }
    }

    // GS v 0 command: print raster bitmap
    // GS v 0 m xL xH yL yH [data]
    //   m = 0 (normal density, 8 dots/mm)
    //   xL xH = widthBytes (low, high byte)
    //   yL yH = height in dots (low, high byte)
    const header = new Uint8Array([
      GS, 0x76, 0x30, 0x00,            // GS v 0, mode = normal
      widthBytes & 0xff, (widthBytes >> 8) & 0xff,
      h & 0xff, (h >> 8) & 0xff,
    ]);

    return [header, bitmap];
  } catch (e) {
    console.warn('Logo load for thermal print failed:', e);
    return null;
  }
}

/**
 * Build ESC/POS GS ( k commands to print a QR code natively on the thermal printer.
 * The printer generates the QR from the raw data string — no image needed.
 *   Model 2, module size 6 (larger for easier scanning on 58mm), error correction Level M.
 */
function escposQR(data: string): Uint8Array[] {
  const bytes = new TextEncoder().encode(data);
  const len = bytes.length + 3; // +3 for cn, fn, m bytes in the store command
  const pL = len & 0xff;
  const pH = (len >> 8) & 0xff;
  return [
    // 1. Select model 2
    cmd(GS, 0x28, 0x6b, 4, 0, 49, 65, 50, 0),
    // 2. Set module size (6 dots = larger QR, easier to scan on 58mm)
    cmd(GS, 0x28, 0x6b, 3, 0, 49, 67, 6),
    // 3. Error correction level M
    cmd(GS, 0x28, 0x6b, 3, 0, 49, 69, 49),
    // 4. Store data
    cmd(GS, 0x28, 0x6b, pL, pH, 49, 80, 48),
    bytes,
    // 5. Print the QR
    cmd(GS, 0x28, 0x6b, 3, 0, 49, 81, 48),
  ];
}

// ==================== BILL FORMATTING (ESC/POS) ====================

function formatBillForPrinter(bill: Bill, width: number = 32, logoChunks?: Uint8Array[]): Uint8Array[] {
  const chunks: Uint8Array[] = [];

  const push = (...parts: Uint8Array[]) => chunks.push(...parts);
  const text = (s: string) => push(ESCPOS.text(s + '\n'));
  const padRight = (left: string, right: string, w: number = width) => {
    const space = w - left.length - right.length;
    return left + ' '.repeat(Math.max(1, space)) + right;
  };

  // Initialize
  push(ESCPOS.init());

  // Logo
  push(ESCPOS.alignCenter());
  if (logoChunks && logoChunks.length > 0) {
    push(...logoChunks);
    push(ESCPOS.feed(1));
  }

  // Header
  push(ESCPOS.alignCenter());
  push(ESCPOS.doubleSize(true));
  text('GRAMAKAM');
  push(ESCPOS.doubleSize(false));
  text('Book Festival 2026');
  text('Velur, Thrissur, Kerala');
  push(ESCPOS.feed(1));

  // Bill info
  push(ESCPOS.alignLeft());
  push(ESCPOS.line('-', width));
  push(ESCPOS.bold(true));
  text(`Bill #${bill.billNumber}`);
  push(ESCPOS.bold(false));
  text(new Date(bill.createdAt).toLocaleString('en-IN'));
  push(ESCPOS.line('-', width));

  // Column headers
  push(ESCPOS.bold(true));
  text(padRight('Item', 'Amt'));
  push(ESCPOS.bold(false));
  push(ESCPOS.line('-', width));

  // Items
  for (const item of bill.items) {
    const amt = `Rs.${(item.price * item.quantity).toFixed(0)}`;
    // Title (may need truncation for 32-col printers)
    const maxTitleLen = width - amt.length - 2;
    const title = item.title.length > maxTitleLen
      ? item.title.substring(0, maxTitleLen - 1) + '.'
      : item.title;
    text(padRight(title, amt));
    // Publisher + quantity on next line
    const detail = `  ${item.publisher} x${item.quantity} @Rs.${item.price}`;
    text(detail.length > width ? detail.substring(0, width) : detail);
  }

  push(ESCPOS.line('-', width));

  // Totals
  text(padRight('Subtotal', `Rs.${bill.total.toFixed(2)}`));
  if (bill.discount > 0) {
    text(padRight('Discount', `-Rs.${bill.discount.toFixed(2)}`));
  }
  push(ESCPOS.bold(true));
  push(ESCPOS.doubleSize(true));
  push(ESCPOS.alignCenter());
  text(`TOTAL: Rs.${bill.grandTotal.toFixed(2)}`);
  push(ESCPOS.doubleSize(false));
  push(ESCPOS.bold(false));
  push(ESCPOS.alignLeft());

  // Payment method
  if (bill.paymentMethod) {
    push(ESCPOS.alignCenter());
    text(bill.paymentMethod === 'cash' ? 'Payment: Cash' : 'Payment: UPI');
    push(ESCPOS.alignLeft());
  }

  push(ESCPOS.line('-', width));

  // Payment status (for unpaid/credit bills)
  const isUnpaid = bill.status === 'unpaid';
  if (isUnpaid) {
    push(ESCPOS.alignCenter());
    push(ESCPOS.bold(true));
    push(ESCPOS.doubleSize(true));
    text('** UNPAID **');
    push(ESCPOS.doubleSize(false));
    text('CREDIT — Payment Pending');
    push(ESCPOS.bold(false));
    push(ESCPOS.alignLeft());
    push(ESCPOS.line('-', width));
  }

  // UPI QR code — native ESC/POS GS ( k — printer generates QR from the URI string
  // Skip for cash-paid bills
  if (bill.paymentMethod !== 'cash') {
    const upiUri = `upi://pay?pa=${UPI_VPA}&pn=${encodeURIComponent(UPI_NAME)}&am=${bill.grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill #' + bill.billNumber)}`;
    push(ESCPOS.alignCenter());
    push(ESCPOS.feed(1));
    text(isUnpaid ? 'SCAN TO PAY' : 'PAY VIA UPI');
    push(...escposQR(upiUri));
    push(ESCPOS.feed(1));
    text(UPI_VPA);
    text(`Rs.${bill.grandTotal.toFixed(2)}`);
    push(ESCPOS.alignLeft());
    push(ESCPOS.line('-', width));
  }

  // Footer
  push(ESCPOS.alignCenter());
  text('Thank you for visiting!');
  text('IF Creations');
  push(ESCPOS.feed(3));

  // Cut paper
  push(ESCPOS.partialCut());

  return chunks;
}

// ==================== SEND TO PRINTER ====================

async function sendToPrinter(data: Uint8Array[]): Promise<void> {
  if (!printerCharacteristic || !bluetoothDevice) {
    throw new Error('Printer not connected');
  }

  // Auto-reconnect if GATT disconnected since last use
  if (!bluetoothDevice.gatt?.connected) {
    console.log('GATT disconnected, auto-reconnecting for print...');
    try {
      const server = await connectGATTWithRetry(bluetoothDevice, 3);
      const char = await discoverCharacteristic(bluetoothDevice, server);
      if (!char) throw new Error('Could not rediscover printer characteristic');
      printerCharacteristic = char;
      printerConnected = true;
    } catch {
      printerConnected = false;
      printerCharacteristic = null;
      throw new Error('Printer disconnected and reconnection failed. Please reconnect manually.');
    }
  }

  // Merge all chunks into one buffer
  const totalLength = data.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of data) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  // Send in 20-byte chunks (BLE MTU limit)
  const CHUNK_SIZE = 20;
  for (let i = 0; i < merged.length; i += CHUNK_SIZE) {
    const slice = merged.slice(i, i + CHUNK_SIZE);
    if (printerCharacteristic!.properties.writeWithoutResponse) {
      await printerCharacteristic!.writeValueWithoutResponse(slice);
    } else {
      await printerCharacteristic!.writeValue(slice);
    }
    // Small delay between chunks to prevent buffer overflow
    await new Promise((r) => setTimeout(r, 10));
  }
}

// ==================== BROWSER PRINT (iframe-based, works on mobile) ====================

function buildBillHtml(bill: Bill, qrDataUrl?: string): string {
  // Show QR for non-cash bills — 'Scan to Pay' for unpaid, 'Pay via UPI' for others
  const showQr = qrDataUrl && bill.paymentMethod !== 'cash';
  return `
    <!DOCTYPE html>
    <html><head><title>Bill #${bill.billNumber}</title>
    <style>
      @page { margin: 4mm; size: 80mm auto; }
      * { box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; padding: 8px; max-width: 80mm; margin: 0 auto; font-size: 12px; line-height: 1.4; color: #000; }
      h1 { text-align: center; font-size: 18px; margin: 0 0 2px; }
      .center { text-align: center; margin: 2px 0; }
      .line { border-top: 1px dashed #000; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 2px 0; text-align: left; font-size: 11px; }
      th:last-child, td:last-child { text-align: right; }
      .total-row { font-weight: bold; font-size: 14px; }
      .publisher { font-size: 10px; color: #555; }
      .local-title { font-family: system-ui, sans-serif; font-size: 12px; font-weight: 600; }
      .eng-title { font-size: 9px; color: #555; }
    </style></head><body>
      <h1>GRAMAKAM</h1>
      <p class="center">Book Festival 2026<br/>Velur, Thrissur, Kerala</p>
      <div class="line"></div>
      <p><strong>Bill #${bill.billNumber}</strong><br/>${new Date(bill.createdAt).toLocaleString('en-IN')}${bill.customerName ? `<br/>${bill.customerName}` : ''}${bill.customerPhone ? ` · ${bill.customerPhone}` : ''}</p>
      <div class="line"></div>
      <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Amt</th></tr></thead>
        <tbody>
          ${bill.items.map((item) => `<tr><td>${item.localTitle ? `<span class="local-title">${item.localTitle}</span><br/><span class="eng-title">${item.title}</span>` : item.title}<br/><span class="publisher">${item.publisher}</span></td><td>${item.quantity}</td><td>₹${(item.price * item.quantity).toFixed(2)}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="line"></div>
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">₹${bill.total.toFixed(2)}</td></tr>
        ${bill.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-₹${bill.discount.toFixed(2)}</td></tr>` : ''}
        <tr class="total-row"><td>TOTAL</td><td style="text-align:right">₹${bill.grandTotal.toFixed(2)}</td></tr>
        ${bill.paymentMethod ? `<tr><td style="color:#666;font-size:11px">Payment</td><td style="text-align:right;font-size:11px;font-weight:bold">${bill.paymentMethod === 'cash' ? 'Cash' : 'UPI'}</td></tr>` : ''}
      </table>
      ${showQr ? `
      <div class="line"></div>
      <p class="center" style="font-size:10px;margin:4px 0 2px;font-weight:bold;">${bill.status === 'unpaid' ? 'SCAN TO PAY' : 'PAY VIA UPI'}</p>
      <p class="center"><img src="${qrDataUrl}" style="width:130px;height:130px;display:block;margin:4px auto;" /></p>
      <p class="center" style="font-size:9px;color:#555;">${UPI_VPA}</p>
      <p class="center" style="font-size:10px;font-weight:bold;">₹${bill.grandTotal.toFixed(2)}</p>
      ` : ''}
      ${bill.status === 'unpaid' ? '<div class="line"></div><p class="center" style="font-size:16px;font-weight:bold;margin:8px 0 2px;">** UNPAID **</p><p class="center" style="font-size:11px;color:#c00;">CREDIT — Payment Pending</p>' : ''}
      <div class="line"></div>
      <p class="center" style="margin-top:8px">Thank you for visiting!<br/>IF Creations</p>
    </body></html>
  `;
}

async function printViaBrowser(bill: Bill): Promise<void> {
  // Generate UPI QR with amount pre-filled (skip for cash-paid bills)
  let qrDataUrl: string | undefined;
  if (bill.paymentMethod !== 'cash') {
    try {
      const note = `Bill #${bill.billNumber}`;
      qrDataUrl = await generateUpiQR(bill.grandTotal, note);
    } catch { /* non-fatal — print without QR if it fails */ }
  }
  const html = buildBillHtml(bill, qrDataUrl);

  // Try iframe approach first (works on Android + iOS)
  try {
    // Remove any existing print iframe
    const existing = document.getElementById('gramakam-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'gramakam-print-frame';
    iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:80mm;height:auto;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      // Wait for content to render, then trigger print
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch {
          // If iframe print fails, try window.open fallback
          windowPrintFallback(bill, html);
        }
        // Clean up iframe after printing
        setTimeout(() => iframe.remove(), 2000);
      }, 300);
      return;
    }
  } catch {
    // iframe approach failed
  }

  // Fallback: window.open (may be blocked on mobile)
  windowPrintFallback(bill, html);
}

function windowPrintFallback(bill: Bill, html: string): void {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    // Last resort: replace current page temporarily
    alert('Pop-up blocked. Please allow pop-ups for this site to print bills.');
    return;
  }
  printWindow.document.write(html + `<script>setTimeout(() => { window.print(); }, 200);<\/script>`);
  printWindow.document.close();
}

// ==================== OUT-OF-STOCK LIST PRINTING ====================

function formatOutOfStockForPrinter(
  books: import('@/types/books').Book[],
  width: number = 32,
  logoChunks?: Uint8Array[],
): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  const push = (...parts: Uint8Array[]) => chunks.push(...parts);
  const text = (s: string) => push(ESCPOS.text(s + '\n'));
  const padRight = (left: string, right: string, w: number = width) => {
    const space = w - left.length - right.length;
    return left + ' '.repeat(Math.max(1, space)) + right;
  };

  // Group by publisher
  const byPublisher = new Map<string, import('@/types/books').Book[]>();
  for (const b of books) {
    const key = b.publisher || 'Unknown';
    if (!byPublisher.has(key)) byPublisher.set(key, []);
    byPublisher.get(key)!.push(b);
  }
  const sorted = [...byPublisher.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  push(ESCPOS.init());
  push(ESCPOS.alignCenter());
  if (logoChunks && logoChunks.length > 0) {
    push(...logoChunks);
    push(ESCPOS.feed(1));
  }
  push(ESCPOS.doubleSize(true));
  text('GRAMAKAM');
  push(ESCPOS.doubleSize(false));
  text('Book Festival 2026');
  text('Velur, Thrissur, Kerala');
  push(ESCPOS.feed(1));

  push(ESCPOS.alignLeft());
  push(ESCPOS.line('=', width));
  push(ESCPOS.bold(true));
  text('Out-of-Stock Books');
  push(ESCPOS.bold(false));
  text(new Date().toLocaleString('en-IN'));
  push(ESCPOS.line('=', width));

  if (books.length === 0) {
    push(ESCPOS.alignCenter());
    text('No out-of-stock books');
    push(ESCPOS.alignLeft());
  } else {
    for (const [pub, list] of sorted) {
      push(ESCPOS.bold(true));
      const pubTrunc = pub.length > width - 2 ? pub.slice(0, width - 3) + '\u2026' : pub;
      text(pubTrunc);
      push(ESCPOS.bold(false));
      push(ESCPOS.line('-', width));
      for (const b of list) {
        const priceStr = `Rs.${b.price.toFixed(0)}`;
        const maxLen = width - priceStr.length - 2;
        const title = b.title.length > maxLen ? b.title.slice(0, maxLen - 1) + '\u2026' : b.title;
        text(padRight(title, priceStr));
        if (b.localTitle) {
          // indent local title on next line
          const lt = b.localTitle.length > width - 2 ? b.localTitle.slice(0, width - 3) + '\u2026' : b.localTitle;
          push(ESCPOS.text('  ' + lt + '\n'));
        }
      }
      push(ESCPOS.feed(1));
    }
    push(ESCPOS.line('=', width));
    push(ESCPOS.bold(true));
    text(padRight(`${books.length} books`, `${sorted.length} pub`));
    push(ESCPOS.bold(false));
  }

  push(ESCPOS.feed(3));
  push(ESCPOS.cut());
  return chunks;
}

function buildOutOfStockHtml(books: import('@/types/books').Book[]): string {
  const date = new Date().toLocaleString('en-IN');

  // Group by publisher
  const byPublisher = new Map<string, import('@/types/books').Book[]>();
  for (const b of books) {
    const key = b.publisher || 'Unknown';
    if (!byPublisher.has(key)) byPublisher.set(key, []);
    byPublisher.get(key)!.push(b);
  }
  const sorted = [...byPublisher.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const rows = sorted.map(([pub, list]) => `
    <tr><td colspan="2" class="pub-header">${pub}</td></tr>
    ${list.map((b, i) => `<tr class="${i % 2 === 1 ? 'alt' : ''}"><td><span class="num">${i + 1}.</span>${b.localTitle ? `<span class="local">${b.localTitle}</span><br/>` : ''}<span class="eng">${b.title}</span></td><td>&#8377;${b.price.toFixed(0)}</td></tr>`).join('')}
    <tr><td colspan="2" style="padding:2px 0 6px"></td></tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html><head><title>Out-of-Stock Books &#8212; Gramakam 2026</title>
    <style>
      @page { margin: 6mm; size: 80mm auto; }
      * { box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; padding: 8px; max-width: 80mm; margin: 0 auto; font-size: 12px; line-height: 1.5; color: #000; }
      h1 { text-align: center; font-size: 18px; margin: 0 0 2px; }
      h2 { text-align: center; font-size: 13px; font-weight: normal; margin: 2px 0; }
      .center { text-align: center; margin: 2px 0; }
      .line { border-top: 1px dashed #000; margin: 5px 0; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 2px 0; font-size: 11px; vertical-align: top; }
      td:last-child { text-align: right; white-space: nowrap; font-weight: bold; }
      .pub-header { font-weight: bold; font-size: 12px; background: #eee; padding: 2px 3px; border-top: 1px solid #000; }
      .alt { background: #fafafa; }
      .num { color: #999; font-size: 10px; padding-right: 2px; }
      .local { font-family: system-ui, sans-serif; font-size: 12px; font-weight: 600; display: block; }
      .eng { font-size: 10px; color: #555; }
    </style></head><body>
      <h1>GRAMAKAM</h1>
      <h2>Book Festival 2026</h2>
      <p class="center" style="font-size:11px">Velur, Thrissur, Kerala</p>
      <div class="line"></div>
      <p style="font-weight:bold;margin:2px 0">Out-of-Stock Books</p>
      <p style="font-size:10px;color:#555;margin:0 0 4px">${date}</p>
      <div class="line"></div>
      ${books.length === 0
        ? '<p class="center">No out-of-stock books &#x1F389;</p>'
        : `<table><tbody>${rows}</tbody></table>
           <div class="line"></div>
           <p style="font-weight:bold;font-size:12px">${books.length} book${books.length !== 1 ? 's' : ''} &nbsp;&middot;&nbsp; ${sorted.length} publisher${sorted.length !== 1 ? 's' : ''}</p>`}
      <div class="line"></div>
      <p class="center" style="font-size:11px;margin-top:6px">Gramakam 2026 &mdash; IF Creations</p>
    </body></html>
  `;
}

/**
 * Print the out-of-stock book list — tries BT thermal first, falls back to browser.
 */
export async function printOutOfStockList(
  allBooks: import('@/types/books').Book[],
): Promise<PrintResult> {
  const oos = allBooks.filter((b) => b.quantity - b.sold <= 0)
    .sort((a, b) => a.publisher.localeCompare(b.publisher) || a.title.localeCompare(b.title));

  if (isPrinterConnected()) {
    try {
      const logoChunks = await loadImageAsEscposRaster('/images/gramakam-logo.png', 240);
      const data = formatOutOfStockForPrinter(oos, 32, logoChunks ?? undefined);
      await sendToPrinter(data);
      return { success: true, method: 'bluetooth' };
    } catch (e) {
      console.warn('BT print failed, falling back to browser:', e);
    }
  }

  try {
    const html = buildOutOfStockHtml(oos);
    const existing = document.getElementById('gramakam-print-frame');
    if (existing) existing.remove();
    const iframe = document.createElement('iframe');
    iframe.id = 'gramakam-print-frame';
    iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:80mm;height:auto;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        try { iframe.contentWindow?.print(); } catch { /* non-fatal */ }
        setTimeout(() => iframe.remove(), 2000);
      }, 300);
    }
    return { success: true, method: 'browser' };
  } catch (e) {
    return { success: false, method: 'browser', error: (e as Error).message };
  }
}

// ==================== REQUEST LIST PRINTING ====================

export interface RequestBookEntry {
  title: string;
  count: number; // how many customers requested it
}

/** Flatten all book titles from a list of requests, group by title, sort by count desc */
export function aggregateRequestedBooks(
  requests: import('@/types/books').BookRequest[],
): RequestBookEntry[] {
  const map = new Map<string, number>();
  for (const req of requests) {
    const titles = [req.bookTitle, ...(req.additionalBooks?.map((b) => b.bookTitle) ?? [])];
    for (const t of titles) {
      const key = t.trim();
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
}

function formatRequestListForPrinter(
  entries: RequestBookEntry[],
  label: string,
  width: number = 32,
  logoChunks?: Uint8Array[],
): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  const push = (...parts: Uint8Array[]) => chunks.push(...parts);
  const text = (s: string) => push(ESCPOS.text(s + '\n'));
  const padRight = (left: string, right: string, w: number = width) => {
    const space = w - left.length - right.length;
    return left + ' '.repeat(Math.max(1, space)) + right;
  };

  push(ESCPOS.init());

  // Logo
  push(ESCPOS.alignCenter());
  if (logoChunks && logoChunks.length > 0) {
    push(...logoChunks);
    push(ESCPOS.feed(1));
  }

  // Header
  push(ESCPOS.doubleSize(true));
  text('GRAMAKAM');
  push(ESCPOS.doubleSize(false));
  text('Book Festival 2026');
  text('Velur, Thrissur, Kerala');
  push(ESCPOS.feed(1));

  push(ESCPOS.alignLeft());
  push(ESCPOS.line('=', width));
  push(ESCPOS.bold(true));
  text(`${label} Request List`);
  push(ESCPOS.bold(false));
  text(new Date().toLocaleString('en-IN'));
  push(ESCPOS.line('=', width));

  if (entries.length === 0) {
    push(ESCPOS.alignCenter());
    text('No requests found');
    push(ESCPOS.alignLeft());
  } else {
    push(ESCPOS.bold(true));
    text(padRight('Book Title', 'Req'));
    push(ESCPOS.bold(false));
    push(ESCPOS.line('-', width));

    for (const entry of entries) {
      const countStr = `x${entry.count}`;
      const maxLen = width - countStr.length - 2;
      const title =
        entry.title.length > maxLen ? entry.title.slice(0, maxLen - 1) + '\u2026' : entry.title;
      text(padRight(title, countStr));
    }

    push(ESCPOS.line('-', width));
    push(ESCPOS.bold(true));
    const totalReq = entries.reduce((s, e) => s + e.count, 0);
    text(padRight(`${entries.length} books`, `${totalReq} req`));
    push(ESCPOS.bold(false));
  }

  push(ESCPOS.feed(3));
  push(ESCPOS.cut());

  return chunks;
}

function buildRequestListHtml(entries: RequestBookEntry[], label: string): string {
  const date = new Date().toLocaleString('en-IN');
  const totalBooks = entries.length;
  const totalReq = entries.reduce((s, e) => s + e.count, 0);
  return `
    <!DOCTYPE html>
    <html><head><title>Requested Books \u2014 Gramakam 2026</title>
    <style>
      @page { margin: 6mm; size: 80mm auto; }
      * { box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; padding: 8px; max-width: 80mm; margin: 0 auto; font-size: 12px; line-height: 1.5; color: #000; }
      h1 { text-align: center; font-size: 18px; margin: 0 0 2px; }
      h2 { text-align: center; font-size: 13px; margin: 2px 0 0; font-weight: normal; }
      .center { text-align: center; margin: 2px 0; }
      .line { border-top: 1px dashed #000; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; }
      th { font-size: 11px; border-bottom: 1px solid #000; padding: 2px 0; text-align: left; }
      th:last-child { text-align: right; }
      td { padding: 2px 0; font-size: 11px; vertical-align: top; }
      td:last-child { text-align: right; white-space: nowrap; font-weight: bold; }
      .num { color: #888; font-size: 10px; padding-right: 3px; }
    </style></head><body>
      <h1>GRAMAKAM</h1>
      <h2>Book Festival 2026</h2>
      <p class="center" style="font-size:11px">Velur, Thrissur, Kerala</p>
      <div class="line"></div>
      <p style="font-weight:bold;margin:2px 0">${label} Request List</p>
      <p style="font-size:10px;color:#555;margin:0 0 4px">${date}</p>
      <div class="line"></div>
      ${entries.length === 0
        ? '<p class="center">No requests found</p>'
        : `<table>
        <thead><tr><th>Book Title</th><th>Req</th></tr></thead>
        <tbody>
          ${entries.map((e, i) => `<tr><td><span class="num">${i + 1}.</span>${e.title}</td><td>\xd7${e.count}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="line"></div>
      <p style="font-weight:bold;font-size:12px">${totalBooks} book${totalBooks !== 1 ? 's' : ''} &nbsp;&middot;&nbsp; ${totalReq} request${totalReq !== 1 ? 's' : ''}</p>`}
      <div class="line"></div>
      <p class="center" style="font-size:11px;margin-top:6px">Gramakam 2026 &mdash; IF Creations</p>
    </body></html>
  `;
}

// ==================== PUBLIC API ====================

export type PrintResult = { success: boolean; method: 'bluetooth' | 'browser'; error?: string };

/**
 * Print a bill — tries Bluetooth thermal printer first, then falls back to browser print.
 */
export async function printBill(bill: Bill): Promise<PrintResult> {
  // Try Bluetooth first if connected
  if (isPrinterConnected()) {
    try {
      // Pre-load logo as ESC/POS raster bytes (240 dots wide — 58mm paper)
      const logoChunks = await loadImageAsEscposRaster('/images/gramakam-logo.png', 240);
      const data = formatBillForPrinter(bill, 32, logoChunks ?? undefined);
      await sendToPrinter(data);
      return { success: true, method: 'bluetooth' };
    } catch (e) {
      console.warn('Bluetooth print failed, falling back to browser:', e);
      // Fall through to browser print
    }
  }

  // Fallback to browser print
  try {
    await printViaBrowser(bill);
    return { success: true, method: 'browser' };
  } catch (e) {
    return { success: false, method: 'browser', error: (e as Error).message };
  }
}

/**
 * Print a list of requested books — tries Bluetooth first, falls back to browser.
 */
export async function printRequestList(
  requests: import('@/types/books').BookRequest[],
  label: string = 'Pending',
): Promise<PrintResult> {
  const entries = aggregateRequestedBooks(requests);

  if (isPrinterConnected()) {
    try {
      const logoChunks = await loadImageAsEscposRaster('/images/gramakam-logo.png', 240);
      const data = formatRequestListForPrinter(entries, label, 32, logoChunks ?? undefined);
      await sendToPrinter(data);
      return { success: true, method: 'bluetooth' };
    } catch (e) {
      console.warn('BT print failed, falling back to browser:', e);
    }
  }

  try {
    const html = buildRequestListHtml(entries, label);
    const existing = document.getElementById('gramakam-print-frame');
    if (existing) existing.remove();
    const iframe = document.createElement('iframe');
    iframe.id = 'gramakam-print-frame';
    iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:80mm;height:auto;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        try { iframe.contentWindow?.print(); } catch { /* non-fatal */ }
        setTimeout(() => iframe.remove(), 2000);
      }, 300);
    }
    return { success: true, method: 'browser' };
  } catch (e) {
    return { success: false, method: 'browser', error: (e as Error).message };
  }
}

/**
 * Get saved printer name from last session
 */
export function getSavedPrinterName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gramakam_printer_name');
}
