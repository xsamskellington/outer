import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from './og';

export const alt = 'OUTER';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({ label: 'OUTER313.COM', title: 'Estudio y laboratorio creativo que explora y habita las fronteras entre la tek y el arte.' });
}
