// app/api/schemes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

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
    const backendUrl = `http://127.0.0.1:8000/api/schemes?query=${encodeURIComponent(query)}&state=${encodeURIComponent(state)}&category=${encodeURIComponent(category)}`;
    const response = await fetch(backendUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch schemes from backend service.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching schemes from backend:', error);
    return NextResponse.json(
      { error: 'CivicAI backend service is currently unreachable.' },
      { status: 503 }
    );
  }
}
