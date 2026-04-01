import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/config/site?key=${apiKey}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json({});

    const doc = await res.json();
    // Parse Firestore REST format: { fields: { key: { stringValue: '...' } } }
    const fields = doc.fields ?? {};
    const config: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      const val = v as Record<string, string>;
      config[k] = val.stringValue ?? val.integerValue ?? val.booleanValue ?? '';
    }
    return NextResponse.json(config);
  } catch (err) {
    console.error('Config fetch error:', err);
    return NextResponse.json({});
  }
}
