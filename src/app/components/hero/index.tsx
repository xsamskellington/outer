'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { makeGrid, plasma, prepareText, shade, useCanvasLoop, type DrawFn } from './dither';
import styles from './styles.module.css';

/**
 * Black hero where the dither field only shows around the pointer, like a flashlight.
 * With no pointer activity (or on touch) the light drifts on its own.
 */
const Hero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef<{ x: number; y: number; at: number } | null>(null);
  const light = useRef({ x: 0.7, y: 0.45 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      target.current = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
        at: performance.now(),
      };
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
    const goal = idle
      ? { x: 0.5 + 0.32 * Math.sin(t * 0.31), y: 0.45 + 0.28 * Math.sin(t * 0.47 + 1) }
      : tg;
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
    <header className={styles.hero}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.content}>
        <span className={styles.logo}>
          <Image src="/outer_logo_blanco.svg" alt="OUTER" width={1920} height={1080} priority />
        </span>
        <p className={styles.tagline}>
          Estudio y laboratorio creativo que explora y habita las fronteras entre la tek y el arte.
        </p>
        <nav className={styles.nav}>
          <a href="#trabajos">Trabajos ↓</a>
          <a href="/outer-vj">Lab / VJ ↗</a>
          <a href="#contacto">Contacto</a>
        </nav>
      </div>
    </header>
  );
};

export default Hero;
