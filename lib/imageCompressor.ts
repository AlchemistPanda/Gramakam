// Client-side image compression using Canvas API
// Resizes and compresses images before uploading to Firebase Storage

interface CompressOptions {
  maxWidth?: number;       // Max width in pixels (default: 1200)
  maxHeight?: number;      // Max height in pixels (default: 1200)
  quality?: number;        // JPEG quality 0-1 (default: 0.7)
  maxSizeMB?: number;      // Target max file size in MB (default: 0.5)
}

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.7,
  maxSizeMB: 0.5,
};

/**
 * Compress an image file using the Canvas API.
 * Returns a new File with reduced dimensions and JPEG compression.
 * Shows original vs compressed size in console.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const opts = { ...DEFAULTS, ...options };
  const originalSizeMB = file.size / (1024 * 1024);

  // Skip if already small enough
  if (originalSizeMB <= opts.maxSizeMB) {
    console.log(`Image already small (${originalSizeMB.toFixed(2)} MB), skipping compression`);
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      if (width > opts.maxWidth) {
        height = Math.round(height * (opts.maxWidth / width));
        width = opts.maxWidth;
      }
      if (height > opts.maxHeight) {
        width = Math.round(width * (opts.maxHeight / height));
        height = opts.maxHeight;
      }

      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Try progressively lower quality if still too large
      let quality = opts.quality;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }

            const compressedSizeMB = blob.size / (1024 * 1024);

            // If still too large and quality > 0.3, try lower quality
            if (compressedSizeMB > opts.maxSizeMB && quality > 0.3) {
              quality -= 0.1;
              tryCompress();
              return;
            }

            // Create new File with original name
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.jpg'),
              { type: 'image/jpeg', lastModified: Date.now() }
            );

            console.log(
              `Compressed: ${originalSizeMB.toFixed(2)} MB → ${compressedSizeMB.toFixed(2)} MB ` +
              `(${Math.round((1 - compressedSizeMB / originalSizeMB) * 100)}% reduction, ` +
              `${width}×${height}, quality: ${quality.toFixed(1)})`
            );

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
