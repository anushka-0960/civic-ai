// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { isSanitized, sanitizeOutput } from '@/utils/security';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const limitResult = rateLimit(ip, 15, 60000); // 15 requests per minute

  if (!limitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { message, sessionId, userId } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Missing message or sessionId fields.' },
        { status: 400 }
      );
    }

    // Input Security Check: Prompt Injection Filter
    if (!isSanitized(message)) {
      return NextResponse.json({
        response: 'Security Alert: Adversarial intent detected in request. Please ask standard civic or scheme questions.',
        toolCalls: []
      });
    }

    // Forward request to FastAPI backend
    const response = await fetch('http://127.0.0.1:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        sessionId,
        userId: userId || 'default_user'
      })
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      console.error('FastAPI chat endpoint error:', errorMsg);
      let detailedError = errorMsg;
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed.detail) {
          detailedError = parsed.detail;
        }
      } catch {
        // Not JSON
      }
      return NextResponse.json(
        { error: detailedError },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Output Security Check: HTML/XSS Sanitization
    if (data.response) {
      data.response = sanitizeOutput(data.response);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Next.js chat route handler:', error);
    return NextResponse.json(
      { error: 'CivicAI backend service is currently unreachable.' },
      { status: 503 }
    );
  }
}
