import './globals.css';
import type { Metadata, Viewport } from 'next';
import ServiceWorker from './ServiceWorker';

export const metadata: Metadata = {
  title: 'Event Tracker',
  description: 'Theo dõi sự kiện và nhận nhắc lịch.',
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Events' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#e66f51',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi" suppressHydrationWarning><body><ServiceWorker />{children}</body></html>;
}
