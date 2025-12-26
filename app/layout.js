import './globals.css';

export const metadata = {
  title: 'Học Từ Vựng - English for Blind',
  description: 'Ứng dụng học từ vựng tiếng Anh dành cho người khiếm thị sử dụng tay cầm Xbox',
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
  themeColor: '#0f172a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Học Từ Vựng',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
