'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { DEFAULT_SETTINGS, type Settings } from '../../outer-vj/config';
import { renderFrame } from '../../outer-vj/engine';
import styles from './styles.module.css';

// Calmer than the VJ default so the logo and copy stay readable on top.
const HERO_SETTINGS: Settings = {
  ...DEFAULT_SETTINGS,
  density: 96,
  speed: 55,
  autoZoom: 10,
  moveX: 6,
  moveY: -3,
  rotation: 6,
};

const Hero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seed = Math.random() * 9999;

    let time = 0;
    let motionT = 0;
    let last = performance.now();
    let frameId = 0;
    let visible = true;

    const drawOnce = () => renderFrame(ctx, HERO_SETTINGS, time, motionT, seed, true);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      drawOnce();
    };

    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt * (HERO_SETTINGS.speed / 100) * 2;
      motionT += dt;
      drawOnce();
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

    // Only animate while the hero is on screen.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
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
  }, []);

  return (
    <header className={styles.hero}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.overlay}>
        <Image
          className={styles.logo}
          src="/outer_logo_blanco.svg"
          alt="OUTER"
          width={1920}
          height={1080}
          priority
        />
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
