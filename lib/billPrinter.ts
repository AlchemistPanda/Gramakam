// Bluetooth Thermal Printer — Hybrid Bill Printing
// Supports: Web Bluetooth (ESC/POS) → falls back to browser window.print()
// Compatible with 58mm and 80mm thermal printers via Bluetooth Low Energy (BLE)

import type { Bill } from '@/types/books';

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

    const server = await bluetoothDevice.gatt.connect();

    // Try each known service UUID to find the writable characteristic
    let foundChar: BluetoothRemoteGATTCharacteristic | null = null;
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

    if (!foundChar) {
      // Try known characteristic UUIDs directly
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
  } catch (e: any) {
    if (e.name === 'NotFoundError') {
      return {
        success: false,
        error: 'No device selected. Note: Web Bluetooth only detects BLE printers. Most cheap thermal printers use Classic Bluetooth and won\'t appear in the list. Use the browser print option instead — it works with any printer connected to your phone/PC.'
      };
    }
    if (e.name === 'SecurityError') {
      return { success: false, error: 'Bluetooth permission denied. Please allow Bluetooth access in your browser settings.' };
    }
    return { success: false, error: e.message || 'Failed to connect' };
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

// ==================== BILL FORMATTING (ESC/POS) ====================

function formatBillForPrinter(bill: Bill, width: number = 32): Uint8Array[] {
  const chunks: Uint8Array[] = [];

  const push = (...parts: Uint8Array[]) => chunks.push(...parts);
  const text = (s: string) => push(ESCPOS.text(s + '\n'));
  const padRight = (left: string, right: string, w: number = width) => {
    const space = w - left.length - right.length;
    return left + ' '.repeat(Math.max(1, space)) + right;
  };

  // Initialize
  push(ESCPOS.init());

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

  push(ESCPOS.line('-', width));

  // Footer
  push(ESCPOS.alignCenter());
  text('Thank you for visiting!');
  text('Gramakam Cultural Academy');
  push(ESCPOS.feed(3));

  // Cut paper
  push(ESCPOS.partialCut());

  return chunks;
}

// ==================== SEND TO PRINTER ====================

async function sendToPrinter(data: Uint8Array[]): Promise<void> {
  if (!printerCharacteristic) {
    throw new Error('Printer not connected');
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
    if (printerCharacteristic.properties.writeWithoutResponse) {
      await printerCharacteristic.writeValueWithoutResponse(slice);
    } else {
      await printerCharacteristic.writeValue(slice);
    }
    // Small delay between chunks to prevent buffer overflow
    await new Promise((r) => setTimeout(r, 20));
  }
}

// ==================== BROWSER PRINT (iframe-based, works on mobile) ====================

function buildBillHtml(bill: Bill): string {
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
    </style></head><body>
      <h1>GRAMAKAM</h1>
      <p class="center">Book Festival 2026<br/>Velur, Thrissur, Kerala</p>
      <div class="line"></div>
      <p><strong>Bill #${bill.billNumber}</strong><br/>${new Date(bill.createdAt).toLocaleString('en-IN')}</p>
      <div class="line"></div>
      <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Amt</th></tr></thead>
        <tbody>
          ${bill.items.map((item) => `<tr><td>${item.title}<br/><span class="publisher">${item.publisher}</span></td><td>${item.quantity}</td><td>₹${(item.price * item.quantity).toFixed(2)}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="line"></div>
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">₹${bill.total.toFixed(2)}</td></tr>
        ${bill.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-₹${bill.discount.toFixed(2)}</td></tr>` : ''}
        <tr class="total-row"><td>TOTAL</td><td style="text-align:right">₹${bill.grandTotal.toFixed(2)}</td></tr>
      </table>
      <div class="line"></div>
      <p class="center" style="margin-top:8px">Thank you for visiting!<br/>Gramakam Cultural Academy</p>
    </body></html>
  `;
}

function printViaBrowser(bill: Bill): void {
  const html = buildBillHtml(bill);

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

// ==================== PUBLIC API ====================

export type PrintResult = { success: boolean; method: 'bluetooth' | 'browser'; error?: string };

/**
 * Print a bill — tries Bluetooth thermal printer first, then falls back to browser print.
 */
export async function printBill(bill: Bill): Promise<PrintResult> {
  // Try Bluetooth first if connected
  if (isPrinterConnected()) {
    try {
      const data = formatBillForPrinter(bill);
      await sendToPrinter(data);
      return { success: true, method: 'bluetooth' };
    } catch (e: any) {
      console.warn('Bluetooth print failed, falling back to browser:', e);
      // Fall through to browser print
    }
  }

  // Fallback to browser print
  try {
    printViaBrowser(bill);
    return { success: true, method: 'browser' };
  } catch (e: any) {
    return { success: false, method: 'browser', error: e.message };
  }
}

/**
 * Get saved printer name from last session
 */
export function getSavedPrinterName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gramakam_printer_name');
}
