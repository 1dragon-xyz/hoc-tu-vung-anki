import './globals.css';

export const metadata = {
  title: 'Hearki - Audio Flashcards for the Visually Impaired',
  description: 'Hearki giúp người khiếm thị học từ vựng tiếng Anh thông qua giọng nói và tay cầm Xbox',
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
  themeColor: '#0f172a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hearki',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
