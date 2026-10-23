'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CATEGORY_LABEL, FILTERS, WORKS, youtubeId, type Category, type Work } from '../works/data';
import { AsciiFlowPreview, VjPreview, WirefieldPreview } from '../lab/previews';
import styles from './styles.module.css';

/* ---------- trabajos.txt ---------- */

type WorksProps = {
  clicked: ReadonlySet<string>;
  onOpen: (url: string) => void;
  /** open a YouTube work in the desktop player; `trigger` gets focus back when it closes */
  onPlay: (work: Work, trigger: HTMLElement) => void;
};

export function WorksContent({ clicked, onOpen, onPlay }: WorksProps) {
  const [filter, setFilter] = useState<Category | 'todo'>('todo');
  const visible = filter === 'todo' ? WORKS : WORKS.filter((w) => w.category === filter);

  // data-nosnippet: keep the project list out of Google's result snippet (the about sentence should be it)
  return (
    <div data-nosnippet="">
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
      {/* empty touchstart listener: iOS Safari only applies :active when one exists */}
      <ol className={styles.works} onTouchStart={() => {}}>
        {visible.map((w, i) => {
          const playable = youtubeId(w.url) !== null;
          return (
            <li key={w.url}>
              <a
                className={`${styles.work} ${clicked.has(w.url) ? styles.opened : ''}`}
                href={w.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(ev) => {
                  onOpen(w.url);
                  // plain click on a video plays it here; cmd/ctrl/shift-click still opens a tab
                  if (playable && !ev.metaKey && !ev.ctrlKey && !ev.shiftKey && !ev.altKey) {
                    ev.preventDefault();
                    onPlay(w, ev.currentTarget);
                  }
                }}
                // middle-click opens a tab too
                onAuxClick={(ev) => ev.button === 1 && onOpen(w.url)}
              >
                <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.workTitle}>
                  {w.title}
                  <span className={styles.srOnly}>
                    {playable ? ' (reproducir video)' : ' (abre en una pestaña nueva)'}
                  </span>
                </span>
                <span className={styles.cat}>
                  {CATEGORY_LABEL[w.category]}
                  <span className={styles.kind} aria-hidden="true">
                    {playable ? '▶' : '↗'}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------- lab/ ---------- */

const TOOLS = [
  { href: '/outer-vj', name: 'outer-vj', text: 'Generador ASCII / dither en tiempo real.', Preview: VjPreview },
  { href: '/wirefield', name: 'wirefield', text: 'Partículas 3D generativas en tiempo real.', Preview: WirefieldPreview },
  { href: '/ascii-flow', name: 'ascii-flow', text: 'Texturas ASCII procedurales en tiempo real.', Preview: AsciiFlowPreview },
];

export function LabContent() {
  return (
    <div className={styles.lab} onTouchStart={() => {}} data-nosnippet="">
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

/* ---------- outer.png ---------- */

export function LogoContent() {
  return (
    <div className={styles.logoFrame}>
      <Image src="/outer_logo_blanco.svg" alt="OUTER" width={1920} height={1080} priority />
    </div>
  );
}

/* ---------- video player ---------- */

/**
 * YouTube player, mounted only while its window is open (closing it unmounts the iframe,
 * which stops playback and frees the player). youtube-nocookie avoids tracking cookies.
 */
export function VideoContent({ work, id }: { work: Work; id: string }) {
  const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
  return (
    <div className={styles.player}>
      <div className={styles.videoFrame}>
        <iframe
          src={src}
          title={`${work.title} — video`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <a className={styles.watchOn} href={work.url} target="_blank" rel="noopener noreferrer">
        Ver en YouTube ↗
      </a>
    </div>
  );
}
