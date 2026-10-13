export type Shape = 'tetra' | 'cube' | 'octa' | 'icosa' | 'torus';
export type Distribution = 'sphere' | 'ring' | 'disk' | 'cloud' | 'column';
export type PlexMode = 'off' | 'overlay' | 'only';

export type EmitterParams = {
  id: number;
  color: string;
  shape: Shape;
  distribution: Distribution;
  count: number;
  size: number;
  radius: number;
  spread: number;
  spin: number;
  flow: number;
  pulse: number;
  plexMode: PlexMode;
  plexDistance: number;
  plexLinks: number;
  plexOpacity: number;
  plexPointSize: number;
  plexFaces: boolean;
  faceOpacity: number;
  faceDistance: number;
  faceLimit: number;
};

/** What presets specify; everything else falls back to the defaults. */
export type EmitterConfig = Partial<Omit<EmitterParams, 'id'>>;

export type GlobalParams = {
  speed: number;
  noise: number;
  frequency: number;
  vortex: number;
  attract: number;
};

export type NumericEmitterKey = {
  [K in keyof EmitterParams]: EmitterParams[K] extends number ? K : never;
}[keyof EmitterParams];

export type SliderSpec<K extends string> = {
  key: K;
  label: string;
  min: number;
  max: number;
  step: number;
};

export const MAX_EMITTERS = 6;
export const MAX_FACES = 600;
export const MAX_LINKS = 12;

export const SHAPES: { value: Shape; label: string }[] = [
  { value: 'tetra', label: 'Tetraedro' },
  { value: 'cube', label: 'Cubo' },
  { value: 'octa', label: 'Octaedro' },
  { value: 'icosa', label: 'Icosaedro' },
  { value: 'torus', label: 'Toro' },
];

export const DISTRIBUTIONS: { value: Distribution; label: string }[] = [
  { value: 'sphere', label: 'Esfera' },
  { value: 'ring', label: 'Anillo' },
  { value: 'disk', label: 'Disco' },
  { value: 'cloud', label: 'Nube' },
  { value: 'column', label: 'Columna' },
];

export const PLEX_MODES: { value: PlexMode; label: string }[] = [
  { value: 'off', label: 'Geometrías (original)' },
  { value: 'overlay', label: 'Plexus + geometrías' },
  { value: 'only', label: 'Solo Plexus' },
];

export const EMITTER_SLIDERS: SliderSpec<NumericEmitterKey>[] = [
  { key: 'count', label: 'Cantidad', min: 40, max: 450, step: 10 },
  { key: 'size', label: 'Tamaño', min: 0.1, max: 2.5, step: 0.05 },
  { key: 'radius', label: 'Radio', min: 1, max: 18, step: 0.25 },
  { key: 'spread', label: 'Dispersión', min: 0, max: 10, step: 0.1 },
  { key: 'spin', label: 'Rotación', min: 0, max: 4, step: 0.05 },
  { key: 'flow', label: 'Flujo', min: 0, max: 3, step: 0.05 },
  { key: 'pulse', label: 'Pulso', min: 0, max: 2, step: 0.05 },
];

export const PLEX_SLIDERS: SliderSpec<NumericEmitterKey>[] = [
  { key: 'plexDistance', label: 'Distancia de conexión', min: 1, max: 16, step: 0.25 },
  { key: 'plexLinks', label: 'Conexiones máximas', min: 1, max: 12, step: 1 },
  { key: 'plexOpacity', label: 'Opacidad de líneas', min: 0.05, max: 1, step: 0.05 },
  { key: 'plexPointSize', label: 'Tamaño de nodos', min: 0.02, max: 0.6, step: 0.01 },
];

export const FACE_SLIDERS: SliderSpec<NumericEmitterKey>[] = [
  { key: 'faceOpacity', label: 'Opacidad superficies', min: 0.01, max: 0.7, step: 0.01 },
  { key: 'faceDistance', label: 'Distancia triángulos', min: 1, max: 16, step: 0.25 },
  { key: 'faceLimit', label: 'Máx. triángulos', min: 0, max: MAX_FACES, step: 10 },
];

export const GLOBAL_SLIDERS: SliderSpec<keyof GlobalParams>[] = [
  { key: 'speed', label: 'Velocidad', min: 0, max: 1.5, step: 0.01 },
  { key: 'noise', label: 'Ruido / turbulencia', min: 0, max: 5, step: 0.05 },
  { key: 'frequency', label: 'Frecuencia ruido', min: 0.05, max: 3, step: 0.05 },
  { key: 'vortex', label: 'Vórtice', min: -3, max: 3, step: 0.05 },
  { key: 'attract', label: 'Atracción', min: -2, max: 2, step: 0.05 },
];

export const DEFAULT_GLOBALS: GlobalParams = {
  speed: 0.32,
  noise: 0.65,
  frequency: 0.6,
  vortex: 0.5,
  attract: 0.15,
};

const EMITTER_DEFAULTS: Omit<EmitterParams, 'id'> = {
  color: '#b5ff3b',
  shape: 'octa',
  distribution: 'sphere',
  count: 180,
  size: 0.55,
  radius: 8,
  spread: 2,
  spin: 0.32,
  flow: 0.42,
  pulse: 0.2,
  plexMode: 'off',
  plexDistance: 5,
  plexLinks: 4,
  plexOpacity: 0.45,
  plexPointSize: 0.12,
  plexFaces: false,
  faceOpacity: 0.16,
  faceDistance: 5,
  faceLimit: 220,
};

let nextId = 1;

/** A fresh id makes the engine rebuild the emitter with new random particles. */
export const makeEmitter = (opts: EmitterConfig = {}): EmitterParams => ({
  ...EMITTER_DEFAULTS,
  ...opts,
  id: nextId++,
});

export const INITIAL_EMITTERS = (): EmitterParams[] => [
  makeEmitter({ color: '#b5ff3b', shape: 'octa', count: 200 }),
  makeEmitter({ color: '#8d4dff', shape: 'tetra', distribution: 'ring', count: 130, radius: 12, size: 0.4 }),
];

export const ADD_COLORS = ['#b5ff3b', '#a855f7', '#00e5ff', '#ff4f9a', '#ffb000'];
export const RANDOM_COLORS = ['#b5ff3b', '#ff4f9a', '#36d9ff', '#f5a623', '#ad7cff', '#ffffff'];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

export function randomEmitter(): EmitterParams {
  return makeEmitter({
    shape: pick(SHAPES).value,
    distribution: pick(DISTRIBUTIONS).value,
    color: pick(RANDOM_COLORS),
    count: Math.round(rnd(70, 340)),
    size: rnd(0.2, 1.5),
    radius: rnd(3, 14),
    spread: rnd(0, 7),
    spin: rnd(0.05, 0.75),
    flow: rnd(0.1, 0.9),
    pulse: rnd(0, 0.7),
    plexMode: pick(PLEX_MODES).value,
    plexDistance: rnd(2, 9),
    plexLinks: Math.round(rnd(2, 8)),
    plexOpacity: rnd(0.2, 0.8),
    plexPointSize: rnd(0.05, 0.25),
    plexFaces: Math.random() < 0.45,
    faceOpacity: rnd(0.05, 0.3),
    faceDistance: rnd(3, 9),
    faceLimit: Math.round(rnd(80, 350)),
  });
}

export const randomGlobals = (): GlobalParams => ({
  speed: rnd(0.15, 0.55),
  noise: rnd(0.1, 3),
  frequency: rnd(0.2, 1.8),
  vortex: rnd(-2, 2),
  attract: rnd(-0.8, 0.8),
});

/** Like the original (5, 0.45), but random values are cut to the slider step's decimals. */
export const formatValue = (value: number, step: number) => {
  const decimals = (String(step).split('.')[1] || '').length;
  return String(Number(value.toFixed(decimals)));
};
