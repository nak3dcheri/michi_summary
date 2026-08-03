import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const menu = (await redis.get('menu-items')) ?? null;
    return NextResponse.json({ menu });
  } catch (e) {
    console.error('menu GET error', e);
    return NextResponse.json({ error: 'storage error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { menu } = await request.json();
    if (!Array.isArray(menu)) {
      return NextResponse.json({ error: 'invalid menu' }, { status: 400 });
    }
    await redis.set('menu-items', menu);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('menu POST error', e);
    return NextResponse.json({ error: 'storage error' }, { status: 500 });
  }
}
