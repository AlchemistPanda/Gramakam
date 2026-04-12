// BLE thermal printer — address-label printing for merch orders
// Uses the exact same connection strategy as billPrinter.ts (proven working)

import type { MerchOrder } from '@/types';

// Same UUIDs as billPrinter.ts
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '0000ff12-0000-1000-8000-00805f9b34fb',
];

const PRINTER_CHAR_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '0000ff01-0000-1000-8000-00805f9b34fb',
];

export type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'printing' | 'error';

// Module-level singletons
let _device: BluetoothDevice | null = null;
let _char: BluetoothRemoteGATTCharacteristic | null = null;

export function isPrinterConnected(): boolean {
  return !!_char && !!_device?.gatt?.connected;
}

// ── GATT connect with retry (mirrors billPrinter.ts) ──────────────────────────
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function connectGATTWithRetry(device: BluetoothDevice, maxRetries = 3): Promise<BluetoothRemoteGATTServer> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const server = await device.gatt!.connect();
      await delay(500 + attempt * 200);
      if (!server.connected) throw new Error('GATT Server disconnected immediately after connect');
      return server;
    } catch (e) {
      lastError = e;
      try { device.gatt?.disconnect(); } catch { /* ignore */ }
      if (attempt < maxRetries) await delay(1000 * attempt);
    }
  }
  throw lastError;
}

async function discoverCharacteristic(
  device: BluetoothDevice,
  server: BluetoothRemoteGATTServer
): Promise<BluetoothRemoteGATTCharacteristic | null> {
  // 1. Try getPrimaryServices — auto-discover any writable characteristic
  if (server.connected) {
    try {
      const services = await server.getPrimaryServices();
      for (const svc of services) {
        try {
          const chars = await svc.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) return c;
          }
        } catch { /* skip service */ }
      }
    } catch (e) {
      if ((e as Error).message?.includes('GATT') || (e as Error).message?.includes('disconnected')) {
        try { device.gatt?.disconnect(); } catch { /* ignore */ }
        await delay(1000);
        server = await connectGATTWithRetry(device, 2);
      }
    }
  }

  // 2. Fallback: try known UUID pairs directly
  for (const serviceUUID of PRINTER_SERVICE_UUIDS) {
    try {
      const svc = await server.getPrimaryService(serviceUUID);
      for (const charUUID of PRINTER_CHAR_UUIDS) {
        try {
          const c = await svc.getCharacteristic(charUUID);
          if (c.properties.write || c.properties.writeWithoutResponse) return c;
        } catch { /* try next */ }
      }
    } catch { /* try next service */ }
  }

  return null;
}

export async function connectPrinter(
  onStatusChange: (status: PrinterStatus, deviceName?: string) => void
): Promise<void> {
  onStatusChange('connecting');

  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    onStatusChange('error');
    throw new Error('Web Bluetooth is not available. Use Chrome on desktop or Android — not Firefox or Safari.');
  }

  try {
    _device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICE_UUIDS,
    });

    _device.addEventListener('gattserverdisconnected', () => {
      _char = null;
      _device = null;
      onStatusChange('disconnected');
    });

    const server = await connectGATTWithRetry(_device);
    const found = await discoverCharacteristic(_device, server);

    if (!found) {
      _device.gatt?.disconnect();
      _device = null;
      _char = null;
      onStatusChange('error');
      throw new Error('No writable characteristic found. Make sure the printer is on and in BLE mode.');
    }

    _char = found;
    onStatusChange('connected', _device.name ?? 'Printer');
  } catch (e) {
    const err = e as Error & { name?: string };
    _device = null;
    _char = null;
    // NotFoundError = user cancelled the picker — don't show error state
    onStatusChange(err.name === 'NotFoundError' ? 'disconnected' : 'error');
    throw e;
  }
}

export function disconnectPrinter() {
  _device?.gatt?.disconnect();
  _device = null;
  _char = null;
}

// ── Chunked write — 20-byte BLE MTU, same as billPrinter.ts ──────────────────
async function writeData(data: Uint8Array): Promise<void> {
  if (!_char) throw new Error('Printer not connected');
  const CHUNK = 20;
  for (let i = 0; i < data.length; i += CHUNK) {
    const slice = data.slice(i, i + CHUNK);
    if (_char.properties.writeWithoutResponse) {
      await _char.writeValueWithoutResponse(slice);
    } else {
      await _char.writeValue(slice);
    }
    await delay(10);
  }
}

// ── ESC/POS helpers ───────────────────────────────────────────────────────────
const enc = new TextEncoder();
const B = (...n: number[]) => new Uint8Array(n);

const ESC_INIT     = B(0x1b, 0x40);
const ALIGN_LEFT   = B(0x1b, 0x61, 0);
const ALIGN_CENTER = B(0x1b, 0x61, 1);
const BOLD_ON      = B(0x1b, 0x45, 1);
const BOLD_OFF     = B(0x1b, 0x45, 0);
const SIZE_DOUBLE  = B(0x1d, 0x21, 0x11);
const SIZE_NORMAL  = B(0x1d, 0x21, 0x00);
const FEED         = B(0x1b, 0x64, 4);
const CUT          = B(0x1d, 0x56, 0x41, 0x30);

function txt(s: string): Uint8Array { return enc.encode(s + '\n'); }
function div(char = '-', w = 32): Uint8Array { return enc.encode(char.repeat(w) + '\n'); }

function merge(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

// ── Build label bytes ─────────────────────────────────────────────────────────
function buildLabel(order: MerchOrder): Uint8Array {
  const addr = order.deliveryAddress;

  const parts: Uint8Array[] = [
    ESC_INIT,
    ALIGN_CENTER, BOLD_ON, SIZE_DOUBLE,
    txt('GRAMAKAM 2026'),
    SIZE_NORMAL, BOLD_OFF,
    div('='),
    ALIGN_LEFT, BOLD_ON, txt('TO:'),
    txt(order.customerName), BOLD_OFF,
  ];

  if (addr) {
    parts.push(txt(addr.line1));
    if (addr.line2) parts.push(txt(addr.line2));
    parts.push(txt(`${addr.city}, ${addr.state}`));
    parts.push(txt(`PIN: ${addr.pincode}`));
  }

  parts.push(
    txt(`Ph: +91 ${order.customerMobile}`),
    div('-'),
    BOLD_ON, txt(`Order: ${order.orderId}`), BOLD_OFF,
    div('-'),
  );

  for (const item of order.items) {
    const name = (item.name ?? item.productId ?? 'Item').replace(/^Gramakam\s+/i, '');
    const size = item.size && item.size !== 'N/A' ? ` (${item.size})` : '';
    parts.push(txt(`${name}${size}  x${item.quantity}`));
  }

  parts.push(
    div('='),
    ALIGN_CENTER, BOLD_ON, txt('Thank You!'), BOLD_OFF,
    txt('www.gramakam.org'),
    FEED, CUT,
  );

  return merge(...parts);
}

export async function printOrderLabel(order: MerchOrder): Promise<void> {
  if (!_char) throw new Error('Printer not connected');
  await writeData(buildLabel(order));
}
