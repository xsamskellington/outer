import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';

// Self-hosted by Next (no request to Google at runtime). globals.css already uses Roboto 300.
const roboto = Roboto({ weight: '300', subsets: ['latin'], display: 'swap' });

const DESCRIPTION =
  'Estudio y laboratorio creativo que explora y habita las fronteras entre la tek y el arte.';

export const metadata: Metadata = {
  metadataBase: new URL('https://outer313.com'),
  title: 'OUTER',
  description: DESCRIPTION,
  openGraph: {
    title: 'OUTER',
    description: DESCRIPTION,
    url: '/',
    siteName: 'OUTER',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={roboto.className}>{children}</body>
    </html>
  );
}
