import type { Metadata, Viewport } from 'next';
import OuterVJ from './OuterVJ';

export const metadata: Metadata = {
  title: 'OUTER ASCII DITHER',
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
