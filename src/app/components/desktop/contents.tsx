'use client';

import { useState } from 'react';
import { CATEGORY_LABEL, FILTERS, WORKS, type Category } from '../works/data';
import { VjPreview, WirefieldPreview } from '../lab/previews';
import styles from './styles.module.css';

/* ---------- trabajos.txt ---------- */

export function WorksContent({ clicked, onOpen }: { clicked: ReadonlySet<string>; onOpen: (url: string) => void }) {
  const [filter, setFilter] = useState<Category | 'todo'>('todo');
  const visible = filter === 'todo' ? WORKS : WORKS.filter((w) => w.category === filter);

  return (
    <>
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
      <ol className={styles.works}>
        {visible.map((w, i) => (
          <li key={w.url}>
            <a
              className={`${styles.work} ${clicked.has(w.url) ? styles.opened : ''}`}
              href={w.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpen(w.url)}
              // middle-click opens a tab too
              onAuxClick={(ev) => ev.button === 1 && onOpen(w.url)}
            >
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.workTitle}>
                {w.title}
                {w.latest && <span className={styles.badge}>nuevo</span>}
              </span>
              <span className={styles.cat}>{CATEGORY_LABEL[w.category]}</span>
            </a>
          </li>
        ))}
      </ol>
    </>
  );
}

/* ---------- lab/ ---------- */

const TOOLS = [
  { href: '/outer-vj', name: 'outer-vj', text: 'Generador ASCII / dither en tiempo real.', Preview: VjPreview },
  { href: '/wirefield', name: 'wirefield', text: 'Partículas 3D generativas en tiempo real.', Preview: WirefieldPreview },
];

export function LabContent() {
  return (
    <div className={styles.lab}>
      {TOOLS.map(({ href, name, text, Preview }) => (
        <a key={href} href={href} className={styles.tool}>
          <Preview />
          <span className={styles.toolName}>
            ▸ {name} <span className={styles.toolArrow}>↗</span>
          </span>
          <span className={styles.toolText}>{text}</span>
        </a>
      ))}
      <p className={styles.credit}>por Mati Mast</p>
    </div>
  );
}

/* ---------- about.md ---------- */

export function AboutContent() {
  return (
    <div className={styles.about}>
      <p className={styles.statement}>
        Somos un estudio y laboratorio creativo que explora y habita las fronteras entre la tek y el arte.
      </p>
      <ul className={styles.contact}>
        <li>
          <span className={styles.contactLabel}>mail</span>
          <a href="mailto:hola@outer313.com?subject=Hola Outers!">hola@outer313.com</a>
        </li>
        <li>
          <span className={styles.contactLabel}>instagram</span>
          <a href="https://www.instagram.com/outer_313/" target="_blank" rel="noopener noreferrer">
            @outer_313
          </a>
        </li>
      </ul>
    </div>
  );
}
