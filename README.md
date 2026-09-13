# บันทึกออเดอร์ร้าน — วิธีขึ้น Vercel (มือใหม่ทำตามได้เลย)

ทำผ่านเบราว์เซอร์ล้วนๆ ไม่ต้องลงโปรแกรมอะไรเพิ่ม ใช้เวลารวมประมาณ 15-20 นาที

## ขั้นที่ 0 — แตกไฟล์ zip

แตกไฟล์ `order-tracker-app.zip` จะได้โฟลเดอร์ `order-tracker-app`

## ขั้นที่ 1 — สมัคร/ล็อกอิน GitHub

ไปที่ **github.com** สมัครหรือล็อกอิน

## ขั้นที่ 2 — สร้าง repository ใหม่

กด **+** → **New repository** ตั้งชื่อ เลือก **Private** ไม่ต้องติ๊กอะไรเพิ่ม กด **Create repository**

## ขั้นที่ 3 — อัปโหลดไฟล์ทั้งหมด

กด **uploading an existing file** (หรือ Add file → Upload files) เปิดโฟลเดอร์ที่แตกไว้ เลือกทุกอย่างข้างใน (Ctrl+A) ลากไปวาง แล้วกด **Commit changes**

## ขั้นที่ 4 — Import เข้า Vercel

vercel.com → ล็อกอินด้วย GitHub → **Add New...** → **Project** → เลือก repo → **Deploy**

## ขั้นที่ 5 — เพิ่มฐานข้อมูล

แท็บ **Storage** → **Create Database** → เลือก **Upstash** (Redis/KV) แพ็กเกจฟรี → Connect กับโปรเจกต์นี้

## ขั้นที่ 6 — Deploy ซ้ำ

แท็บ **Deployments** → **⋯** ที่ตัวล่าสุด → **Redeploy**

## ขั้นที่ 7 — ทดสอบ

เปิดเว็บ ลองบันทึกออเดอร์ รีเฟรชดูว่าข้อมูลยังอยู่ไหม
