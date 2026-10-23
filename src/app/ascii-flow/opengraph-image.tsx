import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '../og';

export const alt = 'ASCII Flow';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({ label: 'OUTER / LAB', title: 'ASCII Flow — texturas ASCII procedurales en tiempo real, por Mati Mast.' });
}
