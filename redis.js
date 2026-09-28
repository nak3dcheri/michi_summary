import { Redis } from '@upstash/redis';

// ตัวแปรสองตัวนี้ Vercel จะใส่ให้อัตโนมัติ หลังจากเชื่อม Upstash Redis
// ผ่านแท็บ Storage ในหน้าโปรเจกต์ (ดูขั้นตอนใน README.md)
export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
