import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
