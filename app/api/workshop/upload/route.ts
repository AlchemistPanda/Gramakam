import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Increase Next.js body size limit for this route
export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 20 MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'gramakam-workshop-2026',
          resource_type: 'image',
          // width/height only downscale if bigger than 1920px; quality auto picks optimal
          transformation: [{ width: 1920, height: 1920, crop: 'limit', quality: 'auto' }],
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error('Cloudinary upload failed'));
          else resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      ).end(buffer);
    });

    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Cloudinary upload error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

