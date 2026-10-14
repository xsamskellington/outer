/** Projects shown on the home, newest first. To add one, add a line to WORKS. */

export type Category = 'cine' | 'series' | 'videoclips' | 'instalaciones';

export type Work = {
  title: string;
  category: Category;
  url: string;
};

export const CATEGORY_LABEL: Record<Category, string> = {
  cine: 'Cine',
  series: 'Serie',
  videoclips: 'Videoclip',
  instalaciones: 'Instalación',
};

export const FILTERS: { value: Category | 'todo'; label: string }[] = [
  { value: 'todo', label: 'Todo' },
  { value: 'cine', label: 'Cine' },
  { value: 'series', label: 'Series' },
  { value: 'videoclips', label: 'Videoclips' },
  { value: 'instalaciones', label: 'Instalaciones' },
];

// Newest first. To add a project, add a line here.
export const WORKS: Work[] = [
  { title: 'Ca7riel y Paco Amoroso — Papota', category: 'videoclips', url: 'https://www.youtube.com/watch?v=zYc1qMe_kpc' },
  { title: 'Elsa y Elmar — Drogada de Emociones', category: 'videoclips', url: 'https://www.youtube.com/watch?v=alJS56V2g64' },
  { title: 'Ouke', category: 'videoclips', url: 'https://www.youtube.com/watch?v=7LIERMc27-Q' },
  { title: 'Digan', category: 'videoclips', url: 'https://www.youtube.com/watch?v=V5y2u2B0sTA' },
  { title: 'Colocao', category: 'videoclips', url: 'https://www.youtube.com/watch?v=kh1sF-sbkbw' },
  { title: 'División Palermo', category: 'series', url: 'https://www.imdb.com/title/tt26451138/' },
  { title: 'Carmel', category: 'series', url: 'https://www.imdb.com/title/tt13244092/' },
  { title: 'Iosi', category: 'series', url: 'https://www.imdb.com/title/tt13587032/' },
  { title: 'Famoso', category: 'series', url: 'https://www.youtube.com/watch?v=Sipqpaqnl5k' },
  { title: 'Misántropo', category: 'cine', url: 'https://www.imdb.com/title/tt10275534/' },
  { title: 'Weak Rangers', category: 'cine', url: 'https://www.imdb.com/title/tt21995284/' },
  { title: 'Star Trek Into Darkness', category: 'cine', url: 'https://www.imdb.com/title/tt1408101/' },
  { title: 'Nite-Lite', category: 'instalaciones', url: 'https://www.instagram.com/niteliteclub/' },
  { title: 'Newtro Arts', category: 'instalaciones', url: 'https://www.newtro.xyz/' },
];

/** YouTube video id for watch / youtu.be links, or null (IMDb, Instagram and sites can't be embedded). */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1) || null;
    if (host === 'youtube.com' || host === 'm.youtube.com') return u.searchParams.get('v');
  } catch {}
  return null;
}

/** Short file-like name for the player window: the part after '—', e.g. 'papota.mp4'. */
export function videoFileName(title: string): string {
  const name = title.includes('—') ? title.split('—').pop()! : title;
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}.mp4`;
}
