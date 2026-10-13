'use client';

import { useCallback, useRef } from 'react';
import { DEFAULT_SETTINGS, type Settings } from '../../outer-vj/config';
import { renderFrame } from '../../outer-vj/engine';
import { useCanvasLoop, type DrawFn } from '../hero/dither';
import styles from './styles.module.css';

/* ---------- OUTER VJ preview: the real dither engine at low density ---------- */

const VJ_SETTINGS: Settings = { ...DEFAULT_SETTINGS, density: 64, scan: true };

function VjPreview() {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = useCallback<DrawFn>((ctx, _w, _h, t) => {
    renderFrame(ctx, VJ_SETTINGS, t * 1.4, t, 1234);
  }, []);
  useCanvasLoop(ref, draw, 1.5);
  return <canvas ref={ref} className={styles.preview} aria-hidden="true" />;
}

/* ---------- Wirefield preview: a light 2D sketch of rotating wireframe octahedra ---------- */

const OCTA_VERTS = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
];
const OCTA_EDGES = [
  [0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 4], [2, 5], [3, 4], [3, 5],
];

type Particle = { x: number; y: number; z: number; phase: number; size: number; ring: boolean };

const PARTICLES: Particle[] = (() => {
  // fixed pseudo-random so server and client agree
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 110 }, (_, i) => {
    const ring = i % 3 === 0;
    const u = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    return ring
      ? { x: Math.cos(a) * 1.5, y: u * 0.12, z: Math.sin(a) * 1.5, phase: rand() * 7, size: 0.05, ring }
      : { x: r * Math.cos(a), y: u, z: r * Math.sin(a), phase: rand() * 7, size: 0.04 + rand() * 0.05, ring };
  });
})();

function WirefieldPreview() {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = useCallback<DrawFn>((ctx, w, h, t) => {
    ctx.fillStyle = '#07090d';
    ctx.fillRect(0, 0, w, h);

    const scale = Math.min(w, h) * 0.42;
    const yaw = t * 0.25;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const tilt = 0.35;
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);

    const lime = new Path2D();
    const violet = new Path2D();

    for (const p of PARTICLES) {
      // drift, then orbit the whole field and tilt the camera
      const wob = Math.sin(t * 0.6 + p.phase) * 0.06;
      let x = p.x * (1 + wob);
      let y = p.y + Math.cos(t * 0.5 + p.phase) * 0.05;
      let z = p.z * (1 + wob);
      [x, z] = [x * cy - z * sy, x * sy + z * cy];
      [y, z] = [y * ct - z * st, y * st + z * ct];

      const persp = 3 / (3 + z);
      const px = w / 2 + x * scale * persp;
      const py = h / 2 + y * scale * persp;
      const s = p.size * scale * persp;

      // spin each octahedron about its own axes
      const a = t * 0.9 + p.phase;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const pts = OCTA_VERTS.map(([vx, vy, vz]) => {
        const rx = vx * ca - vz * sa;
        const rz = vx * sa + vz * ca;
        const ry = vy * ca - rz * sa * 0.6;
        return [px + rx * s, py + ry * s];
      });

      const path = p.ring ? violet : lime;
      for (const [i, j] of OCTA_EDGES) {
        path.moveTo(pts[i][0], pts[i][1]);
        path.lineTo(pts[j][0], pts[j][1]);
      }
    }

    ctx.lineWidth = Math.max(1, w / 600);
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#8d4dff';
    ctx.stroke(violet);
    ctx.strokeStyle = '#b5ff3b';
    ctx.stroke(lime);
    ctx.globalAlpha = 1;
  }, []);
  useCanvasLoop(ref, draw, 1.5);
  return <canvas ref={ref} className={styles.preview} aria-hidden="true" />;
}

/* ---------- Section ---------- */

const TOOLS = [
  {
    href: '/outer-vj',
    title: 'OUTER VJ',
    text: 'Generador ASCII / dither en tiempo real para visuales.',
    credit: 'por Mati Mast',
    Preview: VjPreview,
  },
  {
    href: '/wirefield',
    title: 'Wirefield',
    text: 'Sistema de partículas 3D generativo en tiempo real.',
    credit: 'por Mati Mast',
    Preview: WirefieldPreview,
  },
];

const Lab = () => (
  <section className={styles.section}>
    <h2 className={styles.heading}>Lab</h2>
    <div className={styles.grid}>
      {TOOLS.map(({ href, title, text, credit, Preview }) => (
        <a key={href} href={href} className={styles.card}>
          <Preview />
          <span className={styles.body}>
            <span className={styles.titleRow}>
              <span className={styles.title}>{title}</span>
              <span className={styles.arrow} aria-hidden="true">
                ↗
              </span>
            </span>
            <span className={styles.text}>{text}</span>
            {credit && <span className={styles.credit}>{credit}</span>}
          </span>
        </a>
      ))}
    </div>
  </section>
);

export default Lab;
