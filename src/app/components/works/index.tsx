'use client';

import { useState } from 'react';
import styles from './styles.module.css';

type Category = 'cine' | 'series' | 'videoclips' | 'instalaciones';

type Work = {
  title: string;
  category: Category;
  url: string;
  latest?: boolean;
};

const CATEGORY_LABEL: Record<Category, string> = {
  cine: 'Cine',
  series: 'Serie',
  videoclips: 'Videoclip',
  instalaciones: 'Instalación',
};

const FILTERS: { value: Category | 'todo'; label: string }[] = [
  { value: 'todo', label: 'Todo' },
  { value: 'cine', label: 'Cine' },
  { value: 'series', label: 'Series' },
  { value: 'videoclips', label: 'Videoclips' },
  { value: 'instalaciones', label: 'Instalaciones' },
];

// Newest first. To add a project, add a line here.
const WORKS: Work[] = [
  { title: 'Ca7riel y Paco Amoroso — Papota', category: 'videoclips', latest: true, url: 'https://www.youtube.com/watch?v=zYc1qMe_kpc' },
  { title: 'Elsa y Elmar — Drogada de Emociones', category: 'videoclips', latest: true, url: 'https://www.youtube.com/watch?v=alJS56V2g64' },
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

const Works = () => {
  const [filter, setFilter] = useState<Category | 'todo'>('todo');
  const visible = filter === 'todo' ? WORKS : WORKS.filter((w) => w.category === filter);

  return (
    <section id="trabajos" className={styles.section}>
      <p className={styles.intro}>
        Hacemos efectos visuales para cine, series y videoclips, e instalaciones audiovisuales.
      </p>

      <div className={styles.filters} role="tablist" aria-label="Filtrar trabajos">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            className={filter === f.value ? styles.filterActive : styles.filter}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ol className={styles.list}>
        {visible.map((w, i) => (
          <li key={w.url}>
            <a className={styles.row} href={w.url} target="_blank" rel="noopener noreferrer">
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.cat}>{CATEGORY_LABEL[w.category]}</span>
              <span className={styles.title}>
                {w.title}
                {w.latest && <span className={styles.badge}>nuevo</span>}
              </span>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ol>

      <footer id="contacto" className={styles.contact}>
        <p>
          Escribinos por{' '}
          <a href="mailto:hola@outer313.com?subject=Hola Outers!">mail</a> o{' '}
          <a href="https://www.instagram.com/outer_313/" target="_blank" rel="noopener noreferrer">
            instagram
          </a>
          .
        </p>
      </footer>
    </section>
  );
};

export default Works;
