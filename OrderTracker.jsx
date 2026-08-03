'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Edit2, Check, ClipboardList, Store, TrendingUp } from 'lucide-react';

const defaultMenu = [
  { id: 1, name: 'ข้าวผัดกะเพราหมู', price: 45 },
  { id: 2, name: 'ข้าวผัดกะเพราไก่', price: 45 },
  { id: 3, name: 'ข้าวผัดกะเพราทะเล', price: 60 },
  { id: 4, name: 'ข้าวไข่เจียว', price: 40 },
  { id: 5, name: 'ต้มยำกุ้ง', price: 80 },
  { id: 6, name: 'ผัดไทย', price: 50 },
  { id: 7, name: 'ข้าวมันไก่', price: 45 },
  { id: 8, name: 'ส้มตำ', price: 40 },
  { id: 9, name: 'ชาไทย', price: 25 },
  { id: 10, name: 'น้ำเปล่า', price: 10 },
];

const statusFlow = ['pending', 'preparing', 'ready', 'paid'];
const statusMeta = {
  pending:   { label: 'รอทำ',      badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  preparing: { label: 'กำลังทำ',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  ready:     { label: 'เสร็จแล้ว',  badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paid:      { label: 'จ่ายแล้ว',  badge: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
};
const typeLabel = { 'dine-in': 'ทานที่ร้าน', takeaway: 'กลับบ้าน', delivery: 'เดลิเวอรี่' };

const todayKey = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const safeGet = async (key) => {
  try {
    const res = await fetch(`/api/store?key=${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.value ?? null;
  } catch {
    return null;
  }
};
const safeSet = async (key, value) => {
  try {
    await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
  } catch (e) {
    console.error('บันทึกข้อมูลไม่สำเร็จ', e);
  }
};

export default function OrderTracker() {
  const [menu, setMenu] = useState(defaultMenu);
  const [orders, setOrders] = useState([]);
  const [dailySummaries, setDailySummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('new');
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState({});
  const [note, setNote] = useState('');
  const [orderType, setOrderType] = useState('dine-in');
  const [ticketNo, setTicketNo] = useState(1);

  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // โหลดออเดอร์วันนี้ + สรุปยอด + เมนู ล่าสุดจากเซิร์ฟเวอร์ (ไม่แตะสถานะฟอร์มที่กำลังกรอกอยู่)
  const refreshData = async () => {
    const today = todayKey();
    const [todayOrders, summaries, menuItems] = await Promise.all([
      safeGet(`orders:${today}`),
      safeGet('daily-summaries'),
      safeGet('menu-items'),
    ]);
    if (todayOrders) setOrders(todayOrders);
    if (summaries) setDailySummaries(summaries);
    if (menuItems) setMenu(menuItems);
    return todayOrders;
  };

  useEffect(() => {
    (async () => {
      const todayOrders = await refreshData();
      if (todayOrders) {
        const maxTicket = todayOrders.reduce((max, o) => Math.max(max, o.ticketNo || 0), 0);
        setTicketNo(maxTicket + 1);
      }
      setLoading(false);
    })();
  }, []);

  // เช็คข้อมูลใหม่จากเซิร์ฟเวอร์ทุก 15 วินาที เผื่อหน้าจอเปิดค้างไว้นานๆ
  // (เช่น เปิดทิ้งไว้ที่หน้าเคาน์เตอร์) จะได้เห็นออเดอร์/สถานะล่าสุดโดยไม่ต้องกด refresh เอง
  useEffect(() => {
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (id) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeFromCart = (id) => setCart(prev => {
    const next = { ...prev };
    if (next[id] <= 1) delete next[id]; else next[id] -= 1;
    return next;
  });

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const item = menu.find(m => m.id === Number(id));
      return item ? { ...item, qty } : null;
    })
    .filter(Boolean);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const saveOrder = async () => {
    if (cartItems.length === 0) return;
    const today = todayKey();
    const newOrder = {
      id: Date.now(),
      ticketNo,
      customerName: customerName.trim() || `โต๊ะ/ลูกค้า ${ticketNo}`,
      items: cartItems,
      note: note.trim(),
      orderType,
      status: 'pending',
      total: cartTotal,
      createdAt: new Date().toISOString(),
    };
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    setTicketNo(n => n + 1);
    setCustomerName(''); setCart({}); setNote(''); setOrderType('dine-in');
    setTab('list');

    const idx = dailySummaries.findIndex(d => d.date === today);
    const updatedSummaries = idx >= 0
      ? dailySummaries.map((d, i) => i === idx ? { ...d, total: d.total + cartTotal, count: d.count + 1 } : d)
      : [{ date: today, total: cartTotal, count: 1 }, ...dailySummaries];
    setDailySummaries(updatedSummaries);

    await Promise.all([
      safeSet(`orders:${today}`, updatedOrders),
      safeSet('daily-summaries', updatedSummaries),
    ]);
  };

  const advanceStatus = async (id) => {
    const updatedOrders = orders.map(o => {
      if (o.id !== id) return o;
      const i = statusFlow.indexOf(o.status);
      return { ...o, status: statusFlow[Math.min(i + 1, statusFlow.length - 1)] };
    });
    setOrders(updatedOrders);
    await safeSet(`orders:${todayKey()}`, updatedOrders);
  };

  const deleteOrder = async (id) => {
    const target = orders.find(o => o.id === id);
    if (!target) return;
    const today = todayKey();
    const updatedOrders = orders.filter(o => o.id !== id);
    setOrders(updatedOrders);

    const updatedSummaries = dailySummaries.map(d =>
      d.date === today ? { ...d, total: d.total - target.total, count: Math.max(0, d.count - 1) } : d
    );
    setDailySummaries(updatedSummaries);

    await Promise.all([
      safeSet(`orders:${today}`, updatedOrders),
      safeSet('daily-summaries', updatedSummaries),
    ]);
  };

  const addMenuItem = async () => {
    if (!newItemName.trim() || !newItemPrice) return;
    const updated = [...menu, { id: Date.now(), name: newItemName.trim(), price: Number(newItemPrice) }];
    setMenu(updated);
    setNewItemName(''); setNewItemPrice('');
    await safeSet('menu-items', updated);
  };
  const startEdit = (item) => { setEditingId(item.id); setEditName(item.name); setEditPrice(String(item.price)); };
  const saveEdit = async (id) => {
    const updated = menu.map(m => m.id === id ? { ...m, name: editName.trim(), price: Number(editPrice) || 0 } : m);
    setMenu(updated);
    setEditingId(null);
    await safeSet('menu-items', updated);
  };
  const deleteMenuItem = async (id) => {
    const updated = menu.filter(m => m.id !== id);
    setMenu(updated);
    await safeSet('menu-items', updated);
  };

  const todayTotal = orders.reduce((s, o) => s + o.total, 0);
  const openCount = orders.filter(o => o.status !== 'paid').length;
  const fmtTime = (d) => new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  const grandTotal = dailySummaries.reduce((s, d) => s + d.total, 0);
  const grandCount = dailySummaries.reduce((s, d) => s + d.count, 0);

  const tabs = [
    { key: 'new', label: 'บันทึกออเดอร์' },
    { key: 'list', label: 'ตั๋วออเดอร์' },
    { key: 'summary', label: 'สรุปยอด' },
    { key: 'menu', label: 'จัดการเมนู' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 font-sans">
      <div className="border-b border-neutral-800 px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-pink-400 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-neutral-950" strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="font-semibold text-base text-neutral-100 leading-tight">บันทึกออเดอร์ร้าน</h1>
              <p className="text-xs text-neutral-500">{new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">ยอดวันนี้</p>
            <p className="font-mono font-semibold text-lg text-pink-400 tabular-nums">฿{todayTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                tab === t.key ? 'bg-pink-400 text-neutral-950' : 'text-neutral-400'
              }`}
            >
              {t.label}
              {t.key === 'list' && openCount > 0 && (
                <span className={`ml-1 inline-flex items-center justify-center w-4 h-4 text-xs rounded-full ${tab === 'list' ? 'bg-neutral-950 text-pink-400' : 'bg-rose-500 text-white'}`}>
                  {openCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={`max-w-3xl mx-auto px-4 sm:px-6 py-5 ${tab === 'new' && cartItems.length > 0 ? 'pb-40' : 'pb-8'}`}>
        {loading ? (
          <p className="text-sm text-neutral-500 text-center py-16">กำลังโหลดข้อมูล...</p>
        ) : (
        <>
        {tab === 'new' && (
          <div className="space-y-5">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
              <input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="ชื่อลูกค้า / โต๊ะ (ไม่บังคับ)"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <div className="flex gap-2">
                {Object.entries(typeLabel).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setOrderType(key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      orderType === key ? 'bg-pink-400 border-pink-400 text-neutral-950' : 'border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium text-neutral-500 mb-2 px-1">เลือกรายการ</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {menu.map(item => {
                  const qty = cart[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-3 ${
                        qty > 0 ? 'bg-pink-50 border-pink-300' : 'bg-neutral-900 border-neutral-800'
                      }`}
                    >
                      <p className={`text-sm font-medium leading-tight mb-0.5 ${qty > 0 ? 'text-neutral-900' : 'text-neutral-100'}`}>{item.name}</p>
                      <p className={`text-xs font-mono mb-2 ${qty > 0 ? 'text-neutral-600' : 'text-neutral-500'}`}>฿{item.price}</p>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          disabled={qty === 0}
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-30 ${qty > 0 ? 'border-pink-300 text-neutral-700' : 'border-neutral-700 text-neutral-500'}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className={`text-sm font-mono font-semibold w-5 text-center ${qty > 0 ? 'text-neutral-900' : 'text-neutral-400'}`}>{qty}</span>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="w-7 h-7 rounded-lg bg-pink-400 text-neutral-950 flex items-center justify-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium text-neutral-500 mb-2 px-1">หมายเหตุ</h2>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="เช่น ไม่ใส่ผัก, เผ็ดน้อย..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
              />
            </div>
          </div>
        )}

        {tab === 'list' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList className="w-9 h-9 mx-auto mb-3 text-neutral-700" />
                <p className="text-sm text-neutral-500">ยังไม่มีตั๋วออเดอร์วันนี้ เริ่มบันทึกออเดอร์แรกได้เลย</p>
              </div>
            ) : (
              orders.map(order => {
                const meta = statusMeta[order.status];
                return (
                  <div key={order.id} className="bg-neutral-50 border-t-2 border-dashed border-neutral-300 rounded-2xl overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-neutral-400">#{String(order.ticketNo).padStart(3, '0')}</span>
                            <p className="font-medium text-sm text-neutral-900">{order.customerName}</p>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">{fmtTime(order.createdAt)} · {typeLabel[order.orderType]}</p>
                        </div>
                        <button onClick={() => deleteOrder(order.id)} className="text-neutral-300 hover:text-rose-500 p-1 -mt-1 -mr-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-0.5 mb-3 font-mono text-xs text-neutral-600">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.name} ×{item.qty}</span>
                            <span>฿{item.price * item.qty}</span>
                          </div>
                        ))}
                      </div>

                      {order.note && (
                        <p className="text-xs text-neutral-600 bg-neutral-100 rounded-lg px-2.5 py-1.5 mb-3">{order.note}</p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-dashed border-neutral-300">
                        <span className="font-mono font-semibold text-sm text-neutral-900">฿{order.total.toLocaleString()}</span>
                        <button
                          onClick={() => advanceStatus(order.id)}
                          disabled={order.status === 'paid'}
                          className={`text-xs font-medium px-3 py-1.5 rounded-full border -rotate-2 disabled:cursor-default ${meta.badge}`}
                        >
                          {meta.label}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'summary' && (
          <div className="space-y-3">
            {dailySummaries.length === 0 ? (
              <div className="text-center py-16">
                <TrendingUp className="w-9 h-9 mx-auto mb-3 text-neutral-700" />
                <p className="text-sm text-neutral-500">ยังไม่มีข้อมูลสรุปยอด บันทึกออเดอร์วันนี้ก่อนได้เลย</p>
              </div>
            ) : (
              <>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                  <p className="text-xs text-neutral-500 mb-0.5">รวมทั้งหมด {dailySummaries.length} วัน · {grandCount} ออเดอร์</p>
                  <p className="font-mono font-semibold text-xl text-pink-400 tabular-nums">฿{grandTotal.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  {dailySummaries.slice().sort((a, b) => b.date.localeCompare(a.date)).map(d => (
                    <div key={d.date} className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-100">{fmtDate(d.date)}{d.date === todayKey() ? ' · วันนี้' : ''}</p>
                        <p className="text-xs text-neutral-500">{d.count} ออเดอร์</p>
                      </div>
                      <p className="font-mono font-semibold text-sm text-neutral-100 tabular-nums">฿{d.total.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'menu' && (
          <div className="space-y-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2">
              <h2 className="text-sm font-medium text-neutral-500">เพิ่มเมนูใหม่</h2>
              <div className="flex gap-2">
                <input
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="ชื่อเมนู"
                  className="flex-1 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                <input
                  value={newItemPrice}
                  onChange={e => setNewItemPrice(e.target.value)}
                  placeholder="ราคา"
                  type="number"
                  className="w-20 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                <button onClick={addMenuItem} className="px-4 py-2 rounded-lg bg-pink-400 text-neutral-950 text-sm font-medium">
                  เพิ่ม
                </button>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl divide-y divide-neutral-800">
              {menu.map(item => (
                <div key={item.id} className="p-3.5 flex items-center justify-between gap-2">
                  {editingId === item.id ? (
                    <>
                      <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
                      <input value={editPrice} onChange={e => setEditPrice(e.target.value)} type="number" className="w-16 px-2 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
                      <button onClick={() => saveEdit(item.id)} className="text-emerald-400 p-1.5">
                        <Check className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium text-neutral-100">{item.name}</p>
                        <p className="text-xs font-mono text-neutral-500">฿{item.price}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(item)} className="text-neutral-500 hover:text-neutral-300 p-1.5">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteMenuItem(item.id)} className="text-neutral-500 hover:text-rose-400 p-1.5">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        </>
        )}
      </div>

      {tab === 'new' && cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-neutral-50 border-t-2 border-dashed border-neutral-300">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3.5">
            <div className="max-h-20 overflow-y-auto mb-2.5 font-mono text-xs text-neutral-600 space-y-0.5">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.name} ×{item.qty}</span>
                  <span>฿{item.price * item.qty}</span>
                </div>
              ))}
            </div>
            <button
              onClick={saveOrder}
              className="w-full py-3 rounded-xl bg-pink-400 text-neutral-950 font-medium text-sm flex items-center justify-center gap-2"
            >
              <span>บันทึกออเดอร์</span>
              <span className="font-mono font-semibold">฿{cartTotal.toLocaleString()}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
