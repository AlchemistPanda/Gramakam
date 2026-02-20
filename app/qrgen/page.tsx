'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Image as ImageIcon, X, Copy, Check,
  Sliders, RefreshCw, QrCode, ChevronDown,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ErrorLevel = 'L' | 'M' | 'Q' | 'H';
type DotStyle = 'square' | 'rounded' | 'dots';

interface QROptions {
  text: string;
  fgColor: string;
  bgColor: string;
  size: number;
  errorLevel: ErrorLevel;
  dotStyle: DotStyle;
  logoUrl: string | null;
  logoSize: number; // % of QR size
  logoBgColor: string;
  logoPadding: number;
  logoRounded: boolean;
}

const DEFAULTS: QROptions = {
  text: 'https://gramakam.org',
  fgColor: '#1a1a1a',
  bgColor: '#ffffff',
  size: 400,
  errorLevel: 'H',
  dotStyle: 'square',
  logoUrl: null,
  logoSize: 22,
  logoBgColor: '#ffffff',
  logoPadding: 6,
  logoRounded: true,
};

const ERROR_LEVELS: { value: ErrorLevel; label: string; desc: string }[] = [
  { value: 'L', label: 'L', desc: '7% correction' },
  { value: 'M', label: 'M', desc: '15% correction' },
  { value: 'Q', label: 'Q', desc: '25% correction' },
  { value: 'H', label: 'H', desc: '30% correction — best for logos' },
];

const PRESETS = [
  { label: 'Classic', fg: '#1a1a1a', bg: '#ffffff' },
  { label: 'Navy', fg: '#1e3a5f', bg: '#e8f4f8' },
  { label: 'Maroon', fg: '#800020', bg: '#fff8dc' },
  { label: 'Forest', fg: '#1a4731', bg: '#f0faf4' },
  { label: 'Midnight', fg: '#ffffff', bg: '#1a1a2e' },
  { label: 'Sunset', fg: '#7c3238', bg: '#fff0e6' },
  { label: 'Indigo', fg: '#312e81', bg: '#eef2ff' },
  { label: 'Gold', fg: '#92400e', bg: '#fefce8' },
];

// ─── Canvas renderer ────────────────────────────────────────────────────────

async function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  opts: QROptions,
): Promise<void> {
  const QRCode = await import('qrcode');

  const { size, fgColor, bgColor, errorLevel, logoUrl, logoSize, logoBgColor, logoPadding, logoRounded } = opts;

  // Step 1: generate raw QR matrix via toCanvas
  const tempCanvas = document.createElement('canvas');
  await QRCode.toCanvas(tempCanvas, opts.text || ' ', {
    width: size,
    margin: 2,
    errorCorrectionLevel: errorLevel,
    color: { dark: fgColor, light: bgColor },
  });

  // Step 2: draw onto main canvas (apply dot style if needed)
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  if (opts.dotStyle === 'square') {
    // Direct copy — fastest
    ctx.drawImage(tempCanvas, 0, 0);
  } else {
    // Parse the raw module grid via pixel sampling
    const tempCtx = tempCanvas.getContext('2d')!;
    const imgData = tempCtx.getImageData(0, 0, size, size);

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Estimate module count by scanning first row for colour changes
    // QR lib puts uniform margin — sample from margin+1 to size-margin
    const marginPx = Math.round(size * 2 / (size / 4 + 2 * 2)); // rough
    const inner = size - marginPx * 2;

    // Count modules
    let moduleCount = 21; // minimum QR modules
    const rowData = tempCtx.getImageData(0, Math.floor(size / 2), size, 1).data;
    let transitions = 0;
    let lastDark = rowData[0] < 128;
    for (let x = 1; x < size; x++) {
      const isDark = rowData[x * 4] < 128;
      if (isDark !== lastDark) { transitions++; lastDark = isDark; }
    }
    moduleCount = Math.max(21, Math.round(transitions / 2));

    const dotSize = inner / moduleCount;
    const r = opts.dotStyle === 'dots' ? dotSize * 0.5 : dotSize * 0.35;

    ctx.fillStyle = fgColor;
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        const px = marginPx + col * dotSize + dotSize / 2;
        const py = marginPx + row * dotSize + dotSize / 2;
        const pidx = (Math.round(py) * size + Math.round(px)) * 4;
        const isDark = imgData.data[pidx] < 128;
        if (!isDark) continue;

        const cx = marginPx + col * dotSize + dotSize / 2;
        const cy = marginPx + row * dotSize + dotSize / 2;

        ctx.beginPath();
        if (opts.dotStyle === 'dots') {
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
        } else {
          // rounded squares
          const x0 = marginPx + col * dotSize + dotSize * 0.08;
          const y0 = marginPx + row * dotSize + dotSize * 0.08;
          const s = dotSize * 0.84;
          ctx.roundRect(x0, y0, s, s, r);
        }
        ctx.fill();
      }
    }
  }

  // Step 3: overlay logo
  if (logoUrl) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const logoW = size * (logoSize / 100);
        const logoH = logoW;
        const cx = size / 2;
        const cy = size / 2;
        const pad = logoPadding;
        const bgW = logoW + pad * 2;
        const bgH = logoH + pad * 2;

        // Logo background
        ctx.fillStyle = logoBgColor;
        if (logoRounded) {
          ctx.beginPath();
          ctx.roundRect(cx - bgW / 2, cy - bgH / 2, bgW, bgH, bgW * 0.18);
          ctx.fill();
        } else {
          ctx.fillRect(cx - bgW / 2, cy - bgH / 2, bgW, bgH);
        }

        // Draw logo
        ctx.drawImage(img, cx - logoW / 2, cy - logoH / 2, logoW, logoH);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = logoUrl;
    });
  }
}

// ─── Download helper ────────────────────────────────────────────────────────

function downloadCanvas(canvas: HTMLCanvasElement, format: 'png' | 'jpg', filename: string) {
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = format === 'jpg' ? 0.95 : undefined;
  const url = canvas.toDataURL(mime, quality);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${format}`;
  a.click();
}

// ─── Small helper components ─────────────────────────────────────────────────

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-medium text-gray-600 shrink-0">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative w-9 h-9 rounded-xl overflow-hidden border-2 border-gray-200 cursor-pointer shadow-sm hover:border-gray-400 transition-colors">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-full h-full" style={{ background: value }} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v.length === 7 ? v : v);
          }}
          className="w-24 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
        />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function QRGenPage() {
  const [opts, setOpts] = useState<QROptions>(DEFAULTS);
  const [copied, setCopied] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [activeSection, setActiveSection] = useState<'colors' | 'style' | 'logo' | null>('colors');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const renderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof QROptions>(key: K, value: QROptions[K]) =>
    setOpts((prev) => ({ ...prev, [key]: value }));

  // Debounced render
  const scheduleRender = useCallback((o: QROptions) => {
    if (renderTimer.current) clearTimeout(renderTimer.current);
    renderTimer.current = setTimeout(async () => {
      if (!canvasRef.current || !o.text.trim()) return;
      setRendering(true);
      try {
        await renderQRToCanvas(canvasRef.current, o);
      } catch (e) {
        console.warn('QR render error:', e);
      } finally {
        setRendering(false);
      }
    }, 150);
  }, []);

  useEffect(() => { scheduleRender(opts); }, [opts, scheduleRender]);

  const handleLogoUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    set('logoUrl', url);
    // H error level needed for logo overlap
    if (opts.errorLevel !== 'H') set('errorLevel', 'H');
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* clipboard API not available */ }
    });
  };

  const slug = (opts.text.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 40) || 'gramakam-qr');

  const Section = ({ id, title, icon }: { id: typeof activeSection; title: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveSection(activeSection === id ? null : id)}
      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700"
    >
      <span className="flex items-center gap-2">{icon}{title}</span>
      <ChevronDown size={16} className={`transition-transform ${activeSection === id ? 'rotate-180' : ''}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
              <QrCode size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900">QR Generator</span>
              <span className="ml-2 text-xs text-gray-400 font-medium hidden sm:inline">gramakam.org/qrgen</span>
            </div>
          </div>
          <a href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors font-medium">← gramakam.org</a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

          {/* LEFT — Preview */}
          <div className="flex flex-col items-center gap-6">
            {/* QR Preview Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col items-center gap-5 w-full max-w-lg">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="rounded-2xl shadow-lg"
                  style={{ width: 280, height: 280, imageRendering: 'pixelated' }}
                />
                <AnimatePresence>
                  {rendering && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center"
                    >
                      <RefreshCw size={24} className="text-violet-500 animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center w-full">
                <button
                  onClick={() => canvasRef.current && downloadCanvas(canvasRef.current, 'png', slug)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-violet-200"
                >
                  <Download size={15} /> PNG
                </button>
                <button
                  onClick={() => canvasRef.current && downloadCanvas(canvasRef.current, 'jpg', slug)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-indigo-200"
                >
                  <Download size={15} /> JPG
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  {copied ? <><Check size={15} className="text-green-600" /> Copied!</> : <><Copy size={15} /> Copy</>}
                </button>
                <button
                  onClick={() => setOpts(DEFAULTS)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-sm font-semibold transition-colors"
                  title="Reset to defaults"
                >
                  <RefreshCw size={15} /> Reset
                </button>
              </div>
            </div>

            {/* URL / Text Input */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full max-w-lg">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Content</label>
              <textarea
                value={opts.text}
                onChange={(e) => set('text', e.target.value)}
                rows={3}
                placeholder="Enter a URL, text, phone number, email..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none font-mono"
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {['https://gramakam.org', 'tel:+91', 'mailto:', 'upi://pay?pa='].map((quick) => (
                  <button key={quick} onClick={() => set('text', quick)}
                    className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-violet-100 hover:text-violet-700 rounded-lg transition-colors font-mono text-gray-500">
                    {quick}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Slider */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full max-w-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Output Size</label>
                <span className="text-sm font-semibold text-violet-700">{opts.size} × {opts.size} px</span>
              </div>
              <input
                type="range" min={200} max={1200} step={50}
                value={opts.size}
                onChange={(e) => set('size', parseInt(e.target.value))}
                className="w-full accent-violet-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>200px</span><span>Small print</span><span>High-res</span><span>1200px</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Options Panel */}
          <div className="space-y-3">

            {/* Color Presets */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Presets</p>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setOpts((prev) => ({ ...prev, fgColor: p.fg, bgColor: p.bg }))}
                    title={p.label}
                    className="group flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full h-10 rounded-xl border-2 border-gray-200 group-hover:border-violet-400 transition-colors shadow-sm overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${p.bg} 50%, ${p.fg} 50%)` }}
                    />
                    <span className="text-[10px] text-gray-500 font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors Accordion */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-3">
                <Section id="colors" title="Colors" icon={<span className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 inline-block" />} />
              </div>
              <AnimatePresence initial={false}>
                {activeSection === 'colors' && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden">
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-50">
                      <div className="pt-4">
                        <ColorInput label="QR Dots" value={opts.fgColor} onChange={(v) => set('fgColor', v)} />
                      </div>
                      <ColorInput label="Background" value={opts.bgColor} onChange={(v) => set('bgColor', v)} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Style Accordion */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-3">
                <Section id="style" title="Style & Error Level" icon={<Sliders size={14} />} />
              </div>
              <AnimatePresence initial={false}>
                {activeSection === 'style' && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden">
                    <div className="px-5 pb-5 border-t border-gray-50">
                      <p className="text-xs font-semibold text-gray-500 mt-4 mb-2">Dot Style</p>
                      <div className="flex gap-2">
                        {(['square', 'rounded', 'dots'] as DotStyle[]).map((s) => (
                          <button key={s} onClick={() => set('dotStyle', s)}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize border-2 transition-colors ${opts.dotStyle === s ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs font-semibold text-gray-500 mt-4 mb-2">Error Correction</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {ERROR_LEVELS.map((el) => (
                          <button key={el.value} onClick={() => set('errorLevel', el.value)}
                            title={el.desc}
                            className={`py-2 rounded-xl text-sm font-bold border-2 transition-colors ${opts.errorLevel === el.value ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                            {el.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">H = best for center logo overlay</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logo Accordion */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-3">
                <Section id="logo" title="Center Logo / Image" icon={<ImageIcon size={14} />} />
              </div>
              <AnimatePresence initial={false}>
                {activeSection === 'logo' && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden">
                    <div className="px-5 pb-5 border-t border-gray-50">
                      {opts.logoUrl ? (
                        <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <img src={opts.logoUrl} alt="logo" className="w-12 h-12 rounded-lg object-contain border border-gray-200 bg-white" />
                          <div className="flex-1 text-xs text-gray-600 font-medium">Logo loaded</div>
                          <button onClick={() => set('logoUrl', null)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => fileRef.current?.click()}
                          className="mt-4 w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-colors flex items-center justify-center gap-2 font-medium">
                          <ImageIcon size={16} /> Upload Logo / Image
                        </button>
                      )}
                      <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />

                      {opts.logoUrl && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-semibold text-gray-500">Logo Size</span>
                              <span className="text-xs text-violet-700 font-semibold">{opts.logoSize}%</span>
                            </div>
                            <input type="range" min={10} max={35} step={1} value={opts.logoSize}
                              onChange={(e) => set('logoSize', parseInt(e.target.value))}
                              className="w-full accent-violet-600" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-semibold text-gray-500">Padding</span>
                              <span className="text-xs text-violet-700 font-semibold">{opts.logoPadding}px</span>
                            </div>
                            <input type="range" min={0} max={20} step={1} value={opts.logoPadding}
                              onChange={(e) => set('logoPadding', parseInt(e.target.value))}
                              className="w-full accent-violet-600" />
                          </div>
                          <ColorInput label="Logo BG" value={opts.logoBgColor} onChange={(v) => set('logoBgColor', v)} />
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">Rounded corners</span>
                            <button onClick={() => set('logoRounded', !opts.logoRounded)}
                              className={`w-10 h-5 rounded-full transition-colors relative ${opts.logoRounded ? 'bg-violet-600' : 'bg-gray-300'}`}>
                              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${opts.logoRounded ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick tip */}
            <p className="text-xs text-gray-400 text-center px-2 leading-relaxed">
              For logos, use <strong>H</strong> error correction (auto-set on upload). PNG preserves transparency; JPG is smaller.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
