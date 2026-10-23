/* Values copied from outer_ascii_flow_v1_5.html by Mati Mast. */

export const MODES = ['FLOW', 'WAVES', 'PLASMA', 'NOISE', 'RINGS', 'CELLS'] as const;
export type Mode = (typeof MODES)[number];

export const PALETTES = {
  ACID: ['#23340c', '#6729b8', '#a755ff', '#63ff00', '#c8ff78'],
  EMBER: ['#301013', '#9b2236', '#ff4727', '#ff9b32', '#ffe49b'],
  ICE: ['#082e48', '#186ec0', '#37ccdf', '#9befff', '#efffff'],
  MONO: ['#202020', '#555555', '#888888', '#bbb', '#fff'],
  TOKYO: ['#25144a', '#7442c8', '#ff4eae', '#ff856d', '#ffe1b2'],
  TOXIC: ['#123932', '#008c79', '#00ecaa', '#b4ff2e', '#eeffba'],
} as const;
export type PaletteName = keyof typeof PALETTES;
export const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[];

export const SETS = {
  DENSO: ' .,:;i1tfLCG08@',
  SIMPLE: ' .:+*#%@',
  BLOCK: ' ░▒▓█',
} as const;

export const DIRECTIONS: { label: string; value: number }[] = [
  { label: '→', value: 0 },
  { label: '↓', value: 90 },
  { label: '←', value: 180 },
  { label: '↑', value: 270 },
];

export const FORMATS = ['AUTO', '16:9', '4:3', '9:16'] as const;
export type Format = (typeof FORMATS)[number];

export type ColorMode = 'BANDAS' | 'LUZ';

export type State = {
  mode: Mode;
  scale: number;
  warp: number;
  speed: number;
  angle: number;
  rotate: boolean;
  pulse: boolean;
  size: number;
  contrast: number;
  chars: string;
  palette: PaletteName;
  invert: boolean;
  colorMode: ColorMode;
  bg: string;
  format: Format;
  seed: number;
};

export const DEFAULTS: State = {
  mode: 'FLOW',
  scale: 2.8,
  warp: 1.3,
  speed: 0.35,
  angle: 0,
  rotate: false,
  pulse: false,
  size: 13,
  contrast: 1.5,
  chars: SETS.SIMPLE,
  palette: 'ACID',
  invert: false,
  colorMode: 'BANDAS',
  bg: '#000000',
  format: 'AUTO',
  seed: 12,
};

export type NumericKey = 'scale' | 'warp' | 'speed' | 'size' | 'contrast';

export type SliderSpec = { key: NumericKey; label: string; min: number; max: number; step: number };

export const TEXTURE_SLIDERS: SliderSpec[] = [
  { key: 'scale', label: 'Escala', min: 0.4, max: 8, step: 0.05 },
  { key: 'warp', label: 'Deformacion', min: 0, max: 4, step: 0.05 },
];
export const MOTION_SLIDERS: SliderSpec[] = [{ key: 'speed', label: 'Velocidad', min: 0, max: 2, step: 0.01 }];
export const ASCII_SLIDERS: SliderSpec[] = [
  { key: 'size', label: 'Tamano', min: 7, max: 26, step: 1 },
  { key: 'contrast', label: 'Contraste', min: 0.3, max: 3, step: 0.05 },
];
const ALL_SLIDERS = [...TEXTURE_SLIDERS, ...MOTION_SLIDERS, ...ASCII_SLIDERS];

/** Max characters in the editable set (as in the original). */
export const MAX_CHARS = 64;
export const clampChars = (s: string) => Array.from(s).slice(0, MAX_CHARS).join('');

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

/** What RANDOM changes (everything else is kept). */
export const randomize = (s: State): State => ({
  ...s,
  mode: pick(MODES),
  seed: Math.random() * 999,
  palette: pick(PALETTE_NAMES),
  scale: 1 + Math.random() * 4,
  warp: Math.random() * 3,
  angle: pick([0, 90, 180, 270]),
});

export const PRESET_APP = 'outer-ascii-flow';

/** Validates a loaded preset exactly like the original; throws on anything invalid. */
export function parsePreset(data: unknown): State {
  const d = data as { app?: unknown; state?: Record<string, unknown> };
  if (d?.app !== PRESET_APP || !d.state) throw new Error('not a preset');
  const s = d.state;
  const n: State = { ...DEFAULTS };
  for (const { key, min, max } of ALL_SLIDERS) {
    const v = s[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error('bad ' + key);
    n[key] = Math.max(min, Math.min(max, v));
  }
  const paletteOk = typeof s.palette === 'string' && Object.prototype.hasOwnProperty.call(PALETTES, s.palette);
  if (!MODES.includes(s.mode as Mode) || !paletteOk) throw new Error('bad mode/palette');
  if (typeof s.chars !== 'string' || !s.chars.length) throw new Error('bad chars');
  return {
    ...n,
    mode: s.mode as Mode,
    palette: s.palette as PaletteName,
    chars: clampChars(s.chars),
    angle: [0, 90, 180, 270].includes(s.angle as number) ? (s.angle as number) : 0,
    rotate: !!s.rotate,
    pulse: !!s.pulse,
    invert: !!s.invert,
    colorMode: s.colorMode === 'LUZ' ? 'LUZ' : 'BANDAS',
    bg: typeof s.bg === 'string' && /^#[0-9a-f]{6}$/i.test(s.bg) ? s.bg : '#000000',
    format: FORMATS.includes(s.format as Format) ? (s.format as Format) : 'AUTO',
    seed: Number.isFinite(s.seed) ? (s.seed as number) : 12,
  };
}
