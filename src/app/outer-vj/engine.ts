import { CHARSETS, DEFAULT_CUSTOM_CHARS, PALETTES, type Settings } from './config';

type RGB = [number, number, number];

const BAYER2 = [[0, 2], [3, 1]];
const BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21],
];

const hexToRgb = (hex: string): RGB => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Everything a single frame needs, with slider values already normalised. */
type Frame = {
  s: Settings;
  time: number;
  motionT: number;
  seed: number;
};

function hash(x: number, y: number, seed: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453123;
  return n - Math.floor(n);
}

/** Maps a normalised cell position into the warped, zoomed, rotated surface space. */
function surfaceCoord(u: number, v: number, { s, time, motionT }: Frame): [number, number] {
  let x = u - 0.5;
  let y = v - 0.5;

  const motionZoom = 1 + (s.autoZoom / 100) * Math.sin(motionT * (s.zoomRate / 100) * 2.2);
  const zoom = Math.max(0.15, (s.zoom / 100) * motionZoom);

  x /= zoom;
  y /= zoom;
  x += motionT * (s.moveX / 100) * 0.22;
  y += motionT * (s.moveY / 100) * 0.22;

  const rot = motionT * (s.rotation / 100) * 0.8;
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  [x, y] = [x * cr - y * sr, x * sr + y * cr];

  const warp = s.warp / 100;
  const wave = s.wave / 100;
  const twist = s.twist / 100;

  const r = Math.sqrt(x * x + y * y);
  const ang = twist * (r * 3.2 + Math.sin(time * 0.35) * 0.25);
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);

  let rx = x * ca - y * sa;
  let ry = x * sa + y * ca;

  rx += Math.sin(ry * 8 + time * 1.1) * 0.08 * warp;
  ry += Math.sin(rx * 7 - time * 0.85) * 0.075 * warp;
  rx += Math.sin((ry + time * 0.1) * 18) * 0.025 * wave;

  return [rx, ry];
}

/** Brightness (0..1) of the generator pattern at a cell. */
function field(u: number, v: number, frame: Frame) {
  const { time, seed } = frame;
  const [x, y] = surfaceCoord(u, v, frame);
  const r = Math.sqrt(x * x + y * y);
  const a = Math.atan2(y, x);
  const { sin, abs, floor } = Math;
  let f: number;

  switch (frame.s.preset) {
    case 'roto': {
      const ca = Math.cos(time * 0.42);
      const sa = sin(time * 0.42);
      const xx = x * ca - y * sa;
      const yy = x * sa + y * ca;
      f = 0.5 + 0.25 * sin(xx * 25 + time * 1.3) + 0.25 * sin(yy * 25 - time * 0.8) + 0.13 * sin((xx + yy) * 38);
      break;
    }
    case 'tunnel':
      f = 0.5 + 0.26 * sin(34 * r - time * 2.2 + sin(a * 7 - time * 0.4) * 2) + 0.18 * sin(a * 9 + time * 0.7) + 0.08 * sin(r * 90);
      break;
    case 'checker':
      f = 0.5 + 0.5 * sin((x + sin(y * 9 + time) * 0.06) * 28) * sin((y + sin(x * 8 - time) * 0.06) * 28);
      break;
    case 'raster':
      f = 0.5 + 0.34 * sin(y * 41 + sin(x * 12 + time) * 4.2 - time * 1.8) + 0.16 * sin(x * 18 + time * 0.6) + 0.08 * sin((x + y) * 70);
      break;
    case 'moire':
      f = 0.5 + 0.23 * sin(r * 95 - time * 0.8) + 0.23 * sin((x * 0.83 + y) * 73 + time * 0.45) + 0.18 * sin((x - y * 0.7) * 91 - time * 0.6);
      break;
    case 'worm':
      f = 0.5 + 0.25 * sin(x * 18 + sin(y * 10 + time) * 4) + 0.22 * sin(y * 23 + sin(x * 8 - time) * 3.3) + 0.14 * sin((x + y) * 50 - time);
      break;
    case 'crush':
      f = 0.5 + 0.32 * sin(x * 17 + time) + 0.3 * sin(y * 21 - time * 0.9) + 0.16 * sin(r * 44 - time * 1.4);
      break;
    case 'starburst':
      f = 0.5 + 0.34 * sin(a * 14 + r * 38 - time * 1.7) + 0.19 * sin(a * 6 - time * 0.6) + 0.12 * sin(r * 80);
      break;
    case 'wavefold':
      f = 0.5 + 0.31 * sin((x + sin(y * 11 + time) * 0.14) * 24) + 0.25 * sin((y + sin(x * 9 - time) * 0.12) * 29) + 0.1 * sin((x - y) * 55);
      break;
    case 'polar':
      f = 0.5 + 0.22 * sin(a * 12 + time * 0.7) + 0.22 * sin(r * 55 - time) + 0.19 * sin(a * 7 - r * 33 + time * 0.5);
      break;
    case 'cells': {
      const cx = sin(x * 18 + time) + sin(y * 15 - time * 0.8);
      const cy = sin((x + y) * 21 - time * 0.45);
      f = 0.5 + 0.28 * sin(cx * 2.4) + 0.22 * sin(cy * 2.2);
      break;
    }
    case 'zebra':
      f = 0.5 + 0.42 * sin((x + sin(y * 7 + time) * 0.18) * 25 + sin(y * 13 - time) * 2.2);
      break;
    case 'diamonds':
      f = 0.5 + 0.33 * sin((abs(x) + abs(y)) * 42 - time * 1.2) + 0.18 * sin((x - y) * 26 + time * 0.55);
      break;
    case 'crosshatch':
      f = 0.5 + 0.21 * sin((x + y) * 72 + time * 0.35) + 0.21 * sin((x - y) * 76 - time * 0.28) + 0.14 * sin(y * 19 + time);
      break;
    case 'storm':
      f = 0.5 + 0.2 * sin(x * 38 + time * 2.1) + 0.18 * sin(y * 43 - time * 1.7) + 0.16 * sin((x + y) * 70 + time) +
        0.14 * (hash(floor((x + 1) * 120 + time * 8), floor((y + 1) * 120), seed) - 0.5) * 2;
      break;
    case 'vertical':
      f = 0.5 + 0.34 * sin(x * 31 + sin(y * 10 + time) * 5) + 0.2 * sin(y * 18 - time * 1.4) + 0.12 * sin(x * 80);
      break;
    case 'interference':
      f = 0.5 + 0.23 * sin(r * 82 - time * 0.8) + 0.21 * sin((x * 0.7 + y) * 67 + time * 0.5) + 0.21 * sin((x - y * 0.8) * 73 - time * 0.45);
      break;
    default: // blockplasma
      f = 0.5 + 0.2 * sin(x * 17 + time * 1.1) + 0.2 * sin(y * 21 - time * 0.9) + 0.15 * sin((x + y) * 31 + time * 0.45) +
        0.12 * sin(r * 53 - time * 1.35) + 0.08 * sin((x - y) * 67);
  }

  f += (hash(floor(u * 150), floor(v * 150), seed) - 0.5) * 0.035;
  return clamp(f, 0, 1);
}

function dither(v: number, x: number, y: number, { s, seed }: Frame) {
  const amt = (s.ditherAmt / 100) * 0.42;
  switch (s.dither) {
    case 'none': return v;
    case 'threshold': return v > 0.5 ? 1 : 0;
    case 'noise': return v + (hash(x, y, seed) - 0.5) * amt;
    case 'bayer2': return v + ((BAYER2[y % 2][x % 2] + 0.5) / 4 - 0.5) * amt;
    case 'bayer8': return v + ((BAYER8[y % 8][x % 8] + 0.5) / 64 - 0.5) * amt;
    default: return v + ((BAYER4[y % 4][x % 4] + 0.5) / 16 - 0.5) * amt;
  }
}

/** Interpolated palette colour for a brightness value. */
function paletteColor(v: number, colors: RGB[], spread: number): RGB {
  v = clamp((v - 0.5) * spread + 0.5, 0, 0.9999);
  const pos = v * (colors.length - 1);
  const i = Math.floor(pos);
  const t = pos - i;
  const a = colors[i];
  const b = colors[Math.min(i + 1, colors.length - 1)];
  return a.map((c, k) => Math.round(c + (b[k] - c) * t)) as RGB;
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  s: Settings,
  time: number,
  motionT: number,
  seed: number,
  /** Spread `density` along the longer side (portrait phones), so cells keep their size. */
  fitLongSide = false,
) {
  const { width: w, height: h } = ctx.canvas;
  const frame: Frame = { s, time, motionT, seed };
  const colors = PALETTES[s.palette].colors.map(hexToRgb);
  const spread = s.colorSpread / 100;

  ctx.fillStyle = `rgb(${colors[0].join(',')})`;
  ctx.fillRect(0, 0, w, h);

  const cols = fitLongSide && h > w ? Math.max(1, Math.round((s.density * w) / h)) : s.density;
  const cell = w / cols;
  const rows = Math.ceil(h / cell);
  const chars = s.charset === 'custom' ? s.custom || DEFAULT_CUSTOM_CHARS : CHARSETS[s.charset];
  const contrast = s.contrast / 100;
  const shift = s.threshold / 100;

  ctx.font = `${Math.ceil(cell * 1.16)}px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let f = field((x + 0.5) / cols, (y + 0.5) / rows, frame);
      f = (f - 0.5) * contrast + 0.5 + shift;
      if (s.poster) f = Math.round(f * 4) / 4;
      f = clamp(dither(f, x, y, frame), 0, 1);
      if (s.invert) f = 1 - f;

      const idx = clamp(Math.floor((1 - f) * chars.length), 0, chars.length - 1);
      const ch = chars[idx] || ' ';
      if (ch === ' ') continue;

      ctx.fillStyle = `rgb(${paletteColor(f, colors, spread).join(',')})`;
      ctx.fillText(ch, (x + 0.5) * cell, y * cell - cell * 0.04);
    }
  }

  if (s.scan) {
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  }
}
