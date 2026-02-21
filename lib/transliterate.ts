/**
 * Manglish → Malayalam transliteration using Google Input Tools API.
 * Free, no API key needed. Returns the top suggestion or the input unchanged.
 */

const ENDPOINT = 'https://inputtools.google.com/request';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export async function transliterateToMalayalam(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  // Split into words and transliterate each
  const words = trimmed.split(/\s+/);
  const results: string[] = [];

  for (const word of words) {
    try {
      const params = new URLSearchParams({
        text: word,
        itc: 'ml-t-i0-und', // Malayalam transliteration
        num: '1',
        cp: '0',
        cs: '1',
        ie: 'utf-8',
        oe: 'utf-8',
      });

      const res = await fetch(`${ENDPOINT}?${params.toString()}`);
      if (!res.ok) {
        results.push(word);
        continue;
      }

      const data = await res.json();
      // Response: ["SUCCESS", [["input", ["suggestion1", ...]]]]
      if (data[0] === 'SUCCESS' && data[1]?.[0]?.[1]?.[0]) {
        results.push(data[1][0][1][0]);
      } else {
        results.push(word);
      }
    } catch {
      results.push(word);
    }
  }

  return results.join(' ');
}

/**
 * Debounced version — calls the callback after 500ms of no input.
 * Useful for live transliteration as user types.
 */
export function transliterateDebounced(
  text: string,
  callback: (result: string) => void,
  delay = 600
): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (!text.trim()) {
    callback('');
    return;
  }
  debounceTimer = setTimeout(async () => {
    const result = await transliterateToMalayalam(text);
    callback(result);
  }, delay);
}
