'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { DEFAULT_SETTINGS, type Settings } from '../../outer-vj/config';
import { renderFrame } from '../../outer-vj/engine';
import { useCanvasLoop, type DrawFn } from '../canvas/dither';
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

const MARGIN = 16;

/**
 * Opening layout. Wide screens: works on the left, lab and about stacked on the right.
 * Narrower ones (where they can't sit side by side): a cascade that keeps every title bar visible.
 */
function initialPositions(w: number, h: number): Record<WinId, Point> {
  const top = 24;
  if (w >= 1100) {
    const right = Math.min(w - 560, w * 0.5);
    return clampPositions(
      {
        trabajos: { x: w * 0.05, y: top + h * 0.03 },
        lab: { x: right, y: top + h * 0.05 },
        about: { x: right + Math.min(60, w * 0.04), y: top + h * 0.05 + 330 },
      },
      w,
      h,
    );
  }
  return clampPositions(
    {
      about: { x: w, y: top },
      lab: { x: w, y: top + 44 },
      trabajos: { x: MARGIN, y: top + 88 },
    },
    w,
    h,
  );
}

/** Keep each window fully on screen horizontally and its title bar reachable vertically. */
function clampPositions(pos: Record<WinId, Point>, w: number, h: number): Record<WinId, Point> {
  const out = { ...pos };
  for (const win of WINDOWS) {
    const width = Math.min(win.width, w - 2 * MARGIN);
    const p = pos[win.id];
    out[win.id] = {
      x: Math.min(Math.max(p.x, MARGIN), Math.max(MARGIN, w - width - MARGIN)),
      y: Math.min(Math.max(p.y, MARGIN), Math.max(MARGIN, h - 120)),
    };
  }
  return out;
}


export default function Desktop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState<Record<WinId, boolean>>({ trabajos: true, lab: true, about: true });
  const [order, setOrder] = useState<WinId[]>(['about', 'lab', 'trabajos']); // last = front
  const [pos, setPos] = useState<Record<WinId, Point> | null>(null);
  const [clicked, setClicked] = useState<ReadonlySet<string>>(() => new Set());

  // Dimmed in the draw call itself (cheaper than a CSS filter on a full-screen canvas).
  const draw = useCallback<DrawFn>((ctx, w, h, t) => {
    // fitLongSide: on portrait phones spread the density along the height (~5k cells, not ~26k)
    renderFrame(ctx, WALLPAPER, t * 0.9, t, 313, true);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, w, h);
  }, []);
  useCanvasLoop(canvasRef, draw, 1, true);

  // Place windows on desktop (and keep them on screen when the browser is resized);
  // on mobile they live in the page flow instead.
  useEffect(() => {
    const mql = matchMedia(MOBILE_QUERY);
    const place = () => setPos(mql.matches ? null : initialPositions(innerWidth, innerHeight));
    const keepOnScreen = () => setPos((cur) => (cur ? clampPositions(cur, innerWidth, innerHeight) : cur));
    place();
    mql.addEventListener('change', place);
    window.addEventListener('resize', keepOnScreen);
    return () => {
      mql.removeEventListener('change', place);
      window.removeEventListener('resize', keepOnScreen);
    };
  }, []);

  const focus = useCallback((id: WinId) => setOrder((o) => [...o.filter((x) => x !== id), id]), []);

  const show = useCallback(
    (id: WinId) => {
      setOpen((o) => ({ ...o, [id]: true }));
      focus(id);
      if (matchMedia(MOBILE_QUERY).matches) {
        requestAnimationFrame(() =>
          document.getElementById('ventanas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        );
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
      <h1 className={styles.srOnly}>OUTER — estudio y laboratorio creativo</h1>
      <canvas ref={canvasRef} className={styles.wallpaper} aria-hidden="true" />
      <div className={styles.wallpaperLogo} aria-hidden="true">
        <Image src="/outer_logo_blanco.svg" alt="" width={1920} height={1080} priority />
      </div>


      <ul className={styles.icons} data-nosnippet="">
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

      {/* mobile: CSS shows only the front window (data-front), picked from the dock */}
      <div id="ventanas" className={styles.windows}>
        {WINDOWS.filter((w) => open[w.id]).map((w) => (
          <div key={w.id} id={`win-${w.id}`} className={styles.slot} data-front={front === w.id}>
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

      <nav className={styles.dock} aria-label="Ventanas" data-nosnippet="">
        {WINDOWS.map((w) => (
          <button
            key={w.id}
            type="button"
            className={`${styles.dockItem} ${front === w.id ? styles.dockActive : ''}`}
            aria-current={front === w.id ? 'true' : undefined}
            onClick={() => show(w.id)}
          >
            <span className={styles.dockGlyph} aria-hidden="true">
              {w.id === 'lab' ? '▤' : '≡'}
            </span>
            {w.title}
          </button>
        ))}
      </nav>
    </div>
  );
}
