import { NextResponse } from 'next/server';
import { getLastMagicLinkUrlForTest } from '@/lib/email';

export const runtime = 'nodejs';

export const GET = async () => {
  if (process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  const url = getLastMagicLinkUrlForTest();
  return NextResponse.json({ url });
};
