export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  images: { src: string; alt: string }[];
}

export function buildPosterPrompt(
  scraped: ScrapedData,
  selectedImages: string[],
  requirements: string
): string {
  const imageNote =
    selectedImages.length > 0
      ? `I am attaching ${selectedImages.length} image(s) from the page. Use them as the main visual element in the poster.`
      : `No images were selected — create a bold typographic poster.`;

  const textContent = [
    scraped.title && `Title: ${scraped.title}`,
    scraped.description && `Description: ${scraped.description}`,
    scraped.headings.length > 0 &&
      `Key headings:\n${scraped.headings
        .slice(0, 8)
        .map((h) => `- ${h}`)
        .join('\n')}`,
    scraped.paragraphs.length > 0 &&
      `Body text excerpts:\n${scraped.paragraphs.slice(0, 4).join('\n').substring(0, 800)}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  return `You are a professional graphic designer creating a festival/event poster.

${imageNote}

Content scraped from the website:
${textContent}

Designer requirements from user:
${requirements || '(none specified — use your best judgment)'}

Please create a high-quality poster that:
- Uses the provided images as the primary visual
- Incorporates the key text (title, event details, dates) with clear hierarchy
- Has a vibrant, modern festival aesthetic with bold typography
- All text must be in English only
- Output a single poster image suitable for both print and digital use`;
}

export function buildCleanPlatePosterPrompt(
  scraped: ScrapedData,
  selectedImages: string[],
  requirements: string
): string {
  const base = buildPosterPrompt(scraped, selectedImages, requirements);
  return (
    base +
    `

IMPORTANT — CLEAN PLATE VERSION: Create an identical version of this poster with ALL text completely removed. Keep the background, imagery, colors, gradients, and layout exactly the same — only remove every word and character. Leave clean empty space where text appeared, so custom text (e.g. Malayalam) can be added later in Photoshop.`
  );
}
