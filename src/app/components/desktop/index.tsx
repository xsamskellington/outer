'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { DEFAULT_SETTINGS, type Settings } from '../../outer-vj/config';
import { renderFrame } from '../../outer-vj/engine';
import { useCanvasLoop, type DrawFn } from '../canvas/dither';
import Window, { type Point } from './Window';
import { AboutContent, LabContent, LogoContent, VideoContent, WorksContent } from './contents';
import { videoFileName, youtubeId, type Work } from '../works/data';
import styles from './styles.module.css';

type WinId = 'trabajos' | 'lab' | 'about' | 'logo';

const WINDOWS: { id: WinId; title: string; width: number; desktopOnly?: boolean }[] = [
  { id: 'trabajos', title: 'trabajos.txt', width: 500 },
  { id: 'lab', title: 'lab/', width: 440 },
  { id: 'about', title: 'about.md', width: 400 },
  // desktop only: on phones the logo stays on the wallpaper
  { id: 'logo', title: 'outer.png', width: 305, desktopOnly: true },
];

/** The player is a temporary layer on top of the fixed windows. */
type LayerId = WinId | 'video';
type VideoBox = { pos: Point; width: number };

type Sizes = Record<WinId, number>;
const INITIAL_SIZES = Object.fromEntries(WINDOWS.map((w) => [w.id, w.width])) as Sizes;

/** Windows reachable from the mobile dock. */
const MOBILE_WINDOWS = WINDOWS.filter((w) => !w.desktopOnly);

const MOBILE_QUERY = '(max-width: 700px)';

/** Calm full-screen wallpaper. */
const WALLPAPER: Settings = { ...DEFAULT_SETTINGS, density: 110, speed: 45, autoZoom: 8, moveX: 5, moveY: -2, rotation: 5 };

const MARGIN = 16;

/** Player window: as big as fits while keeping the video 16:9 (window chrome ≈ 88px tall, 30px wide). */
function videoLayout(w: number, h: number): VideoBox {
  const maxVideoHeight = h - 2 * 24 - 88;
  const width = Math.round(Math.min(w - 64, (maxVideoHeight * 16) / 9 + 30, 1600));
  return { pos: { x: Math.round((w - width) / 2), y: 24 }, width };
}

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
        // where the wallpaper logo used to be: centred, low
        logo: { x: (w - INITIAL_SIZES.logo) / 2, y: h - 200 },
      },
      INITIAL_SIZES,
      w,
      h,
    );
  }
  return clampPositions(
    {
      logo: { x: w, y: h - 200 },
      about: { x: w, y: top },
      lab: { x: w, y: top + 44 },
      trabajos: { x: MARGIN, y: top + 88 },
    },
    INITIAL_SIZES,
    w,
    h,
  );
}

/** Keep each window fully on screen horizontally and its title bar reachable vertically. */
function clampPositions(pos: Record<WinId, Point>, sizes: Sizes, w: number, h: number): Record<WinId, Point> {
  const out = { ...pos };
  for (const win of WINDOWS) {
    const width = Math.min(sizes[win.id], w - 2 * MARGIN);
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
  const [open, setOpen] = useState<Record<WinId, boolean>>({ trabajos: true, lab: true, about: true, logo: true });
  const [order, setOrder] = useState<LayerId[]>(['logo', 'about', 'lab', 'trabajos']); // last = front
  const [pos, setPos] = useState<Record<WinId, Point> | null>(null);
  const [sizes, setSizes] = useState<Sizes>(INITIAL_SIZES);
  const sizesRef = useRef(sizes);
  sizesRef.current = sizes;
  const [video, setVideo] = useState<{ work: Work; id: string } | null>(null);
  const [videoBox, setVideoBox] = useState<VideoBox | null>(null);
  /** the work link that opened the player; focus returns there on close */
  const videoTrigger = useRef<HTMLElement | null>(null);
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
    const keepOnScreen = () => {
      setPos((cur) => (cur ? clampPositions(cur, sizesRef.current, innerWidth, innerHeight) : cur));
      setVideoBox((b) => {
        if (!b) return b;
        const width = Math.min(b.width, innerWidth - 2 * MARGIN);
        const x = Math.min(Math.max(b.pos.x, MARGIN), innerWidth - width - MARGIN);
        return { width, pos: { x, y: Math.min(Math.max(b.pos.y, MARGIN), innerHeight - 120) } };
      });
    };
    place();
    mql.addEventListener('change', place);
    window.addEventListener('resize', keepOnScreen);
    return () => {
      mql.removeEventListener('change', place);
      window.removeEventListener('resize', keepOnScreen);
    };
  }, []);

  const focus = useCallback((id: LayerId) => setOrder((o) => [...o.filter((x) => x !== id), id]), []);

  const onOpenWork = useCallback((url: string) => setClicked((s) => new Set(s).add(url)), []);

  const openVideo = useCallback(
    (work: Work, trigger: HTMLElement) => {
      const id = youtubeId(work.url);
      if (!id) return;
      videoTrigger.current = trigger;
      setVideo({ work, id });
      const mobile = matchMedia(MOBILE_QUERY).matches;
      // keep size/position if it is already open and the user arranged it
      setVideoBox((b) => (mobile ? null : b ?? videoLayout(innerWidth, innerHeight)));
      focus('video');
    },
    [focus],
  );

  const closeVideo = useCallback(() => {
    setVideo(null);
    setOrder((o) => o.filter((x) => x !== 'video'));
  }, []);

  const show = useCallback(
    (id: WinId) => {
      setOpen((o) => ({ ...o, [id]: true }));
      focus(id);
      if (matchMedia(MOBILE_QUERY).matches) {
        // one window at a time on phones: leaving the player must stop it, not just hide it
        closeVideo();
        requestAnimationFrame(() =>
          document.getElementById('ventanas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        );
      }
    },
    [focus, closeVideo],
  );

  // #trabajos / #lab / #about (and old #contacto) open that window.
  useEffect(() => {
    const fromHash = () => {
      const h = location.hash.slice(1);
      const id = (h === 'contacto' ? 'about' : h) as WinId;
      if (MOBILE_WINDOWS.some((w) => w.id === id)) show(id);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [show]);

  // Focus follows the player: into it when a video opens, back to the work link when it closes.
  // (An effect runs right after the DOM updates, unlike requestAnimationFrame.)
  const videoId = video?.id ?? null;
  const hadVideo = useRef(false);
  useEffect(() => {
    const mobile = matchMedia(MOBILE_QUERY).matches;
    if (videoId) {
      document.querySelector<HTMLElement>('#win-video button')?.focus({ preventScroll: true });
      if (mobile) document.getElementById('ventanas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (hadVideo.current) {
      const t = videoTrigger.current;
      if (t?.isConnected) t.focus({ preventScroll: !mobile });
    }
    hadVideo.current = videoId !== null;
  }, [videoId]);

  // Escape closes the player.
  useEffect(() => {
    if (!video) return;
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && closeVideo();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [video, closeVideo]);

  const content = (id: WinId) =>
    id === 'trabajos' ? (
      <WorksContent clicked={clicked} onOpen={onOpenWork} onPlay={openVideo} />
    ) : id === 'lab' ? (
      <LabContent />
    ) : id === 'about' ? (
      <AboutContent />
    ) : (
      <LogoContent />
    );

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
                {w.id === 'lab' ? '▤' : w.id === 'logo' ? '◉' : '≡'}
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
          <div
            key={w.id}
            id={`win-${w.id}`}
            className={`${styles.slot} ${w.desktopOnly ? styles.desktopOnly : ''}`}
            data-front={front === w.id}
          >
            <Window
              title={w.title}
              pos={pos?.[w.id] ?? null}
              width={sizes[w.id]}
              onResize={w.id === 'logo' ? (width) => setSizes((s) => ({ ...s, logo: width })) : undefined}
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
        {video && (
          <div id="win-video" className={`${styles.slot} ${styles.videoSlot}`} data-front={front === 'video'}>
            <Window
              title={videoFileName(video.work.title)}
              pos={videoBox?.pos ?? null}
              width={videoBox?.width ?? 0}
              z={10 + order.indexOf('video')}
              focused={front === 'video'}
              onFocus={() => focus('video')}
              onMove={(p) => setVideoBox((b) => (b ? { ...b, pos: p } : b))}
              onResize={(width) => setVideoBox((b) => (b ? { ...b, width } : b))}
              minWidth={360}
              onClose={closeVideo}
            >
              <VideoContent key={video.id} work={video.work} id={video.id} />
            </Window>
          </div>
        )}
      </div>

      <nav className={styles.dock} aria-label="Ventanas" data-nosnippet="">
        {MOBILE_WINDOWS.map((w) => (
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
