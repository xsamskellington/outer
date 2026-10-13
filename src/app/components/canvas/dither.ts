'use client';

import { useEffect, type RefObject } from 'react';

/** Light-to-dark ramp; index 0 is the brightest. */
export const CHARS = '██▓▒░· ';

/** OUTER palette, dark to bright. */
export const PALETTE = ['#071006', '#17330d', '#3f8f12', '#63ff00', '#b6ff3b'];

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Slow organic plasma, 0..1. u/v are roughly -0.5..0.5. */
export function plasma(u: number, v: number, t: number) {
  const { sin, sqrt } = Math;
  const r = sqrt(u * u + v * v);
  return clamp01(
    0.5 +
      0.2 * sin(u * 9 + t * 1.1) +
      0.2 * sin(v * 11 - t * 0.9) +
      0.14 * sin((u + v) * 16 + t * 0.45) +
      0.1 * sin(r * 26 - t * 1.3),
  );
}

/** Ordered dither + contrast, then quantise into a char and colour. Returns null for empty cells. */
export function shade(value: number, x: number, y: number, contrast = 2) {
  let f = (value - 0.5) * contrast + 0.5;
  f += ((BAYER4[y % 4][x % 4] + 0.5) / 16 - 0.5) * 0.3;
  f = clamp01(f);
  const ch = CHARS[Math.min(CHARS.length - 1, Math.floor((1 - f) * CHARS.length))];
  if (ch === ' ') return null;
  return { ch, color: PALETTE[Math.min(PALETTE.length - 1, Math.floor(f * PALETTE.length))] };
}

export type Grid = { cols: number; rows: number; cell: number };

/** Square cells: `cols` across, as many rows as fit. */
export function makeGrid(w: number, h: number, cols: number): Grid {
  const cell = w / cols;
  return { cols, rows: Math.ceil(h / cell), cell };
}

export function prepareText(ctx: CanvasRenderingContext2D, cell: number) {
  ctx.font = `${Math.ceil(cell * 1.16)}px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
}

export type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

/**
 * Sizes the canvas to its box and runs `draw` every frame while it is on screen.
 * With reduced motion it draws a single still frame.
 */
export function useCanvasLoop(ref: RefObject<HTMLCanvasElement>, draw: DrawFn, maxDpr = 1.5) {
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let t = 0;
    let last = performance.now();
    let frameId = 0;
    let visible = true;

    const paint = () => draw(ctx, canvas.width, canvas.height, t);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      paint();
    };

    const loop = () => {
      const now = performance.now();
      t += Math.min(0.05, (now - last) / 1000);
      last = now;
      paint();
      frameId = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduceMotion || !visible || frameId) return;
      last = performance.now();
      frameId = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    const ro = new ResizeObserver(resize);
    io.observe(canvas);
    ro.observe(canvas);
    resize();
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
    };
  }, [ref, draw, maxDpr]);
}
