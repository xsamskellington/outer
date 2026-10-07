'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { makeGrid, plasma, prepareText, shade, useCanvasLoop, type DrawFn } from './dither';
import styles from './styles.module.css';

/** Wordmark bounds inside the 1920x1080 SVG. */
const LOGO_BOX = { x: 35, y: 249, w: 1840, h: 579 };
const LOGO_SRC = '/outer_logo_blanco.svg';

/* ---------- Shared pieces ---------- */

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <span className={`${styles.logoMark} ${className}`}>
      <Image src={LOGO_SRC} alt="OUTER" width={1920} height={1080} priority />
    </span>
  );
}

function Nav() {
  return (
    <nav className={styles.nav}>
      <a href="#trabajos">Trabajos</a>
      <a href="/outer-vj">Lab / VJ ↗</a>
      <a href="#contacto">Contacto</a>
    </nav>
  );
}

function TopBar({ showLogo = true }: { showLogo?: boolean }) {
  return (
    <div className={styles.topBar}>
      {showLogo ? <LogoMark className={styles.logoSmall} /> : <span />}
      <Nav />
    </div>
  );
}

const TAGLINE =
  'Estudio y laboratorio creativo que explora y habita las fronteras entre la tek y el arte.';

/* ---------- 1. Logo de caracteres ---------- */

/** The wordmark itself is drawn with animated dither characters. */
export function HeroLogoChars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logo = useRef<HTMLCanvasElement | null>(null);
  const mask = useRef<{ key: string; alpha: Uint8ClampedArray } | null>(null);

  useEffect(() => {
    // The SVG has no width/height, so source-rect crops on it are unreliable.
    // Rasterise it at its viewBox size first and crop from that canvas.
    const img = new window.Image();
    img.src = LOGO_SRC;
    img.onload = () => {
      const full = document.createElement('canvas');
      full.width = 1920;
      full.height = 1080;
      full.getContext('2d')!.drawImage(img, 0, 0, 1920, 1080);
      logo.current = full;
    };
  }, []);

  const draw = useCallback<DrawFn>((ctx, w, h, t) => {
    const portrait = h > w;
    const { cols, rows, cell } = makeGrid(w, h, portrait ? 64 : 132);

    // Rasterise the logo into a cols x rows alpha mask (once per grid size).
    const key = `${cols}x${rows}`;
    if (logo.current && mask.current?.key !== key) {
      const off = document.createElement('canvas');
      off.width = cols;
      off.height = rows;
      const octx = off.getContext('2d')!;
      let lw = cols * (portrait ? 0.9 : 0.72);
      let lh = (lw * LOGO_BOX.h) / LOGO_BOX.w;
      if (lh > rows * 0.45) {
        lh = rows * 0.45;
        lw = (lh * LOGO_BOX.w) / LOGO_BOX.h;
      }
      const lx = (cols - lw) / 2;
      const ly = rows * 0.4 - lh / 2;
      octx.drawImage(logo.current, LOGO_BOX.x, LOGO_BOX.y, LOGO_BOX.w, LOGO_BOX.h, lx, ly, lw, lh);
      const data = octx.getImageData(0, 0, cols, rows).data;
      const alpha = new Uint8ClampedArray(cols * rows);
      for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
      mask.current = { key, alpha };
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    prepareText(ctx, cell);

    const alpha = mask.current?.key === key ? mask.current.alpha : null;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const f = plasma(x / cols - 0.5, y / rows - 0.5, t * 0.6);
        const inLogo = alpha ? alpha[y * cols + x] / 255 : 0;
        // bright, busy texture inside the letters; faint dust outside
        const v = inLogo > 0.4 ? 0.62 + 0.38 * f : f * 0.32;
        const s = shade(v, x, y, inLogo > 0.4 ? 2.4 : 1.6);
        if (!s) continue;
        ctx.fillStyle = s.color;
        ctx.fillText(s.ch, (x + 0.5) * cell, y * cell);
      }
    }
  }, []);

  useCanvasLoop(canvasRef, draw);

  return (
    <header className={`${styles.hero} ${styles.heroFull}`}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <TopBar showLogo={false} />
      <h1 className={styles.srOnly}>OUTER</h1>
      <p className={`${styles.tagline} ${styles.taglineCenter}`}>{TAGLINE}</p>
    </header>
  );
}

/* ---------- 2. Linterna ---------- */

/** Black page; the dither field only appears around the pointer (wanders on its own on touch). */
export function HeroFlashlight() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef<{ x: number; y: number; at: number } | null>(null);
  const light = useRef({ x: 0.7, y: 0.45 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      target.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, at: performance.now() };
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
    };
  }, []);

  const draw = useCallback<DrawFn>((ctx, w, h, t) => {
    const { cols, rows, cell } = makeGrid(w, h, h > w ? 56 : 110);

    // Follow the pointer; after 2.5s idle, drift on a slow lissajous path.
    const tg = target.current;
    const idle = !tg || performance.now() - tg.at > 2500;
    const goal = idle ? { x: 0.5 + 0.32 * Math.sin(t * 0.31), y: 0.45 + 0.28 * Math.sin(t * 0.47 + 1) } : tg;
    light.current.x += (goal.x - light.current.x) * 0.08;
    light.current.y += (goal.y - light.current.y) * 0.08;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    prepareText(ctx, cell);

    const lx = light.current.x * w;
    const ly = light.current.y * h;
    const radius = Math.min(w, h) * 0.32;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = (x + 0.5) * cell;
        const py = (y + 0.5) * cell;
        const d = Math.hypot(px - lx, py - ly) / radius;
        const lit = Math.exp(-d * d) + 0.06;
        if (lit < 0.08) continue;
        const s = shade(plasma(x / cols - 0.5, y / rows - 0.5, t * 0.7) * lit, x, y, 2.2);
        if (!s) continue;
        ctx.fillStyle = s.color;
        ctx.fillText(s.ch, px, y * cell);
      }
    }
  }, []);

  useCanvasLoop(canvasRef, draw);

  return (
    <header className={`${styles.hero} ${styles.heroFull}`}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <TopBar showLogo={false} />
      <div className={styles.flashContent}>
        <LogoMark className={styles.logoLarge} />
        <p className={styles.tagline}>{TAGLINE}</p>
      </div>
    </header>
  );
}

/* ---------- 3. Editorial ---------- */

/** Big type does the talking; the dither lives in a thin strip. */
export function HeroEditorial() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback<DrawFn>((ctx, w, h, t) => {
    const { cols, rows, cell } = makeGrid(w, h, Math.round(w / Math.max(6, h / 7)));
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    prepareText(ctx, cell);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const s = shade(plasma(x / cols - 0.5 - t * 0.04, (y / rows - 0.5) * 0.3, t), x, y, 2.4);
        if (!s) continue;
        ctx.fillStyle = s.color;
        ctx.fillText(s.ch, (x + 0.5) * cell, y * cell);
      }
    }
  }, []);

  useCanvasLoop(canvasRef, draw);

  return (
    <header className={styles.hero}>
      <TopBar />
      <h1 className={styles.headline}>
        Habitamos la frontera entre la <span className={styles.accent}>tek</span> y el arte.
      </h1>
      <canvas ref={canvasRef} className={styles.strip} aria-hidden="true" />
      <p className={styles.subline}>Estudio y laboratorio creativo.</p>
    </header>
  );
}

export const HEROES = [
  { id: 'logo', label: 'Logo de caracteres', Component: HeroLogoChars },
  { id: 'linterna', label: 'Linterna', Component: HeroFlashlight },
  { id: 'editorial', label: 'Editorial', Component: HeroEditorial },
] as const;
