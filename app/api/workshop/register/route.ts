import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Basic required field validation
    const required = [
      'child_name', 'age', 'gender', 'school_name', 'class_grade',
      'parent_name', 'mobile_number', 'consent_participate',
    ];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    if (!body.consent_participate) {
      return NextResponse.json({ error: 'Parental consent is required to register.' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('workshop_registrations')
      .insert([{
        child_name:           body.child_name,
        age:                  Number(body.age),
        gender:               body.gender,
        school_name:          body.school_name,
        class_grade:          body.class_grade,
        interests:            body.interests ?? '',
        previous_experience:  Boolean(body.previous_experience),
        parent_name:          body.parent_name,
        mobile_number:        body.mobile_number,
        whatsapp_number:      body.whatsapp_number ?? '',
        email:                body.email ?? '',
        address:              body.address ?? '',
        consent_participate:  Boolean(body.consent_participate),
        consent_media:        Boolean(body.consent_media),
        photo_url:            body.photo_url ?? null,
        photo_public_id:      body.photo_public_id ?? null,
      }])
      .select('id, reg_number')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save registration. Please try again.' }, { status: 500 });
    }

    const regCode = `GRK-${String(data.reg_number).padStart(4, '0')}`;
    return NextResponse.json({ success: true, id: data.id, regCode });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
