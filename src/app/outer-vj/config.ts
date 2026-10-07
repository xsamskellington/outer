export type DitherMode = 'bayer4' | 'bayer8' | 'bayer2' | 'noise' | 'threshold' | 'none';
export type CharsetName = 'blocks' | 'blocks2' | 'ascii' | 'dots' | 'thin' | 'custom';

export type Settings = {
  preset: PresetName;
  dither: DitherMode;
  palette: PaletteName;
  colorSpread: number;
  autoZoom: number;
  zoomRate: number;
  moveX: number;
  moveY: number;
  rotation: number;
  charset: CharsetName;
  custom: string;
  density: number;
  contrast: number;
  threshold: number;
  ditherAmt: number;
  warp: number;
  wave: number;
  twist: number;
  zoom: number;
  speed: number;
  invert: boolean;
  scan: boolean;
  poster: boolean;
};

export type NumericKey = {
  [K in keyof Settings]: Settings[K] extends number ? K : never;
}[keyof Settings];

type PresetParams = Pick<
  Settings,
  | 'dither' | 'charset' | 'density' | 'contrast' | 'threshold' | 'ditherAmt'
  | 'warp' | 'wave' | 'twist' | 'zoom' | 'speed' | 'poster'
>;

export const PRESETS = {
  blockplasma: { label: 'Block Plasma', params: { dither: 'bayer4', charset: 'blocks2', density: 116, contrast: 210, threshold: 0, ditherAmt: 72, warp: 50, wave: 65, twist: 20, zoom: 100, speed: 86, poster: false } },
  roto: { label: 'Rotozoom', params: { dither: 'bayer4', charset: 'blocks', density: 108, contrast: 235, threshold: -4, ditherAmt: 60, warp: 30, wave: 35, twist: 72, zoom: 110, speed: 92, poster: false } },
  tunnel: { label: 'Tunnel', params: { dither: 'bayer8', charset: 'ascii', density: 132, contrast: 190, threshold: -8, ditherAmt: 82, warp: 55, wave: 72, twist: 34, zoom: 92, speed: 105, poster: false } },
  checker: { label: 'Checker Warp', params: { dither: 'bayer2', charset: 'blocks', density: 92, contrast: 275, threshold: 0, ditherAmt: 55, warp: 78, wave: 82, twist: 28, zoom: 100, speed: 70, poster: true } },
  raster: { label: 'Raster Melt', params: { dither: 'bayer4', charset: 'blocks2', density: 118, contrast: 245, threshold: 3, ditherAmt: 68, warp: 42, wave: 96, twist: 0, zoom: 100, speed: 88, poster: false } },
  moire: { label: 'Moire Dither', params: { dither: 'bayer8', charset: 'thin', density: 150, contrast: 260, threshold: -2, ditherAmt: 90, warp: 24, wave: 48, twist: 46, zoom: 120, speed: 60, poster: false } },
  worm: { label: 'Worm Surface', params: { dither: 'noise', charset: 'blocks2', density: 126, contrast: 220, threshold: 0, ditherAmt: 48, warp: 90, wave: 88, twist: -38, zoom: 95, speed: 72, poster: false } },
  crush: { label: '1-Bit Crush', params: { dither: 'threshold', charset: 'blocks', density: 100, contrast: 300, threshold: 0, ditherAmt: 100, warp: 58, wave: 72, twist: 20, zoom: 105, speed: 84, poster: true } },
  starburst: { label: 'Starburst', params: { dither: 'bayer2', charset: 'ascii', density: 126, contrast: 245, threshold: -5, ditherAmt: 68, warp: 22, wave: 30, twist: 48, zoom: 95, speed: 92, poster: false } },
  wavefold: { label: 'Wave Fold', params: { dither: 'bayer4', charset: 'blocks2', density: 120, contrast: 235, threshold: 2, ditherAmt: 76, warp: 88, wave: 100, twist: -12, zoom: 115, speed: 78, poster: false } },
  polar: { label: 'Polar Mesh', params: { dither: 'bayer8', charset: 'thin', density: 142, contrast: 220, threshold: -4, ditherAmt: 85, warp: 36, wave: 54, twist: 80, zoom: 90, speed: 66, poster: false } },
  cells: { label: 'Pulse Cells', params: { dither: 'noise', charset: 'dots', density: 134, contrast: 255, threshold: 5, ditherAmt: 50, warp: 48, wave: 62, twist: 10, zoom: 105, speed: 64, poster: true } },
  zebra: { label: 'Zebra Melt', params: { dither: 'bayer4', charset: 'blocks', density: 104, contrast: 285, threshold: 0, ditherAmt: 65, warp: 92, wave: 92, twist: -22, zoom: 100, speed: 76, poster: true } },
  diamonds: { label: 'Diamond Warp', params: { dither: 'bayer2', charset: 'blocks2', density: 112, contrast: 270, threshold: -2, ditherAmt: 58, warp: 56, wave: 44, twist: 0, zoom: 110, speed: 68, poster: true } },
  crosshatch: { label: 'Crosshatch', params: { dither: 'bayer8', charset: 'thin', density: 156, contrast: 245, threshold: -8, ditherAmt: 88, warp: 18, wave: 35, twist: 18, zoom: 120, speed: 48, poster: false } },
  storm: { label: 'Pixel Storm', params: { dither: 'noise', charset: 'ascii', density: 148, contrast: 230, threshold: 0, ditherAmt: 95, warp: 68, wave: 80, twist: 26, zoom: 100, speed: 125, poster: false } },
  vertical: { label: 'Vertical Melt', params: { dither: 'bayer4', charset: 'blocks2', density: 110, contrast: 255, threshold: 2, ditherAmt: 74, warp: 72, wave: 100, twist: 0, zoom: 100, speed: 90, poster: false } },
  interference: { label: 'Interference', params: { dither: 'bayer8', charset: 'blocks', density: 136, contrast: 260, threshold: -3, ditherAmt: 92, warp: 28, wave: 42, twist: 52, zoom: 105, speed: 58, poster: false } },
} satisfies Record<string, { label: string; params: PresetParams }>;

export type PresetName = keyof typeof PRESETS;

export const PALETTES = {
  outer: { label: 'OUTER', colors: ['#000000', '#071006', '#17330d', '#63ff00', '#b6ff3b'] },
  eva: { label: 'EVA-01 Acid', colors: ['#050008', '#31105c', '#6f24a8', '#78ff00', '#d8ff29'] },
  matrix: { label: 'Toxic Terminal', colors: ['#001106', '#003c12', '#00a83a', '#70ff57', '#e6ffb3'] },
  ultraviolet: { label: 'Ultraviolet Heat', colors: ['#080013', '#3b0066', '#8700ff', '#ff218c', '#ffdc54'] },
  cyber: { label: 'Cyber Ice', colors: ['#020715', '#062b59', '#00a8ff', '#21ffe7', '#f4ffff'] },
  infrared: { label: 'Infrared CRT', colors: ['#090000', '#4c0000', '#d51616', '#ff6b00', '#ffe7a1'] },
  sunset: { label: 'Acid Sunset', colors: ['#16001f', '#610061', '#ff2a8b', '#ff8a00', '#caff00'] },
} satisfies Record<string, { label: string; colors: string[] }>;

export type PaletteName = keyof typeof PALETTES;

export const DITHERS: { value: DitherMode; label: string }[] = [
  { value: 'bayer4', label: 'Bayer 4×4' },
  { value: 'bayer8', label: 'Bayer 8×8' },
  { value: 'bayer2', label: 'Bayer 2×2' },
  { value: 'noise', label: 'Noise' },
  { value: 'threshold', label: '1-Bit' },
  { value: 'none', label: 'None' },
];

export const CHARSETS: Record<Exclude<CharsetName, 'custom'>, string> = {
  blocks: '█▓▒░ ',
  blocks2: '██▓▒░· ',
  ascii: '@%#*+=-:. ',
  dots: '●•· ',
  thin: '#*+:· ',
};

export const DEFAULT_CUSTOM_CHARS = '█▓▒░ ';

export const DEFAULT_SETTINGS: Settings = {
  preset: 'blockplasma',
  palette: 'outer',
  colorSpread: 100,
  autoZoom: 18,
  zoomRate: 45,
  moveX: 12,
  moveY: -5,
  rotation: 16,
  custom: DEFAULT_CUSTOM_CHARS,
  invert: false,
  scan: true,
  ...PRESETS.blockplasma.params,
};

export type SliderSpec = {
  key: NumericKey;
  label: string;
  min: number;
  max: number;
  /** Show the raw value, or divided by 100 with two decimals. */
  scaled?: boolean;
};

export const COLOR_SLIDERS: SliderSpec[] = [
  { key: 'colorSpread', label: 'Color Spread', min: 20, max: 180, scaled: true },
];

export const MOTION_SLIDERS: SliderSpec[] = [
  { key: 'autoZoom', label: 'Auto Zoom', min: 0, max: 80 },
  { key: 'zoomRate', label: 'Zoom Rate', min: -200, max: 200, scaled: true },
  { key: 'moveX', label: 'Move X', min: -100, max: 100, scaled: true },
  { key: 'moveY', label: 'Move Y', min: -100, max: 100, scaled: true },
  { key: 'rotation', label: 'Rotation', min: -150, max: 150, scaled: true },
];

export const DETAIL_SLIDERS: SliderSpec[] = [
  { key: 'density', label: 'Density', min: 44, max: 200 },
  { key: 'contrast', label: 'Contrast', min: 50, max: 300, scaled: true },
  { key: 'threshold', label: 'Threshold', min: -70, max: 70 },
  { key: 'ditherAmt', label: 'Dither Amount', min: 0, max: 100 },
];

export const SURFACE_SLIDERS: SliderSpec[] = [
  { key: 'warp', label: 'Warp', min: 0, max: 100 },
  { key: 'wave', label: 'Wave', min: 0, max: 100 },
  { key: 'twist', label: 'Twist', min: -100, max: 100 },
  { key: 'zoom', label: 'Base Zoom', min: 40, max: 220, scaled: true },
  { key: 'speed', label: 'Animation Speed', min: 0, max: 220, scaled: true },
];
