'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Download,
  Shield,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Check,
  Sparkles,
  Camera,
  Eye,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Info,
  Lock,
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────
const CANVAS_SIZE = 1080;
const PREVIEW_SIZE = 360;

// ─── Frame drawing helper ───────────────────────────────────────
function drawFrame(
  ctx: CanvasRenderingContext2D,
  size: number,
  logoImg: HTMLImageElement | null
) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2;

  // ── Elegant outer ring (Glass effect boundary) ─────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - size * 0.005, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(128, 0, 32, 0.15)';
  ctx.lineWidth = size * 0.004;
  ctx.stroke();
  ctx.restore();

  // ── Bottom arc band (The maroon frame) ─────────────────────
  // Canvas angles: 0 = 3 o'clock, PI/2 = 6 o'clock (bottom), PI = 9 o'clock
  const bandThickness = size * 0.14;
  const bandRadius = radius - bandThickness / 2 - size * 0.005;
  const arcSpan = (150 * Math.PI) / 180; // 150 degrees
  const bottomCenter = Math.PI / 2; // 6 o'clock = bottom
  const arcStart = bottomCenter - arcSpan / 2;
  const arcEnd = bottomCenter + arcSpan / 2;

  // Main arc band with premium gradient
  ctx.save();
  const bandGradient = ctx.createLinearGradient(
    cx - radius * 0.7, cy + radius * 0.5,
    cx + radius * 0.7, cy + radius
  );
  bandGradient.addColorStop(0, '#5a0015');
  bandGradient.addColorStop(0.5, '#800020');
  bandGradient.addColorStop(1, '#6b0019');
  
  ctx.strokeStyle = bandGradient;
  ctx.lineWidth = bandThickness;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.arc(cx, cy, bandRadius, arcStart, arcEnd);
  ctx.stroke();
  
  // Subtle glossy highlight on the band
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = size * 0.002;
  ctx.beginPath();
  ctx.arc(cx, cy, bandRadius - bandThickness * 0.4, arcStart + 0.05, arcEnd - 0.05);
  ctx.stroke();
  ctx.restore();

  // ── "GRAMAKAM 2026" text along the arc ────────────────────
  ctx.save();
  const mainText = 'GRAMAKAM  2026';
  const fontSize = size * 0.048;
  ctx.font = `bold ${fontSize}px 'Playfair Display', Georgia, serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = size * 0.005;

  // Center alignment logic:
  // Start on the left (PI + offset) and move towards the right (0 + offset)
  // Left side has HIGHER angles in Canvas API (PI), right side has LOWER angles (0).
  const charSpacing = size * 0.006;
  let totalWidth = 0;
  for (let i = 0; i < mainText.length; i++) {
    totalWidth += ctx.measureText(mainText[i]).width + charSpacing;
  }
  totalWidth -= charSpacing;
  const totalAngle = totalWidth / bandRadius;
  
  // Starting calculation: Bottom Center (PI/2) + Half the span to start on the LEFT
  let angle = bottomCenter + totalAngle / 2;

  for (let i = 0; i < mainText.length; i++) {
    const charW = ctx.measureText(mainText[i]).width;
    const halfCharAngle = (charW / 2) / bandRadius;
    angle -= halfCharAngle; // Subtract because we move from LEFT (high angle) to RIGHT (low angle)

    ctx.save();
    ctx.translate(
      cx + bandRadius * Math.cos(angle),
      cy + bandRadius * Math.sin(angle)
    );
    ctx.rotate(angle - Math.PI / 2);
    ctx.fillText(mainText[i], 0, 0);
    ctx.restore();

    angle -= (halfCharAngle + charSpacing / bandRadius);
  }
  ctx.restore();

  // ── Dates text below "GRAMAKAM" ────────────────────────────
  ctx.save();
  const dateText = 'APRIL 18 - 22, 2026';
  const dateFontSize = size * 0.022;
  ctx.font = `600 ${dateFontSize}px 'Inter', system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${size * 0.002}px`;

  const dateRadius = bandRadius + bandThickness * 0.32;
  let dateTotalWidth = 0;
  const dateCharSpacing = size * 0.002;
  for (let i = 0; i < dateText.length; i++) {
    dateTotalWidth += ctx.measureText(dateText[i]).width + dateCharSpacing;
  }
  const dateTotalAngle = dateTotalWidth / dateRadius;
  let dAngle = bottomCenter + dateTotalAngle / 2;

  for (let i = 0; i < dateText.length; i++) {
    const charW = ctx.measureText(dateText[i]).width;
    const halfCharAngle = (charW / 2) / dateRadius;
    dAngle -= halfCharAngle;

    ctx.save();
    ctx.translate(
      cx + dateRadius * Math.cos(dAngle),
      cy + dateRadius * Math.sin(dAngle)
    );
    ctx.rotate(dAngle - Math.PI / 2);
    ctx.fillText(dateText[i], 0, 0);
    ctx.restore();

    dAngle -= (halfCharAngle + dateCharSpacing / dateRadius);
  }
  ctx.restore();

  // ── Logo at the top (Larger and Transparent) ──────────────
  if (logoImg) {
    const logoSize = size * 0.16;
    const logoY = size * 0.05 + logoSize / 2;

    ctx.save();
    // Professional drop shadow to ensure visibility on all photos
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = size * 0.015;
    ctx.shadowOffsetX = size * 0.002;
    ctx.shadowOffsetY = size * 0.002;

    // Draw logo directly
    ctx.drawImage(
      logoImg,
      cx - logoSize / 2,
      logoY - logoSize / 2,
      logoSize,
      logoSize
    );
    ctx.restore();
  }
}

// ─── Component ──────────────────────────────────────────────────
export default function ProfileFrameGenerator() {
  const [image, setImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [step, setStep] = useState<'upload' | 'adjust' | 'preview'>('upload');
  
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const whatsappRef = useRef<HTMLCanvasElement>(null);
  const instagramRef = useRef<HTMLCanvasElement>(null);
  const facebookRef = useRef<HTMLCanvasElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userImageRef = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);

  // ── Load logo ─────────────────────────────────────────────
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoRef.current = img;
      setLogoLoaded(true);
    };
    img.src = '/images/gramakam-logo-white.png';
  }, []);

  // ── Render loop ───────────────────────────────────────────
  const updateCanvases = useCallback(() => {
    const mainCanvas = previewCanvasRef.current;
    if (!mainCanvas) return;
    const ctx = mainCanvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const size = mainCanvas.offsetWidth * dpr;
    mainCanvas.width = size;
    mainCanvas.height = size;

    ctx.clearRect(0, 0, size, size);

    // 1. Clip and Draw User Photo
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#f5f2ed';
    ctx.fillRect(0, 0, size, size);

    if (userImageRef.current) {
      const img = userImageRef.current;
      const baseScale = Math.max(size / img.width, size / img.height);
      const totalScale = baseScale * zoom;
      const dw = img.width * totalScale;
      const dh = img.height * totalScale;
      const dx = (size - dw) / 2 + (offset.x * (size / PREVIEW_SIZE));
      const dy = (size - dh) / 2 + (offset.y * (size / PREVIEW_SIZE));
      ctx.drawImage(img, dx, dy, dw, dh);
    }
    ctx.restore();

    // 2. Draw Frame Overlay
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    drawFrame(ctx, size, logoRef.current);
    ctx.restore();

    // 3. Update Social Previews
    [whatsappRef, instagramRef, facebookRef].forEach(ref => {
      const el = ref.current;
      if (!el) return;
      el.width = 100;
      el.height = 100;
      const c = el.getContext('2d');
      if (!c) return;
      c.clearRect(0, 0, 100, 100);
      c.beginPath();
      c.arc(50, 50, 50, 0, Math.PI * 2);
      c.clip();
      c.drawImage(mainCanvas, 0, 0, 100, 100);
    });
  }, [zoom, offset]);

  useEffect(() => {
    const render = () => {
      updateCanvases();
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [updateCanvases, image, logoLoaded, step]);

  // ── Handlers ──────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        userImageRef.current = img;
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setStep('adjust');
        setImage(ev.target?.result as string);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (step !== 'adjust') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset, step]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const maxScroll = (CANVAS_SIZE * (zoom - 1)) / 2;
    // We allow dragging within the preview bounds
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  const nudge = (dir: string) => {
    setOffset(prev => ({
      x: prev.x + (dir === 'left' ? -15 : dir === 'right' ? 15 : 0),
      y: prev.y + (dir === 'up' ? -15 : dir === 'down' ? 15 : 0)
    }));
  };

  const handleDownload = async () => {
    if (!userImageRef.current) return;
    setIsDownloading(true);
    
    // Create large high-quality canvas
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d')!;

    // 1. Photo
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE/2, CANVAS_SIZE/2, CANVAS_SIZE/2, 0, Math.PI*2);
    ctx.clip();
    const img = userImageRef.current;
    const baseScale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
    const totalScale = baseScale * zoom;
    const dw = img.width * totalScale;
    const dh = img.height * totalScale;
    const dx = (CANVAS_SIZE - dw) / 2 + (offset.x * (CANVAS_SIZE / PREVIEW_SIZE));
    const dy = (CANVAS_SIZE - dh) / 2 + (offset.y * (CANVAS_SIZE / PREVIEW_SIZE));
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();

    // 2. Frame
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE/2, CANVAS_SIZE/2, CANVAS_SIZE/2, 0, Math.PI*2);
    ctx.clip();
    drawFrame(ctx, CANVAS_SIZE, logoRef.current);
    ctx.restore();

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gramakam-profile-frame.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsDownloading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    }, 'image/png', 1.0);
  };

  const reset = () => {
    setImage(null);
    setStep('upload');
    userImageRef.current = null;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="pfg-container">
      {/* ── Privacy Badge (Top) ────────────────────────────────── */}
      <div className="pfg-privacy-header">
        <motion.div 
          className="pfg-privacy-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="pfg-privacy-icons">
            <Lock size={18} />
          </div>
          <div className="pfg-privacy-content">
            <div className="pfg-privacy-main">
              <strong>Your image is safe.</strong> Everything runs 100% in your browser.
            </div>
            <div className="pfg-privacy-tags">
              <span className="pfg-tag"><Shield size={10} /> No Server Uploads</span>
              <span className="pfg-tag"><Check size={10} /> No AI Used</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Hero section ─────────────────────────────────────── */}
      <header className="pfg-header">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pfg-edition"
        >
          <Sparkles size={14} /> 9th Edition
        </motion.div>
        <h1 className="pfg-title">Gramakam 2026</h1>
        <p className="pfg-subtitle">Create your professional Gramakam 2026 profile picture</p>
      </header>

      {/* ── Steps indicator ──────────────────────────────────── */}
      <div className="pfg-steps">
        {['Upload Image', 'Adjust Position', 'Download Result'].map((label, i) => {
          const keys = ['upload', 'adjust', 'preview'] as const;
          const active = keys.indexOf(step) >= i;
          return (
            <div key={label} className={`pfg-step ${active ? 'active' : ''}`}>
              <div className="pfg-step-num">{active && i < keys.indexOf(step) ? <Check size={14} /> : i + 1}</div>
              <span className="pfg-step-label">{label.split(' ')[0]}</span>
              {i < 2 && <div className={`pfg-step-line ${active && i < keys.indexOf(step) - 1 ? 'active' : ''}`} />}
            </div>
          );
        })}
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="pfg-main">
        <AnimatePresence mode="wait">
          {step === 'upload' ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pfg-upload-zone"
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="hidden-input" 
                id="main-upload"
              />
              <label htmlFor="main-upload" className="pfg-dropzone">
                <div className="pfg-dropzone-inner">
                  <div className="pfg-upload-icon-box">
                    <Camera size={40} strokeWidth={1.5} />
                  </div>
                  <h3>Upload Your Photo</h3>
                  <p>Select a clear photo where your face is visible</p>
                  <div className="pfg-format-pills">
                    <span>JPEG</span>
                    <span>PNG</span>
                    <span>HEIC</span>
                  </div>
                </div>
              </label>
            </motion.div>
          ) : (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pfg-editor-box"
            >
              <div className="pfg-workspace">
                {/* ── Preview Circle ── */}
                <div className="pfg-preview-col">
                  <div className="pfg-canvas-container">
                    <div className="pfg-canvas-label"><Eye size={12} /> Live Preview</div>
                    <div 
                      className="pfg-canvas-wrapper"
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                    >
                      <canvas 
                        ref={previewCanvasRef} 
                        className="pfg-main-canvas"
                        style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, cursor: isDragging ? 'grabbing' : 'grab' }}
                      />
                      {step === 'adjust' && (
                        <div className="pfg-drag-indicator">
                          <Move size={14} /> Drag photo to center your face
                        </div>
                      )}
                    </div>

                    {/* Simple Social Icons */}
                    <div className="pfg-social-previews">
                      {[
                        { name: 'WhatsApp', ref: whatsappRef },
                        { name: 'Instagram', ref: instagramRef },
                        { name: 'Facebook', ref: facebookRef }
                      ].map(social => (
                        <div key={social.name} className="pfg-social-item">
                          <canvas ref={social.ref} className="pfg-mini-canvas" />
                          <span>{social.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Controls Col ── */}
                <div className="pfg-controls-col">
                  <AnimatePresence mode="wait">
                    {step === 'adjust' ? (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pfg-controls-box"
                      >
                        <div className="pfg-control-group">
                          <label><ZoomIn size={14} /> Zoom Size</label>
                          <div className="pfg-zoom-slider">
                            <button onClick={() => setZoom(z => Math.max(1, z-0.1))} className="pfg-zoom-btn"><ZoomOut size={16} /></button>
                            <input 
                              type="range" 
                              min="1" max="3" step="0.01" 
                              value={zoom} 
                              onChange={(e) => setZoom(parseFloat(e.target.value))}
                            />
                            <button onClick={() => setZoom(z => Math.min(3, z+0.1))} className="pfg-zoom-btn"><ZoomIn size={16} /></button>
                          </div>
                        </div>

                        <div className="pfg-control-group">
                          <label><Move size={14} /> Fine Tune Position</label>
                          <div className="pfg-nudge-controls">
                            <button onClick={() => nudge('up')} className="nudge-btn up"><ArrowUp size={16} /></button>
                            <div className="nudge-row">
                              <button onClick={() => nudge('left')} className="nudge-btn left"><ArrowLeft size={16} /></button>
                              <button onClick={() => setOffset({x:0, y:0})} className="nudge-btn center"><RotateCcw size={14} /></button>
                              <button onClick={() => nudge('right')} className="nudge-btn right"><ArrowRight size={16} /></button>
                            </div>
                            <button onClick={() => nudge('down')} className="nudge-btn down"><ArrowDown size={16} /></button>
                          </div>
                        </div>

                        <div className="pfg-action-btns">
                          <button onClick={reset} className="pfg-btn-text"><RotateCcw size={14} /> Change Image</button>
                          <button onClick={() => setStep('preview')} className="pfg-btn-primary">Continue <Check size={16} /></button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="pfg-download-box"
                      >
                        <div className="success-lottie">✨</div>
                        <h3>Photo Ready!</h3>
                        <p>Optimized for social media. No quality loss at 1080x1080px.</p>
                        
                        <div className="pfg-dl-actions">
                          <button 
                            onClick={handleDownload} 
                            className="pfg-btn-download"
                            disabled={isDownloading}
                          >
                            {isDownloading ? 'Processing...' : 'Download Picture'}
                            <Download size={18} />
                          </button>
                          <button onClick={() => setStep('adjust')} className="pfg-btn-secondary">Readjust Photo</button>
                          <button onClick={reset} className="pfg-btn-text">Start Over</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Instructions / FAQ (Bottom) ───────────────────────── */}
      <footer className="pfg-footer-info">
        <h2 className="pfg-footer-title">Set as Profile Picture</h2>
        <div className="pfg-tips-grid">
          <div className="pfg-tip">
            <div className="pfg-tip-icon">📱</div>
            <h4>WhatsApp</h4>
            <p>Settings → Profile → Tap camera icon → Select from Gallery</p>
          </div>
          <div className="pfg-tip">
            <div className="pfg-tip-icon">📸</div>
            <h4>Instagram</h4>
            <p>Edit Profile → Change profile photo → Choose from Library</p>
          </div>
          <div className="pfg-tip">
            <div className="pfg-tip-icon">👤</div>
            <h4>Facebook</h4>
            <p>Profile → Tap profile picture → Upload photo</p>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="pfg-success-toast"
          >
            <Sparkles size={16} className="text-yellow-400" /> Profile Picture downloaded successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .pfg-container {
          min-height: calc(100vh - 80px);
          background: #fafaf9;
          padding: 24px 16px 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: var(--font-body);
        }

        /* ── Header & Hero ── */
        .pfg-privacy-header {
          margin-bottom: 32px;
          max-width: 500px;
          width: 100%;
        }
        .pfg-privacy-card {
          background: #fff;
          border: 1px solid #e7e5e4;
          border-radius: 20px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          border-left: 4px solid #166534;
        }
        .pfg-privacy-icons {
          background: #f0fdf4;
          color: #166534;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pfg-privacy-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pfg-privacy-main {
          font-size: 13.5px;
          color: #262626;
          line-height: 1.4;
        }
        .pfg-privacy-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pfg-tag {
          font-size: 10px;
          background: #f1f5f9;
          color: #475569;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 700;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 4px;
          border: 1px solid #e2e8f0;
        }

        .pfg-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .pfg-edition {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(128, 0, 32, 0.08);
          color: #800020;
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: 0.5px;
        }
        .pfg-title {
          font-family: var(--font-heading);
          font-size: 42px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0 0 8px;
        }
        .pfg-subtitle {
          color: #666;
          max-width: 400px;
          line-height: 1.5;
        }

        /* ── Steps ── */
        .pfg-steps {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 40px;
          width: 100%;
          max-width: 450px;
        }
        .pfg-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
          position: relative;
        }
        .pfg-step-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #e7e5e4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #a8a29e;
          background: #fff;
          z-index: 2;
          transition: 0.3s;
        }
        .pfg-step.active .pfg-step-num {
          border-color: #800020;
          color: #800020;
          background: rgba(128,0,32,0.05);
        }
        .pfg-step-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #a8a29e;
          letter-spacing: 0.5px;
        }
        .pfg-step.active .pfg-step-label { color: #800020; }
        .pfg-step-line {
          position: absolute;
          top: 16px;
          left: calc(50% + 16px);
          width: calc(100% - 32px + 24px);
          height: 2px;
          background: #e7e5e4;
          z-index: 1;
        }
        .pfg-step-line.active { background: #800020; }

        /* ── Upload ── */
        .pfg-upload-zone {
          width: 100%;
          max-width: 450px;
        }
        .pfg-dropzone {
          display: block;
          border: 2px dashed #d6d3d1;
          border-radius: 32px;
          padding: 8px;
          cursor: pointer;
          transition: 0.3s;
        }
        .pfg-dropzone:hover {
          border-color: #800020;
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.05);
        }
        .pfg-dropzone-inner {
          background: #fff;
          border-radius: 24px;
          padding: 50px 20px;
          text-align: center;
        }
        .pfg-upload-icon-box {
          width: 80px;
          height: 80px;
          background: #f8fafc;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: #800020;
        }
        .pfg-dropzone h3 {
          font-family: var(--font-heading);
          font-size: 24px;
          margin-bottom: 8px;
        }
        .pfg-dropzone p { color: #666; font-size: 14px; margin-bottom: 24px; }
        .pfg-format-pills { display: flex; justify-content: center; gap: 8px; }
        .pfg-format-pills span {
          font-size: 10px;
          font-weight: 800;
          background: #f4f4f5;
          padding: 4px 8px;
          border-radius: 6px;
          color: #71717a;
        }

        /* ── Editor Workspace ── */
        .pfg-editor-box {
          width: 100%;
          max-width: 900px;
          background: #fff;
          border-radius: 32px;
          padding: 24px;
          border: 1px solid #e7e5e4;
          box-shadow: 0 20px 50px rgba(0,0,0,0.05);
        }
        .pfg-workspace {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        @media (max-width: 768px) {
          .pfg-workspace { grid-template-columns: 1fr; }
          .pfg-editor-box { padding: 16px; border-radius: 24px; }
        }

        .pfg-canvas-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .pfg-canvas-label {
          font-size: 11px;
          font-weight: 700;
          color: #a8a29e;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pfg-canvas-wrapper {
          position: relative;
          background: #000;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 0 0 4px #fff, 0 0 0 6px #8000201a, 0 20px 40px rgba(0,0,0,0.1);
          touch-action: none;
        }
        .pfg-main-canvas {
          display: block;
        }
        .pfg-drag-indicator {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.6);
          color: #fff;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 11px;
          white-space: nowrap;
          pointer-events: none;
          backdrop-filter: blur(4px);
        }

        .pfg-social-previews {
          display: flex;
          gap: 20px;
          margin-top: 32px;
        }
        .pfg-social-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .pfg-mini-canvas {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1.5px solid #e7e5e4;
        }
        .pfg-social-item span { font-size: 10px; font-weight: 600; color: #78716c; }

        /* ── Controls Row ── */
        .pfg-controls-box {
          padding-top: 20px;
        }
        .pfg-control-group {
          margin-bottom: 24px;
        }
        .pfg-control-group label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #444;
          margin-bottom: 16px;
        }

        .pfg-zoom-slider {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafc;
          padding: 8px 16px;
          border-radius: 16px;
        }
        .pfg-zoom-slider input {
          flex: 1;
          height: 4px;
          accent-color: #800020;
        }
        .pfg-zoom-btn {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
        }

        .pfg-nudge-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .nudge-row {
          display: flex;
          gap: 6px;
        }
        .nudge-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1px solid #e7e5e4;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          cursor: pointer;
          transition: 0.2s;
        }
        .nudge-btn:hover { background: #fef2f2; color: #800020; border-color: #800020; }
        .nudge-btn.center { color: #d6d3d1; }

        .pfg-action-btns {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pfg-btn-primary {
          background: #800020;
          color: #fff;
          border: none;
          padding: 16px;
          border-radius: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: 0.3s;
          box-shadow: 0 10px 25px rgba(128,0,32,0.2);
        }
        .pfg-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(128,0,32,0.3); }
        .pfg-btn-text {
          background: none;
          border: none;
          color: #a8a29e;
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }
        .pfg-btn-text:hover { color: #800020; }

        /* ── Download Box ── */
        .pfg-download-box {
          text-align: center;
          padding-top: 40px;
        }
        .success-lottie { font-size: 48px; margin-bottom: 16px; }
        .pfg-download-box h3 { font-family: var(--font-heading); font-size: 32px; margin-bottom: 8px; }
        .pfg-download-box p { color: #666; margin-bottom: 40px; }
        .pfg-dl-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 300px;
          margin: 0 auto;
        }
        .pfg-btn-download {
          background: #166534;
          color: #fff;
          border: none;
          padding: 18px;
          border-radius: 18px;
          font-weight: 700;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: 0.3s;
          box-shadow: 0 10px 25px rgba(22,101,52,0.2);
        }
        .pfg-btn-download:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(22,101,52,0.3); }
        .pfg-btn-secondary {
          background: none;
          border: 1.5px solid #e7e5e4;
          color: #444;
          padding: 14px;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }
        .pfg-btn-secondary:hover { border-color: #800020; color: #800020; }

        /* ── Footer Info ── */
        .pfg-footer-info {
          margin-top: 80px;
          width: 100%;
          max-width: 800px;
        }
        .pfg-footer-title {
          font-family: var(--font-heading);
          font-size: 24px;
          text-align: center;
          margin-bottom: 32px;
        }
        .pfg-tips-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 600px) {
          .pfg-tips-grid { grid-template-columns: 1fr; }
        }
        .pfg-tip {
          background: #fff;
          padding: 24px;
          border-radius: 20px;
          border: 1px solid #e7e5e4;
          text-align: center;
        }
        .pfg-tip-icon { font-size: 32px; margin-bottom: 12px; }
        .pfg-tip h4 { margin-bottom: 8px; font-weight: 700; color: #1a1a1a; }
        .pfg-tip p { font-size: 13px; color: #666; line-height: 1.5; }

        .hidden-input { display: none; }
        
        .pfg-success-toast {
          position: fixed;
          bottom: 40px;
          background: #1a1a1a;
          color: #fff;
          padding: 12px 24px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          z-index: 100;
        }
      `}</style>
    </div>
  );
}
