import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dates = (await redis.smembers('order-dates')) || [];
    const summaries = await Promise.all(
      dates.map(async (date) => {
        const hash = (await redis.hgetall(`orders:${date}`)) || {};
        const orders = Object.values(hash);
        const total = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        return { date, total, count: orders.length };
      })
    );
    return NextResponse.json({ summaries });
  } catch (e) {
    console.error('summary GET error', e);
    return NextResponse.json({ error: 'storage error' }, { status: 500 });
  }
}
