// app/api/schemes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { searchSchemes } from '@/lib/schemes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const limitResult = rateLimit(ip, 60, 60000); // 60 requests per minute

  if (!limitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query') || '';
  const state = searchParams.get('state') || '';
  const category = searchParams.get('category') || '';

  try {
    const data = searchSchemes(query, state, category, false);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching schemes:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve schemes from local database.' },
      { status: 500 }
    );
  }
}
