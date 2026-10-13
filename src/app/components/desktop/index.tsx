'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { DEFAULT_SETTINGS, type Settings } from '../../outer-vj/config';
import { renderFrame } from '../../outer-vj/engine';
import { useCanvasLoop, type DrawFn } from '../hero/dither';
import Window, { type Point } from './Window';
import { AboutContent, LabContent, WorksContent } from './contents';
import styles from './styles.module.css';

type WinId = 'trabajos' | 'lab' | 'about';

const WINDOWS: { id: WinId; title: string; width: number }[] = [
  { id: 'trabajos', title: 'trabajos.txt', width: 500 },
  { id: 'lab', title: 'lab/', width: 440 },
  { id: 'about', title: 'about.md', width: 400 },
];

const MOBILE_QUERY = '(max-width: 700px)';

/** Calm full-screen wallpaper. */
const WALLPAPER: Settings = { ...DEFAULT_SETTINGS, density: 110, speed: 45, autoZoom: 8, moveX: 5, moveY: -2, rotation: 5 };

/** Opening layout, scaled to the screen: works on the left, lab and about stacked on the right. */
function initialPositions(w: number, h: number): Record<WinId, Point> {
  const top = 24;
  const right = Math.max(16, Math.min(w - 560, w * 0.5));
  return {
    trabajos: { x: Math.max(16, w * 0.05), y: top + h * 0.03 },
    lab: { x: right, y: top + h * 0.05 },
    about: { x: right + Math.min(60, w * 0.04), y: Math.min(h - 240, top + h * 0.05 + 330) },
  };
}


export default function Desktop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState<Record<WinId, boolean>>({ trabajos: true, lab: true, about: true });
  const [order, setOrder] = useState<WinId[]>(['about', 'lab', 'trabajos']); // last = front
  const [pos, setPos] = useState<Record<WinId, Point> | null>(null);
  const [clicked, setClicked] = useState<ReadonlySet<string>>(() => new Set());

  const draw = useCallback<DrawFn>((ctx, _w, _h, t) => renderFrame(ctx, WALLPAPER, t * 0.9, t, 313), []);
  useCanvasLoop(canvasRef, draw, 1);

  // Place windows on desktop; on mobile they stack in the page flow instead.
  useEffect(() => {
    const mql = matchMedia(MOBILE_QUERY);
    const place = () => setPos(mql.matches ? null : initialPositions(innerWidth, innerHeight));
    place();
    mql.addEventListener('change', place);
    return () => mql.removeEventListener('change', place);
  }, []);

  const focus = useCallback((id: WinId) => setOrder((o) => [...o.filter((x) => x !== id), id]), []);

  const show = useCallback(
    (id: WinId) => {
      setOpen((o) => ({ ...o, [id]: true }));
      focus(id);
      if (matchMedia(MOBILE_QUERY).matches) {
        requestAnimationFrame(() => document.getElementById(`win-${id}`)?.scrollIntoView({ behavior: 'smooth' }));
      }
    },
    [focus],
  );

  // #trabajos / #lab / #about (and old #contacto) open that window.
  useEffect(() => {
    const fromHash = () => {
      const h = location.hash.slice(1);
      const id = (h === 'contacto' ? 'about' : h) as WinId;
      if (WINDOWS.some((w) => w.id === id)) show(id);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [show]);

  const onOpenWork = useCallback((url: string) => setClicked((s) => new Set(s).add(url)), []);

  const content = (id: WinId) =>
    id === 'trabajos' ? <WorksContent clicked={clicked} onOpen={onOpenWork} /> : id === 'lab' ? <LabContent /> : <AboutContent />;

  const front = order[order.length - 1];

  return (
    <div className={styles.desktop}>
      <canvas ref={canvasRef} className={styles.wallpaper} aria-hidden="true" />
      <div className={styles.wallpaperLogo} aria-hidden="true">
        <Image src="/outer_logo_blanco.svg" alt="" width={1920} height={1080} priority />
      </div>


      <ul className={styles.icons}>
        {WINDOWS.map((w) => (
          <li key={w.id}>
            <button type="button" className={styles.icon} onClick={() => show(w.id)}>
              <span className={styles.iconGlyph} aria-hidden="true">
                {w.id === 'lab' ? '▤' : '≡'}
              </span>
              {w.title}
            </button>
          </li>
        ))}
        <li>
          <a className={styles.icon} href="/outer-vj">
            <span className={styles.iconGlyph} aria-hidden="true">
              ▓
            </span>
            outer-vj
          </a>
        </li>
        <li>
          <a className={styles.icon} href="/wirefield">
            <span className={styles.iconGlyph} aria-hidden="true">
              ◇
            </span>
            wirefield
          </a>
        </li>
      </ul>

      <div className={styles.windows}>
        {WINDOWS.filter((w) => open[w.id]).map((w) => (
          <div key={w.id} id={`win-${w.id}`} className={styles.slot}>
            <Window
              title={w.title}
              pos={pos?.[w.id] ?? null}
              width={w.width}
              z={10 + order.indexOf(w.id)}
              focused={front === w.id}
              onFocus={() => focus(w.id)}
              onMove={(p) => setPos((cur) => (cur ? { ...cur, [w.id]: p } : cur))}
              onClose={() => setOpen((o) => ({ ...o, [w.id]: false }))}
            >
              {content(w.id)}
            </Window>
          </div>
        ))}
      </div>
    </div>
  );
}
