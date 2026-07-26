import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

// อย่า cache ผลลัพธ์ของ route นี้ เพราะข้อมูลออเดอร์เปลี่ยนตลอดเวลา
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'missing key' }, { status: 400 });
  }
  try {
    const value = await redis.get(key);
    return NextResponse.json({ value: value ?? null });
  } catch (e) {
    console.error('redis GET error', e);
    return NextResponse.json({ error: 'storage error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { key, value } = await request.json();
  if (!key) {
    return NextResponse.json({ error: 'missing key' }, { status: 400 });
  }
  try {
    await redis.set(key, value);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('redis SET error', e);
    return NextResponse.json({ error: 'storage error' }, { status: 500 });
  }
}
