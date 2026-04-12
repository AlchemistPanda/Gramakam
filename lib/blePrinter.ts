// BLE thermal printer integration — Web Bluetooth API + ESC/POS protocol
// Works with most common BLE thermal printers (58mm / 80mm rolls)

import type { MerchOrder } from '@/types';

// Known BLE printer service/characteristic UUID pairs (tried in order on connect)
const PRINTER_PROFILES = [
  // Generic ESC/POS over BLE (Zjiang, JP-series, etc.)
  {
    service: '000018f0-0000-1000-8000-00805f9b34fb',
    characteristic: '00002af1-0000-1000-8000-00805f9b34fb',
  },
  // Cheap BLE mini printers (Phomemo, PeriPage, etc.)
  {
    service: '0000ff00-0000-1000-8000-00805f9b34fb',
    characteristic: '0000ff02-0000-1000-8000-00805f9b34fb',
  },
  // Microchip RN4020 / some Goojprt & Bisofice printers
  {
    service: '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    characteristic: '49535343-8841-43f4-a8d4-ecbe34729bb3',
  },
  // SUNMI / Xprinter BLE
  {
    service: '0000ff12-0000-1000-8000-00805f9b34fb',
    characteristic: '0000ff01-0000-1000-8000-00805f9b34fb',
  },
];

export type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'printing' | 'error';

// Module-level singletons — one connection shared across renders
let _device: BluetoothDevice | null = null;
let _characteristic: BluetoothRemoteGATTCharacteristic | null = null;

export function isPrinterConnected(): boolean {
  return !!_characteristic && !!_device?.gatt?.connected;
}

export async function connectPrinter(
  onStatusChange: (status: PrinterStatus, deviceName?: string) => void
): Promise<void> {
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    throw new Error(
      'Web Bluetooth is not supported. Use Chrome on desktop or Android (not Firefox / Safari).'
    );
  }

  onStatusChange('connecting');

  try {
    _device = await (navigator as Navigator & { bluetooth: Bluetooth }).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_PROFILES.map((p) => p.service),
    });

    _device.addEventListener('gattserverdisconnected', () => {
      _characteristic = null;
      _device = null;
      onStatusChange('disconnected');
    });

    const server = await _device.gatt!.connect();

    // Try each profile until one works
    let found = false;
    for (const profile of PRINTER_PROFILES) {
      try {
        const service = await server.getPrimaryService(profile.service);
        _characteristic = await service.getCharacteristic(profile.characteristic);
        found = true;
        break;
      } catch {
        // Profile not supported by this device — try next
      }
    }

    if (!found) {
      await _device.gatt?.disconnect();
      _device = null;
      _characteristic = null;
      throw new Error(
        'No compatible printer service found on this device.\n' +
          'Make sure your printer is powered on and in BLE mode.'
      );
    }

    onStatusChange('connected', _device.name ?? 'Printer');
  } catch (err) {
    _device = null;
    _characteristic = null;
    onStatusChange('error');
    throw err;
  }
}

export function disconnectPrinter() {
  _device?.gatt?.disconnect();
  _device = null;
  _characteristic = null;
}

// ── Write chunked (BLE MTU is ~20–512 bytes; use 200-byte chunks to be safe) ──
async function writeChunked(data: Uint8Array): Promise<void> {
  if (!_characteristic) throw new Error('Printer not connected');
  const CHUNK = 200;
  for (let i = 0; i < data.length; i += CHUNK) {
    await _characteristic.writeValue(data.slice(i, i + CHUNK));
    await new Promise<void>((res) => setTimeout(res, 30));
  }
}

// ── ESC/POS command helpers ──
const B = (...args: number[]) => args;
const escInit  = () => B(0x1b, 0x40);
const escAlign = (a: 0 | 1 | 2) => B(0x1b, 0x61, a);         // 0=left 1=center 2=right
const escBold  = (on: boolean)   => B(0x1b, 0x45, on ? 1 : 0);
const escSize  = (w: 0|1, h: 0|1) => B(0x1d, 0x21, (w << 4) | h); // w/h: 0=normal 1=double
const escFeed  = (n = 3)          => B(0x1b, 0x64, n);
const escCut   = ()               => B(0x1d, 0x56, 0x41, 0x30); // partial cut + feed

function textBytes(str: string): number[] {
  const out: number[] = [];
  for (const ch of str) {
    const c = ch.charCodeAt(0);
    out.push(c < 256 ? c : 63); // '?' for chars outside latin-1
  }
  return out;
}

function ln(text: string): number[] {
  return [...textBytes(text), 0x0a];
}

function divider(char = '-', width = 32): number[] {
  return ln(char.repeat(width));
}

function centered(text: string, width = 32): number[] {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return ln(' '.repeat(pad) + text);
}

// ── Build and print an address label for an order ──
export async function printOrderLabel(order: MerchOrder): Promise<void> {
  if (!_characteristic) throw new Error('Printer not connected');

  const addr = order.deliveryAddress;

  const bytes: number[] = [
    // Initialise
    ...escInit(),

    // ── TITLE ──
    ...escAlign(1),
    ...escBold(true),
    ...escSize(1, 1),
    ...ln('GRAMAKAM 2026'),
    ...escSize(0, 0),
    ...escBold(false),
    ...divider('='),

    // ── TO ──
    ...escAlign(0),
    ...escBold(true),
    ...ln('TO:'),
    ...ln(order.customerName),
    ...escBold(false),
  ];

  if (addr) {
    bytes.push(...ln(addr.line1));
    if (addr.line2) bytes.push(...ln(addr.line2));
    bytes.push(...ln(`${addr.city}, ${addr.state}`));
    bytes.push(...ln(`PIN: ${addr.pincode}`));
  }

  bytes.push(
    ...ln(`Ph: +91 ${order.customerMobile}`),
    ...divider('-'),

    // ── ORDER ID ──
    ...escBold(true),
    ...ln(`Order: ${order.orderId}`),
    ...escBold(false),
    ...divider('-'),

    // ── ITEMS (name + size + qty, no price) ──
  );

  for (const item of order.items) {
    const name = (item.name ?? item.productId ?? 'Item').replace(/^Gramakam\s+/i, '');
    const sizePart = item.size && item.size !== 'N/A' ? ` (${item.size})` : '';
    bytes.push(...ln(`${name}${sizePart}  x${item.quantity}`));
  }

  bytes.push(
    ...divider('='),

    // ── THANK YOU ──
    ...escAlign(1),
    ...escBold(true),
    ...ln('Thank You!'),
    ...escBold(false),
    ...ln('www.gramakam.in'),
    ...escFeed(4),
    ...escCut(),
  );

  await writeChunked(new Uint8Array(bytes));
}
