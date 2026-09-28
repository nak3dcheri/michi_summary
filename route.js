import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  if (!date) {
    return NextResponse.json({ error: 'missing date' }, { status: 400 });
  }
  try {
    const hash = (await redis.hgetall(`orders:${date}`)) || {};
    const orders = Object.values(hash);
    return NextResponse.json({ orders });
  } catch (e) {
    console.error('orders GET error', e);
    return NextResponse.json({ error: 'storage error' }, { status: 500 });
  }
}

// เพิ่มออเดอร์ใหม่ หรืออัปเดตออเดอร์เดิม (ใช้ id เดียวกัน) — แก้ทีละออเดอร์แบบ atomic
// ไม่กระทบออเดอร์อื่นที่เครื่องอื่นอาจกำลังแก้อยู่พร้อมกัน
export async function POST(request) {
  try {
    const { date, order } = await request.json();
    if (!date || !order || !order.id) {
      return NextResponse.json({ error: 'invalid request' }, { status: 400 });
    }
    await redis.hset(`orders:${date}`, { [order.id]: order });
    await redis.sadd('order-dates', date);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('orders POST error', e);
    return NextResponse.json({ error: 'storage error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { date, orderId } = await request.json();
    if (!date || !orderId) {
      return NextResponse.json({ error: 'invalid request' }, { status: 400 });
    }
    await redis.hdel(`orders:${date}`, String(orderId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('orders DELETE error', e);
    return NextResponse.json({ error: 'storage error' }, { status: 500 });
  }
}
