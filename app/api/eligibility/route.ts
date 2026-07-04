// app/api/eligibility/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { checkEligibility } from '@/lib/schemes';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const limitResult = rateLimit(ip, 30, 60000); // 30 requests per minute

  if (!limitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const data = checkEligibility({
      scheme_id: body.scheme_id,
      age: Number(body.age),
      income: Number(body.income),
      state: body.state,
      gender: body.gender,
      category: body.category,
      occupation: body.occupation,
      is_landholder: Boolean(body.is_landholder),
      land_size_hectares: body.land_size_hectares !== undefined && body.land_size_hectares !== null ? Number(body.land_size_hectares) : null,
      is_income_tax_payer: Boolean(body.is_income_tax_payer)
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to verify eligibility profile locally.' },
      { status: 500 }
    );
  }
}
