import type { Metadata, Viewport } from 'next';
import OuterVJ from './OuterVJ';

const DESCRIPTION = 'OUTER VJ — generador ASCII / dither en tiempo real, por Mati Mast.';

export const metadata: Metadata = {
  title: 'OUTER ASCII DITHER',
  description: DESCRIPTION,
  openGraph: { title: 'OUTER VJ', description: DESCRIPTION, url: '/outer-vj', siteName: 'OUTER' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function OuterVJPage() {
  return <OuterVJ />;
}
