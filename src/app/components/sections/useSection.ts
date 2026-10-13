'use client';

import { useEffect, useState } from 'react';

export type SectionId = 'trabajos' | 'lab' | 'about';

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'trabajos', label: 'Trabajos' },
  { id: 'lab', label: 'Lab' },
  { id: 'about', label: 'About' },
];

/** Element the page scrolls to when a section is picked. */
export const CONTENT_ID = 'contenido';

const DEFAULT: SectionId = 'trabajos';

// Old links pointed at #contacto; that info now lives in About.
const fromHash = (hash: string): SectionId => {
  const id = hash.replace('#', '');
  if (id === 'contacto') return 'about';
  return SECTIONS.some((s) => s.id === id) ? (id as SectionId) : DEFAULT;
};

/** The section in the URL hash (#trabajos, #lab, #about). Back/forward work too. */
export function useSection() {
  const [section, setSection] = useState<SectionId>(DEFAULT);
  useEffect(() => {
    const read = () => setSection(fromHash(location.hash));
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  return section;
}

/** Show a section and scroll to it (also when it is already the active one). */
export function goToSection(id: SectionId) {
  if (location.hash !== `#${id}`) location.hash = id;
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(CONTENT_ID)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
}
