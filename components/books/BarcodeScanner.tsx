'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Loader2, AlertCircle, Zap } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
  title?: string;
}

export default function BarcodeScanner({ onScan, onClose, title = 'Scan Barcode' }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrcodeRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const stopScanner = useCallback(async () => {
    try {
      if (html5QrcodeRef.current) {
        const state = html5QrcodeRef.current.getState();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          await html5QrcodeRef.current.stop();
        }
        html5QrcodeRef.current.clear();
        html5QrcodeRef.current = null;
      }
    } catch {
      // Ignore cleanup errors
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current || html5QrcodeRef.current) return;
    
    setError(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      if (!mountedRef.current) return;

      const scannerId = 'barcode-scanner-' + Date.now();
      
      // Create a div for the scanner
      const scanDiv = document.createElement('div');
      scanDiv.id = scannerId;
      scannerRef.current.innerHTML = '';
      scannerRef.current.appendChild(scanDiv);

      const scanner = new Html5Qrcode(scannerId);
      html5QrcodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Rear camera on phone
        {
          fps: 10,
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.5,
        },
        (decodedText: string) => {
          // Success callback
          if (!mountedRef.current) return;
          
          // Clean up the scanned value
          let cleanedIsbn = decodedText.trim().replace(/[-\s]/g, '');
          
          // ISBN should be 10 or 13 digits (or 9 digits + X for ISBN-10)
          const isValidIsbn = /^(?:\d{9}[\dX]|\d{13})$/i.test(cleanedIsbn);
          
          if (!isValidIsbn) {
            console.warn('Invalid ISBN format:', decodedText);
            // Still pass it through but with original value
            cleanedIsbn = decodedText.trim();
          }
          
          // Avoid duplicate rapid scans
          setLastScanned((prev) => {
            if (prev === cleanedIsbn) return prev;
            onScan(cleanedIsbn);
            return cleanedIsbn;
          });
        },
        () => {
          // Scan failure (expected — fires every frame without a barcode)
        }
      );
    } catch (err) {
      if (!mountedRef.current) return;
      setScanning(false);
      
      if ((err as Error & { name?: string })?.name === 'NotAllowedError' || (err as Error)?.message?.includes('Permission')) {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if ((err as Error & { name?: string })?.name === 'NotFoundError' || (err as Error)?.message?.includes('No camera')) {
        setError('No camera found. Make sure your device has a camera.');
      } else {
        setError((err as Error)?.message || 'Failed to start camera. Try again.');
      }
    }
  }, [onScan]);

  useEffect(() => {
    mountedRef.current = true;
    startScanner();

    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  // Clear last scanned after a delay to allow re-scanning same barcode
  useEffect(() => {
    if (!lastScanned) return;
    const t = setTimeout(() => setLastScanned(null), 3000);
    return () => clearTimeout(t);
  }, [lastScanned]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Camera size={20} className="text-maroon" />
            <h3 className="font-bold text-charcoal text-lg" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50">
            <X size={20} />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-4">
          <div className="relative bg-gray-900 rounded-xl overflow-hidden">
            {/* Camera view */}
            <div ref={scannerRef} className="w-full min-h-[280px]" />

            {/* Scanning overlay guide */}
            {scanning && !error && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="border-2 border-maroon/60 rounded-lg w-[280px] h-[120px] relative">
                  <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-3 border-l-3 border-maroon rounded-tl-lg" />
                  <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-3 border-r-3 border-maroon rounded-tr-lg" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-3 border-l-3 border-maroon rounded-bl-lg" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-3 border-r-3 border-maroon rounded-br-lg" />
                  {/* Scanning line animation */}
                  <motion.div
                    animate={{ y: [0, 100, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-2 right-2 h-0.5 bg-maroon/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {error ? (
            <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Camera Error</p>
                <p className="text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center">
              {lastScanned ? (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  <Zap size={16} />
                  <span>Scanned: <strong className="font-mono">{lastScanned}</strong></span>
                </motion.div>
              ) : (
                <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Point camera at the book&apos;s barcode...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Tips */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center">
          Hold steady • Works with ISBN barcodes (EAN-13) • Good lighting helps
        </div>
      </motion.div>
    </motion.div>
  );
}
