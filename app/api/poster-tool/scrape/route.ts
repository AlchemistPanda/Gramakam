import { NextRequest, NextResponse } from 'next/server';

function extractTagContent(html: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const results: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length > 0) results.push(text);
  }
  return results;
}

function resolveUrl(src: string, baseUrl: string): string {
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return src;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Basic URL validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Only http/https URLs allowed' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Page returned ${res.status}` }, { status: 400 });
    }

    const html = await res.text();

    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch
      ? titleMatch[1].replace(/<[^>]+>/g, '').trim()
      : '';

    // Meta description
    const descMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) ||
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // OG image (usually the best hero image)
    const ogImageMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const ogImage = ogImageMatch ? resolveUrl(ogImageMatch[1], url) : null;

    // Headings
    const headings = [
      ...extractTagContent(html, 'h1'),
      ...extractTagContent(html, 'h2'),
      ...extractTagContent(html, 'h3'),
    ].filter((h, i, arr) => arr.indexOf(h) === i && h.length < 200);

    // Paragraphs — only meaningful ones
    const paragraphs = extractTagContent(html, 'p')
      .filter((p) => p.length > 40)
      .slice(0, 10);

    // Images — all <img> tags
    const imgRegex = /<img[^>]+>/gi;
    const seen = new Set<string>();
    const images: { src: string; alt: string }[] = [];

    if (ogImage && !seen.has(ogImage)) {
      seen.add(ogImage);
      images.push({ src: ogImage, alt: 'OG Image' });
    }

    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const tag = imgMatch[0];
      const srcMatch = tag.match(/src=["']([^"']+)["']/i);
      const altMatch = tag.match(/alt=["']([^"']*)["']/i);
      if (!srcMatch) continue;

      const rawSrc = srcMatch[1];
      if (rawSrc.startsWith('data:')) continue; // skip base64

      const src = resolveUrl(rawSrc, url);

      // Skip SVGs (don't rasterize well for posters)
      const lower = src.toLowerCase();
      if (lower.endsWith('.svg')) continue;

      // Skip 1x1 trackers (but be lenient — mostly rely on user to deselect)
      const wMatch = tag.match(/width=["'](\d+)["']/i);
      const hMatch = tag.match(/height=["'](\d+)["']/i);
      if (wMatch && parseInt(wMatch[1]) < 20) continue;
      if (hMatch && parseInt(hMatch[1]) < 20) continue;

      if (!seen.has(src)) {
        seen.add(src);
        images.push({ src, alt: altMatch ? altMatch[1] : '' });
      }
    }

    return NextResponse.json({ title, description, headings, paragraphs, images });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
