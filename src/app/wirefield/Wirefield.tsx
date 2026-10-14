'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ADD_COLORS,
  DEFAULT_GLOBALS,
  DISTRIBUTIONS,
  EMITTER_SLIDERS,
  FACE_SLIDERS,
  GLOBAL_SLIDERS,
  INITIAL_EMITTERS,
  MAX_EMITTERS,
  PLEX_MODES,
  PLEX_SLIDERS,
  SHAPES,
  formatValue,
  makeEmitter,
  pick,
  randomEmitter,
  randomGlobals,
  type Distribution,
  type EmitterParams,
  type GlobalParams,
  type NumericEmitterKey,
  type PlexMode,
  type Shape,
  type SliderSpec,
} from './config';
import { CLASSIC_MOODS, PLEXUS_MOODS, PRESET_OPTIONS, PRESET_SETS } from './presets';
import type { WirefieldEngine } from './engine';
import styles from './wirefield.module.css';

const MOBILE_QUERY = '(max-width: 700px)';
const PRESET_ORDER = PRESET_OPTIONS.map((o) => o.index);

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

export default function Wirefield() {
  const [emitters, setEmitters] = useState<EmitterParams[]>(INITIAL_EMITTERS);
  const [globals, setGlobals] = useState<GlobalParams>(DEFAULT_GLOBALS);
  const [selected, setSelected] = useState(0);
  const [preset, setPreset] = useState(0);
  const [paused, setPaused] = useState(false);
  const [orbit, setOrbit] = useState(false);
  const [fpsOn, setFpsOn] = useState(false);
  const [fps, setFps] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(true);
  const [panel, setPanel] = useState<PanelState>('auto');
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const uiVisible = panel === 'auto' ? !isMobile : panel === 'shown';
  /** bumps once the engine has loaded, so the sync effects below re-run */
  const [ready, setReady] = useState(0);

  const viewRef = useRef<HTMLElement>(null);
  const engineRef = useRef<WirefieldEngine | null>(null);
  const current = emitters[selected] ?? emitters[0];

  // Engine lifecycle. three.js is loaded on the client only.
  useEffect(() => {
    let disposed = false;
    import('./engine').then(({ WirefieldEngine }) => {
      if (disposed || !viewRef.current) return;
      const coarse = matchMedia('(pointer: coarse)').matches;
      engineRef.current = new WirefieldEngine(viewRef.current, {
        maxPixelRatio: coarse ? 1.5 : 2,
        onFps: setFps,
      });
      setReady((r) => r + 1);
    });
    setCanFullscreen(!!document.fullscreenEnabled);
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      disposed = true;
      document.removeEventListener('fullscreenchange', onFs);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Push UI state into the engine.
  useEffect(() => engineRef.current?.setEmitters(emitters), [emitters, ready]);
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.globals = globals;
    engine.paused = paused;
    engine.orbit = orbit;
    engine.fpsEnabled = fpsOn;
  }, [globals, paused, orbit, fpsOn, ready]);

  // The viewport changes width when the panel shows/hides; refit right away.
  useEffect(() => {
    engineRef.current?.resize();
  }, [uiVisible]);

  /* ---------- actions ---------- */

  const updateCurrent = (patch: Partial<EmitterParams>) =>
    setEmitters((list) => list.map((e, i) => (i === selected ? { ...e, ...patch } : e)));

  const randomize = useCallback(() => {
    setEmitters((list) => list.map(() => randomEmitter()));
    setGlobals(randomGlobals());
  }, []);

  const loadPreset = (index: number) => {
    setPreset(index);
    setEmitters(PRESET_SETS[index % PRESET_SETS.length].slice(0, MAX_EMITTERS).map((cfg) => makeEmitter(cfg)));
    const mood = index >= 12 ? PLEXUS_MOODS[index - 12] : CLASSIC_MOODS[index];
    if (mood) setGlobals(mood);
    setSelected(0);
  };

  const nextPreset = () => loadPreset(PRESET_ORDER[(PRESET_ORDER.indexOf(preset) + 1) % PRESET_ORDER.length]);

  const addEmitter = () => {
    if (emitters.length >= MAX_EMITTERS) return;
    setEmitters([...emitters, makeEmitter({ color: pick(ADD_COLORS) })]);
    setSelected(emitters.length);
  };

  const removeEmitter = () => {
    if (emitters.length === 1) return;
    setEmitters(emitters.filter((_, i) => i !== selected));
    setSelected(Math.max(0, selected - 1));
  };

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  const toggleFps = () => {
    setFpsOn((on) => !on);
    setFps(null);
  };

  const screenshot = () => {
    const url = engineRef.current?.screenshot();
    if (!url) return;
    const a = document.createElement('a');
    a.download = 'wirefield.png';
    a.href = url;
    a.click();
  };

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await viewRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  }, []);

  const toggleUI = useCallback(() => setPanel(uiVisible ? 'hidden' : 'shown'), [uiVisible]);

  // Mobile, like OUTER VJ: a quick tap on the 3D view closes the controls sheet.
  // Drags (orbit) and pinches (zoom) must not, so only short, almost-still single touches count.
  const tap = useRef<{ x: number; y: number; at: number; id: number } | null>(null);
  const onViewPointerDown = (ev: React.PointerEvent) => {
    tap.current = ev.isPrimary ? { x: ev.clientX, y: ev.clientY, at: performance.now(), id: ev.pointerId } : null;
  };
  const onViewPointerUp = (ev: React.PointerEvent) => {
    const t = tap.current;
    tap.current = null;
    if (!t || t.id !== ev.pointerId || !isMobile || !uiVisible) return;
    if ((ev.target as HTMLElement).closest('button')) return;
    const moved = Math.hypot(ev.clientX - t.x, ev.clientY - t.y);
    if (moved < 10 && performance.now() - t.at < 350) setPanel('hidden');
  };

  // Keyboard, with the original's guards: R and Space skip only text/range inputs
  // (so they still work right after picking from a dropdown); H and F also skip selects.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const key = ev.key.toLowerCase();
      if ((ev.target as HTMLElement)?.tagName !== 'INPUT') {
        if (key === 'r') randomize();
        if (ev.code === 'Space') {
          ev.preventDefault();
          togglePause();
        }
      }
      if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '')) {
        if (key === 'h') toggleUI();
        if (key === 'f') toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [randomize, togglePause, toggleUI, toggleFullscreen]);

  /* ---------- render ---------- */

  const emitterSliders = (specs: SliderSpec<NumericEmitterKey>[]) =>
    specs.map((spec) => (
      <Slider
        key={spec.key}
        spec={spec}
        value={current[spec.key]}
        onChange={(v) => updateCurrent({ [spec.key]: v })}
      />
    ));

  return (
    <div className={`${styles.root} ${PANEL_CLASS[panel]}`}>
      <aside className={styles.sidebar}>
        <div className={styles.scroll}>
          <div className={styles.brand}>
            <div className={styles.brandline}>
              <h1 className={styles.title}>WIREFIELD</h1>
              <span className={styles.version}>v2.8</span>
            </div>
            <div className={styles.subtitle}>REALTIME GENERATIVE PARTICLE SYSTEM</div>
          </div>

          <div className={styles.actions}>
            <Button primary onClick={randomize}>
              ⚄ RANDOMIZE
            </Button>
            <Button onClick={nextPreset}>NEXT PRESET</Button>
          </div>

          <div className={styles.presetTools}>
            <label className={styles.presetLabel}>PRESETS / 12 CLASSIC + 12 PLEXUS</label>
            <select
              className={`${styles.select} ${styles.presetSelect}`}
              value={preset}
              onChange={(ev) => loadPreset(Number(ev.target.value))}
            >
              {PRESET_OPTIONS.map((o) => (
                <option key={o.index} value={o.index}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className={styles.actions}>
              <Button onClick={() => loadPreset(preset)}>LOAD SELECTED</Button>
            </div>
          </div>

          <SectionTitle>EMISORES</SectionTitle>
          <div className={styles.emitters}>
            {emitters.map((e, i) => (
              <Button key={e.id} active={i === selected} onClick={() => setSelected(i)}>
                E{i + 1}
              </Button>
            ))}
          </div>
          <div className={styles.actions}>
            <Button onClick={addEmitter}>+ EMISOR</Button>
            <Button onClick={removeEmitter}>− ELIMINAR</Button>
          </div>

          <div className={styles.line}>
            <label className={styles.label}>Color</label>
            <input
              className={styles.color}
              type="color"
              value={current.color}
              onChange={(ev) => updateCurrent({ color: ev.target.value })}
            />
          </div>

          <Select
            label="Geometría"
            value={current.shape}
            options={SHAPES}
            onChange={(v) => updateCurrent({ shape: v as Shape })}
          />
          <Select
            label="Distribución"
            value={current.distribution}
            options={DISTRIBUTIONS}
            onChange={(v) => updateCurrent({ distribution: v as Distribution })}
          />
          <Select
            label="EFECTO / EMISOR"
            spaced
            value={current.plexMode}
            options={PLEX_MODES}
            onChange={(v) => updateCurrent({ plexMode: v as PlexMode })}
          />
          <div className={styles.plexControls}>{emitterSliders(PLEX_SLIDERS)}</div>

          <label className={`${styles.label} ${styles.line} ${styles.spaced}`}>
            Superficies trianguladas
            <input
              className={styles.check}
              type="checkbox"
              checked={current.plexFaces}
              onChange={(ev) => updateCurrent({ plexFaces: ev.target.checked })}
            />
          </label>
          {emitterSliders(FACE_SLIDERS)}
          {emitterSliders(EMITTER_SLIDERS)}

          <SectionTitle>COMPORTAMIENTO GLOBAL</SectionTitle>
          {GLOBAL_SLIDERS.map((spec) => (
            <Slider
              key={spec.key}
              spec={spec}
              value={globals[spec.key]}
              onChange={(v) => setGlobals((g) => ({ ...g, [spec.key]: v }))}
            />
          ))}

          <SectionTitle>CÁMARA Y ESCENA</SectionTitle>
          <div className={styles.actions}>
            <Button onClick={() => setOrbit((o) => !o)}>AUTO ORBIT: {orbit ? 'ON' : 'OFF'}</Button>
            <Button onClick={() => engineRef.current?.resetCamera()}>RESET CAM</Button>
          </div>
          <div className={styles.actions}>
            <Button onClick={togglePause}>{paused ? 'PLAY' : 'PAUSE'}</Button>
            <Button onClick={screenshot}>PNG</Button>
          </div>

          <p className={`${styles.hint} ${styles.pointerOnly}`}>
            Arrastrá para orbitar · Rueda para zoom · Click derecho para desplazar.
            <br />
            Teclas: R random · Espacio pausa.
          </p>
          <p className={`${styles.hint} ${styles.touchOnly}`}>
            Arrastrá para orbitar · Pellizcá para zoom · Dos dedos para desplazar.
          </p>
        </div>

        <footer className={styles.footer}>
          <a href="https://www.instagram.com/mati.mast/" target="_blank" rel="noopener noreferrer">
            by Mati Mast · @mati.mast ↗
          </a>
          <a href="https://outer313.com" target="_blank" rel="noopener noreferrer">
            outer313.com ↗
          </a>
        </footer>
      </aside>

      <main
        ref={viewRef}
        className={styles.view}
        onPointerDown={onViewPointerDown}
        onPointerUp={onViewPointerUp}
        // a second finger means pinch-zoom: never treat it as a tap
        onPointerCancel={() => (tap.current = null)}
      >
        <div className={styles.viewportLabel}>
          <b>●</b> LIVE VIEWPORT / 3D
        </div>
        <div className={styles.top}>
          <Button className={styles.topBtn} onClick={toggleFps}>
            FPS: {fpsOn ? 'ON' : 'OFF'}
          </Button>
          {canFullscreen && (
            <Button className={styles.topBtn} onClick={toggleFullscreen}>
              {fullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
            </Button>
          )}
          <Button className={styles.topBtn} onClick={toggleUI}>
            {uiVisible ? 'HIDE UI' : 'SHOW UI'}
          </Button>
        </div>
        {fpsOn && <div className={styles.fps}>{fps ?? '--'} FPS</div>}
        <div className={styles.hud}>
          <span className={styles.pointerOnly}>
            DRAG ORBIT · SCROLL ZOOM · F FULLSCREEN · H UI · SPACE PAUSE · R RANDOM
          </span>
          <span className={styles.touchOnly}>DRAG ORBIT · PINCH ZOOM</span>
        </div>
      </main>
    </div>
  );
}

const PANEL_CLASS: Record<PanelState, string> = {
  auto: '',
  shown: styles.uiShown,
  hidden: styles.uiHidden,
};

/* ---------- UI pieces ---------- */

function Button({
  children,
  onClick,
  primary,
  active,
  className = '',
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  active?: boolean;
  className?: string;
}) {
  const cls = [styles.btn, primary && styles.primary, active && styles.active, className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className={styles.sectionTitle}>{children}</h3>;
}

function Select({
  label,
  spaced,
  value,
  options,
  onChange,
}: {
  label: string;
  spaced?: boolean;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <>
      <label className={`${styles.label} ${spaced ? styles.spaced : ''}`}>{label}</label>
      <select className={styles.select} value={value} onChange={(ev) => onChange(ev.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </>
  );
}

function Slider<K extends string>({
  spec,
  value,
  onChange,
}: {
  spec: SliderSpec<K>;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className={`${styles.label} ${styles.line}`}>
        {spec.label}
        <span className={styles.value}>{formatValue(value, spec.step)}</span>
      </label>
      <input
        className={styles.range}
        type="range"
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value}
        onChange={(ev) => onChange(+ev.target.value)}
      />
    </div>
  );
}
