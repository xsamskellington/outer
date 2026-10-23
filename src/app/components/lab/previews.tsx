'use client';

import { useCallback, useRef } from 'react';
import { DEFAULT_SETTINGS, type Settings } from '../../outer-vj/config';
import { renderFrame } from '../../outer-vj/engine';
import { useCanvasLoop, type DrawFn } from '../canvas/dither';

/* ---------- OUTER VJ preview: the real dither engine at low density ---------- */

const VJ_SETTINGS: Settings = { ...DEFAULT_SETTINGS, density: 64, scan: true };

export function VjPreview({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = useCallback<DrawFn>((ctx, _w, _h, t) => {
    renderFrame(ctx, VJ_SETTINGS, t * 1.4, t, 1234);
  }, []);
  useCanvasLoop(ref, draw, 1.5);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

/* ---------- Wirefield preview: a light 2D sketch of rotating wireframe octahedra ---------- */

const OCTA_VERTS = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
];
const OCTA_EDGES = [
  [0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 4], [2, 5], [3, 4], [3, 5],
];

const RING_PASSES = [true, false] as const;

/** Projected vertices of the octahedron being drawn (reused every frame). */
const SCREEN = new Float32Array(12);

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

export function WirefieldPreview({ className }: { className?: string }) {
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

    // Two passes (violet ring, then lime cloud), one path each; vertices go into a reused buffer.
    ctx.lineWidth = Math.max(1, w / 600);
    ctx.globalAlpha = 0.85;
    for (const ring of RING_PASSES) {
      ctx.beginPath();
      for (const p of PARTICLES) {
        if (p.ring !== ring) continue;
        // drift, then orbit the whole field and tilt the camera
        const wob = Math.sin(t * 0.6 + p.phase) * 0.06;
        const x0 = p.x * (1 + wob);
        const y0 = p.y + Math.cos(t * 0.5 + p.phase) * 0.05;
        const z0 = p.z * (1 + wob);
        const x = x0 * cy - z0 * sy;
        const z1 = x0 * sy + z0 * cy;
        const y = y0 * ct - z1 * st;
        const z = y0 * st + z1 * ct;

        const persp = 3 / (3 + z);
        const px = w / 2 + x * scale * persp;
        const py = h / 2 + y * scale * persp;
        const s = p.size * scale * persp;

        // spin each octahedron about its own axes
        const a = t * 0.9 + p.phase;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        for (let v = 0; v < 6; v++) {
          const [vx, vy, vz] = OCTA_VERTS[v];
          const rx = vx * ca - vz * sa;
          const rz = vx * sa + vz * ca;
          const ry = vy * ca - rz * sa * 0.6;
          SCREEN[v * 2] = px + rx * s;
          SCREEN[v * 2 + 1] = py + ry * s;
        }
        for (const [i, j] of OCTA_EDGES) {
          ctx.moveTo(SCREEN[i * 2], SCREEN[i * 2 + 1]);
          ctx.lineTo(SCREEN[j * 2], SCREEN[j * 2 + 1]);
        }
      }
      ctx.strokeStyle = ring ? '#8d4dff' : '#b5ff3b';
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, []);
  useCanvasLoop(ref, draw, 1.5);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

/* ---------- ASCII Flow preview: the FLOW texture in 2D, at thumbnail resolution ---------- */

const FLOW_CHARS = ' .:+*#%@';
const FLOW_COLORS = ['#23340c', '#6729b8', '#a755ff', '#63ff00', '#c8ff78'];

function flowHash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + 12 * 19.19) * 43758.5453;
  return n - Math.floor(n);
}

function flowNoise(x: number, y: number) {
  const i = Math.floor(x);
  const j = Math.floor(y);
  let u = x - i;
  let v = y - j;
  u = u * u * (3 - 2 * u);
  v = v * v * (3 - 2 * v);
  const a = flowHash(i, j) + (flowHash(i + 1, j) - flowHash(i, j)) * u;
  const b = flowHash(i, j + 1) + (flowHash(i + 1, j + 1) - flowHash(i, j + 1)) * u;
  return a + (b - a) * v;
}

export function AsciiFlowPreview({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = useCallback<DrawFn>((ctx, w, h, t) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const cols = 46;
    const cw = w / cols;
    const ch = cw * 1.85;
    const rows = Math.ceil(h / ch);
    ctx.font = `${Math.ceil(ch * 0.95)}px ui-monospace,monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const time = t * 0.35;
    const k = (2.8 * 3) / h;
    for (let j = 0; j < rows; j++) {
      const py = (j + 0.5) * ch;
      const y = (py - h / 2) * k;
      for (let i = 0; i < cols; i++) {
        const px = (i + 0.5) * cw;
        const x = (px - w / 2) * k + time * 0.22;
        const qx = flowNoise(x * 0.7 + time * 0.13, y * 0.7);
        const qy = flowNoise(x * 0.7 + 8, y * 0.7 - time * 0.11);
        let v = 0.5 + 0.5 * Math.sin(x * 2.2 + y * 0.8 + (qx - qy) * 1.3 * 8 + time * 0.6);
        v = Math.max(0, Math.min(0.99999, (v - 0.5) * 1.5 + 0.5));
        const g = Math.floor(v * FLOW_CHARS.length);
        if (g === 0) continue;
        const c = v * 1.5 + flowNoise(x * 0.3 + 23, y * 0.3) * 0.6;
        ctx.fillStyle = FLOW_COLORS[Math.min(4, Math.floor((c - Math.floor(c)) * 5))];
        ctx.fillText(FLOW_CHARS[g], px, py);
      }
    }
  }, []);
  useCanvasLoop(ref, draw, 1.5);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
