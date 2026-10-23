import type { Metadata, Viewport } from 'next';
import AsciiFlow from './AsciiFlow';

const DESCRIPTION = 'ASCII Flow — texturas ASCII procedurales en tiempo real, por Mati Mast.';

export const metadata: Metadata = {
  title: 'OUTER / ASCII FLOW',
  description: DESCRIPTION,
  openGraph: { title: 'ASCII FLOW', description: DESCRIPTION, url: '/ascii-flow', siteName: 'OUTER' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function AsciiFlowPage() {
  return <AsciiFlow />;
}
