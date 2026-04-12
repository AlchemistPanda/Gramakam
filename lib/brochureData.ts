// Brochure metadata and configuration
// Updated: 2026-04-11 - Extracted from PDF, 28 pages total

export const BROCHURE_PAGES = 10;

export const BROCHURE_PAGE_RANGE = Array.from(
  { length: BROCHURE_PAGES },
  (_, i) => `page-${String(i + 1).padStart(3, '0')}.png`
);

export const BROCHURE_IMAGE_DIR = '/images/brochure';

// Get image path for a specific page (1-indexed)
export function getBrochurePageImage(pageNumber: number): string {
  if (pageNumber < 1 || pageNumber > BROCHURE_PAGES) {
    console.warn(`Invalid page number: ${pageNumber}`);
    return `${BROCHURE_IMAGE_DIR}/page-001.png`;
  }
  return `${BROCHURE_IMAGE_DIR}/page-${String(pageNumber).padStart(3, '0')}.png`;
}
