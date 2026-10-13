import type { Metadata, Viewport } from 'next';
import Wirefield from './Wirefield';

export const metadata: Metadata = {
  title: 'WIREFIELD v2.8 — Particle Lab',
  description: 'Realtime generative particle system by Mati Mast · OUTER',
  openGraph: {
    title: 'WIREFIELD — Particle Lab',
    description: 'Sistema de partículas 3D generativo en tiempo real, por Mati Mast.',
    url: '/wirefield',
    siteName: 'OUTER',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#080a0d',
};

export default function WirefieldPage() {
  return <Wirefield />;
}
