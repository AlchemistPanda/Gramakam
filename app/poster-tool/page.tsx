'use client';

import { useState, useEffect, FormEvent } from 'react';
import {
  Search,
  Copy,
  Check,
  Download,
  Wand2,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import {
  buildPosterPrompt,
  buildCleanPlatePosterPrompt,
  ScrapedData,
} from '@/lib/posterPrompt';

const PASSCODE = 'poster@gramakam';
const SESSION_KEY = 'gramakam_poster_auth';

// ─── Passcode Gate ────────────────────────────────────────────────────────────

function PasscodeGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value === PASSCODE) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      onUnlock();
    } else {
      setError('Wrong passcode.');
      setValue('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wand2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Poster Tool</h1>
          <p className="text-gray-400 text-sm mt-1">Enter passcode to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Passcode"
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg py-3 transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg transition-colors"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ─── Image Card ───────────────────────────────────────────────────────────────

function ImageCard({
  src,
  alt,
  selected,
  onToggle,
}: {
  src: string;
  alt: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const proxyUrl = `/api/poster-tool/proxy?url=${encodeURIComponent(src)}`;
  const filename = src.split('/').pop()?.split('?')[0] || 'image.jpg';

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
        selected ? 'border-indigo-500 ring-2 ring-indigo-500/40' : 'border-gray-700 hover:border-gray-500'
      }`}
      onClick={onToggle}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-36 object-cover bg-gray-800"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23374151'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%236b7280' font-size='12'%3ENo preview%3C/text%3E%3C/svg%3E";
        }}
      />
      {/* Checkbox */}
      <div
        className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          selected ? 'bg-indigo-500 border-indigo-500' : 'bg-black/40 border-white/60'
        }`}
      >
        {selected && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      {/* Download */}
      <a
        href={proxyUrl}
        download={filename}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg transition-colors"
        title="Download image"
      >
        <Download className="w-3.5 h-3.5" />
      </a>
      {/* Alt text */}
      {alt && (
        <div className="absolute bottom-0 left-0 right-8 bg-black/60 text-white text-xs px-2 py-1 truncate">
          {alt}
        </div>
      )}
    </div>
  );
}

// ─── Prompt Box ───────────────────────────────────────────────────────────────

function PromptBox({
  label,
  prompt,
  accent,
}: {
  label: string;
  prompt: string;
  accent: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-gray-900 border ${accent} rounded-xl overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <span className="font-semibold text-white text-sm">{label}</span>
        <div className="flex items-center gap-2">
          <CopyButton text={prompt} />
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div
        className={`transition-all overflow-hidden ${expanded ? 'max-h-[600px]' : 'max-h-24'}`}
      >
        <pre className="text-gray-300 text-xs font-mono p-4 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[580px]">
          {prompt}
        </pre>
      </div>
      {!expanded && (
        <div className="text-center pb-2">
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Show full prompt
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Tool ────────────────────────────────────────────────────────────────

function PosterTool() {
  const [url, setUrl] = useState('');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scraped, setScraped] = useState<ScrapedData | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [prompts, setPrompts] = useState<{ main: string; clean: string } | null>(null);

  const handleScrape = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setScraped(null);
    setSelectedImages(new Set());
    setPrompts(null);

    try {
      const res = await fetch('/api/poster-tool/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Scrape failed');
      } else {
        setScraped({ ...data, url: url.trim() });
        // Auto-select OG image if present
        if (data.images?.[0]) {
          setSelectedImages(new Set([data.images[0].src]));
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleImage = (src: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(src)) next.delete(src);
      else next.add(src);
      return next;
    });
  };

  const handleGeneratePrompts = () => {
    if (!scraped) return;
    const selected = Array.from(selectedImages);
    setPrompts({
      main: buildPosterPrompt(scraped, selected, requirements),
      clean: buildCleanPlatePosterPrompt(scraped, selected, requirements),
    });
    // Scroll down to prompts
    setTimeout(() => {
      document.getElementById('prompts-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Poster Tool</h1>
          <p className="text-gray-400 text-xs">Scrape → select images → generate Gemini prompt</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Input Form */}
        <form onSubmit={handleScrape} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Page URL</label>
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://gramakam.in/..."
                required
                className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder-gray-600"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                {loading ? 'Scraping…' : 'Scrape'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your requirements{' '}
              <span className="text-gray-500 font-normal">(describe the poster you want)</span>
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={3}
              placeholder="e.g. Vertical A3 poster, dark dramatic background, bold gold typography, festival vibe, highlight the event date prominently…"
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder-gray-600 resize-none"
            />
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-700 text-red-300 rounded-xl px-4 py-3 flex items-start gap-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Results */}
        {scraped && (
          <>
            {/* Scraped text summary */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-gray-200 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                Scraped Content
              </h2>
              {scraped.title && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Title</span>
                  <p className="text-white font-medium">{scraped.title}</p>
                </div>
              )}
              {scraped.description && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Description</span>
                  <p className="text-gray-300 text-sm">{scraped.description}</p>
                </div>
              )}
              {scraped.headings.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    Headings ({scraped.headings.length})
                  </span>
                  <ul className="mt-1 space-y-0.5">
                    {scraped.headings.slice(0, 6).map((h, i) => (
                      <li key={i} className="text-gray-300 text-sm truncate">
                        • {h}
                      </li>
                    ))}
                    {scraped.headings.length > 6 && (
                      <li className="text-gray-500 text-xs">
                        +{scraped.headings.length - 6} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Image grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-200 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  Images found ({scraped.images.length})
                  {selectedImages.size > 0 && (
                    <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {selectedImages.size} selected
                    </span>
                  )}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedImages(new Set(scraped.images.map((i) => i.src)))}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Select all
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    onClick={() => setSelectedImages(new Set())}
                    className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {scraped.images.length === 0 ? (
                <p className="text-gray-500 text-sm bg-gray-900 border border-gray-700 rounded-xl p-4">
                  No images found on this page.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {scraped.images.map((img, i) => (
                    <ImageCard
                      key={i}
                      src={img.src}
                      alt={img.alt}
                      selected={selectedImages.has(img.src)}
                      onToggle={() => toggleImage(img.src)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Generate button */}
            <div className="flex justify-center">
              <button
                onClick={handleGeneratePrompts}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl flex items-center gap-2.5 text-lg transition-colors shadow-lg shadow-indigo-900/40"
              >
                <Wand2 className="w-5 h-5" />
                Generate Prompts
              </button>
            </div>
          </>
        )}

        {/* Prompts output */}
        {prompts && (
          <div id="prompts-section" className="space-y-4">
            <h2 className="font-semibold text-gray-200 text-lg">Generated Prompts</h2>

            <div className="bg-indigo-950/30 border border-indigo-700/40 rounded-xl p-4 text-sm text-indigo-300 space-y-1">
              <p className="font-medium">How to use these prompts:</p>
              <ol className="list-decimal list-inside space-y-1 text-indigo-300/80">
                <li>Copy the poster prompt below</li>
                <li>
                  Open{' '}
                  <a
                    href="https://gemini.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-indigo-200"
                  >
                    gemini.google.com
                  </a>{' '}
                  (Gemini 2.0 Flash or Ultra)
                </li>
                <li>
                  Paste the prompt → attach your selected images (download them using the{' '}
                  <Download className="w-3 h-3 inline" /> button above)
                </li>
                <li>For the clean plate, use the second prompt with the same images</li>
                <li>Save outputs and add Malayalam text in Photoshop</li>
              </ol>
            </div>

            <PromptBox
              label="Poster Prompt (with text)"
              prompt={prompts.main}
              accent="border-indigo-700/60"
            />
            <PromptBox
              label="Clean Plate Prompt (no text — for Photoshop)"
              prompt={prompts.clean}
              accent="border-purple-700/60"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PosterToolPage() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === 'true') {
      setUnlocked(true);
    }
  }, []);

  if (!unlocked) return <PasscodeGate onUnlock={() => setUnlocked(true)} />;
  return <PosterTool />;
}
