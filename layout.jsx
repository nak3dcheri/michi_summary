import './globals.css';

export const metadata = {
  title: 'บันทึกออเดอร์ร้าน',
  description: 'ระบบบันทึกออเดอร์อาหารสำหรับหลังบ้าน',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
