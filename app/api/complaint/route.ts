// app/api/complaint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { generateComplaintLetter } from '@/lib/schemes';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const limitResult = rateLimit(ip, 20, 60000); // 20 requests per minute

  if (!limitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const letter = generateComplaintLetter({
      scheme_name: body.scheme_name,
      issue_type: body.issue_type,
      user_name: body.user_name,
      user_contact: body.user_contact,
      complaint_details: body.complaint_details,
      department_name: body.department_name,
      state: body.state,
      district: body.district
    });

    return NextResponse.json({ letter });
  } catch (error) {
    console.error('Error generating complaint:', error);
    return NextResponse.json(
      { error: 'Failed to generate complaint letter locally.' },
      { status: 500 }
    );
  }
}
