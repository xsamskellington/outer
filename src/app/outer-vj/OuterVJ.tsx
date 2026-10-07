'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  CHARSETS,
  COLOR_SLIDERS,
  DEFAULT_SETTINGS,
  DETAIL_SLIDERS,
  DITHERS,
  MOTION_SLIDERS,
  PALETTES,
  PRESETS,
  SURFACE_SLIDERS,
  type CharsetName,
  type DitherMode,
  type PaletteName,
  type PresetName,
  type Settings,
  type SliderSpec,
} from './config';
import { renderFrame } from './engine';
import styles from './outer-vj.module.css';

const randInt = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(items: T[]) => items[randInt(items.length)];

const MOBILE_QUERY = '(max-width: 700px)';

/** 'auto' = open on desktop, closed on mobile, until the user toggles it. */
type PanelState = 'auto' | 'shown' | 'hidden';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

const randomMotion = (): Partial<Settings> => ({
  autoZoom: randInt(50),
  zoomRate: randInt(180) - 90,
  moveX: randInt(80) - 40,
  moveY: randInt(80) - 40,
  rotation: randInt(100) - 50,
});

export default function OuterVJ() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [running, setRunning] = useState(true);
  const [panel, setPanel] = useState<PanelState>('auto');
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(true);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const uiVisible = panel === 'auto' ? !isMobile : panel === 'shown';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The render loop reads these refs so it never has to restart.
  const settingsRef = useRef(settings);
  const runningRef = useRef(running);
  const seedRef = useRef(Math.random() * 9999);
  const isMobileRef = useRef(false);
  settingsRef.current = settings;
  runningRef.current = running;
  isMobileRef.current = isMobile;

  const update = useCallback(
    (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })),
    [],
  );

  const applyPreset = (preset: PresetName) => update({ preset, ...PRESETS[preset].params });

  const randomize = useCallback(() => {
    seedRef.current = Math.random() * 9999;
    const preset = pick(Object.keys(PRESETS) as PresetName[]);
    update({
      preset,
      ...PRESETS[preset].params,
      palette: pick(Object.keys(PALETTES) as PaletteName[]),
      ...randomMotion(),
    });
  }, [update]);

  const toggleRun = useCallback(() => setRunning((r) => !r), []);
  const toggleUI = useCallback(() => setPanel(uiVisible ? 'hidden' : 'shown'), [uiVisible]);
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  }, []);

  // Render loop + canvas sizing.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(640, Math.floor(r.width * dpr));
      canvas.height = Math.max(360, Math.floor(r.height * dpr));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let time = 0;
    let motionT = 0;
    let last = performance.now();
    let frameId = 0;

    const draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (runningRef.current) {
        time += dt * (settingsRef.current.speed / 100) * 2;
        motionT += dt;
      }

      renderFrame(ctx, settingsRef.current, time, motionT, seedRef.current, isMobileRef.current);
      frameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) setRunning(false);
    // iPhone Safari has no element fullscreen API.
    setCanFullscreen(!!document.fullscreenEnabled);

    const onFullscreen = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT') return;

      if (ev.code === 'Space') {
        ev.preventDefault();
        toggleRun();
      } else if (ev.key.toLowerCase() === 'f') toggleFullscreen();
      else if (ev.key.toLowerCase() === 'h') toggleUI();
      else if (ev.key.toLowerCase() === 'r') randomize();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleRun, toggleFullscreen, toggleUI, randomize]);

  const sliders = (specs: SliderSpec[]) =>
    specs.map((spec) => (
      <Slider key={spec.key} spec={spec} value={settings[spec.key]} onChange={(v) => update({ [spec.key]: v })} />
    ));

  return (
    <div className={`${styles.root} ${panelClass[panel]}`}>
      <main className={styles.stage}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onClick={() => isMobile && uiVisible && setPanel('hidden')}
        />
        <div className={styles.hud}>
          {PRESETS[settings.preset].label} / {PALETTES[settings.palette].label}
        </div>
        <div className={styles.hint}>
          <span className={styles.kbd}>F</span> fullscreen · <span className={styles.kbd}>H</span> UI ·{' '}
          <span className={styles.kbd}>SPACE</span> pause · <span className={styles.kbd}>R</span> random
        </div>
        <div className={styles.topbar}>
          {canFullscreen && (
            <button className={styles.topBtn} type="button" onClick={toggleFullscreen}>
              {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
          )}
          <button className={styles.topBtn} type="button" onClick={toggleUI}>
            {uiVisible ? 'Hide UI' : 'Show UI'}
          </button>
        </div>
      </main>

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <strong>OUTER ASCII DITHER</strong>
          <span>{isMobile ? 'MOBILE' : 'DESKTOP'}</span>
        </div>

        <Group title="Generator">
          <Select
            label="Preset"
            value={settings.preset}
            options={Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label }))}
            onChange={(v) => applyPreset(v as PresetName)}
          />
          <Select
            label="Dither"
            value={settings.dither}
            options={DITHERS}
            onChange={(v) => update({ dither: v as DitherMode })}
          />
        </Group>

        <Group title="Color">
          <Select
            label="Palette"
            value={settings.palette}
            options={Object.entries(PALETTES).map(([value, p]) => ({ value, label: p.label }))}
            onChange={(v) => update({ palette: v as PaletteName })}
          />
          <div className={styles.swatches}>
            {PALETTES[settings.palette].colors.map((c, i) => (
              <span key={i} style={{ background: c }} />
            ))}
          </div>
          {sliders(COLOR_SLIDERS)}
        </Group>

        <Group title="Continuous Motion" className={styles.motion}>
          {sliders(MOTION_SLIDERS)}
          <div className={styles.buttons}>
            <Button onClick={() => update({ autoZoom: 0, moveX: 0, moveY: 0, rotation: 0 })}>Motion Off</Button>
            <Button onClick={() => update(randomMotion())}>Random Motion</Button>
          </div>
        </Group>

        <Group title="ASCII">
          <Select
            label="Character Set"
            value={settings.charset}
            options={[
              ...Object.entries(CHARSETS).map(([value, chars]) => ({ value, label: chars })),
              { value: 'custom', label: 'Custom' },
            ]}
            onChange={(v) => update({ charset: v as CharsetName })}
          />
          <input
            className={styles.field}
            type="text"
            maxLength={32}
            value={settings.custom}
            onChange={(ev) => update({ custom: ev.target.value })}
          />
        </Group>

        <Group title="Dither Detail">{sliders(DETAIL_SLIDERS)}</Group>

        <Group title="Surface">{sliders(SURFACE_SLIDERS)}</Group>

        <Group title="Output">
          <Check label="Invert" checked={settings.invert} onChange={(v) => update({ invert: v })} />
          <Check label="Scanlines" checked={settings.scan} onChange={(v) => update({ scan: v })} />
          <Check label="Hard Posterize" checked={settings.poster} onChange={(v) => update({ poster: v })} />
          <div className={styles.buttons}>
            <Button onClick={randomize}>Random</Button>
            <Button onClick={toggleRun}>{running ? 'Pause' : 'Play'}</Button>
          </div>
        </Group>
      </aside>
    </div>
  );
}

const panelClass: Record<PanelState, string> = {
  auto: '',
  shown: styles.uiShown,
  hidden: styles.uiHidden,
};

/* ---------- UI pieces ---------- */

function Group({ title, className = '', children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`${styles.group} ${className}`}>
      <div className={styles.sectionTitle}>{title}</div>
      {children}
    </section>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <>
      <label className={styles.label}>{label}</label>
      <select className={styles.field} value={value} onChange={(ev) => onChange(ev.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </>
  );
}

function Slider({ spec, value, onChange }: { spec: SliderSpec; value: number; onChange: (value: number) => void }) {
  return (
    <>
      <label className={styles.label}>{spec.label}</label>
      <div className={styles.row}>
        <input
          className={styles.range}
          type="range"
          min={spec.min}
          max={spec.max}
          value={value}
          onChange={(ev) => onChange(+ev.target.value)}
        />
        <span className={styles.value}>{spec.scaled ? (value / 100).toFixed(2) : value}</span>
      </div>
    </>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={`${styles.label} ${styles.check}`}>
      <input type="checkbox" checked={checked} onChange={(ev) => onChange(ev.target.checked)} /> {label}
    </label>
  );
}

function Button({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button className={styles.btn} type="button" onClick={onClick}>
      {children}
    </button>
  );
}
