import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '../og';

export const alt = 'OUTER VJ';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({ label: 'OUTER / LAB', title: 'OUTER VJ — generador ASCII / dither en tiempo real, por Mati Mast.' });
}
