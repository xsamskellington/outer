'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ASCII_SLIDERS,
  DEFAULTS,
  DIRECTIONS,
  FORMATS,
  MODES,
  MOTION_SLIDERS,
  PALETTES,
  PALETTE_NAMES,
  PRESET_APP,
  SETS,
  TEXTURE_SLIDERS,
  clampChars,
  parsePreset,
  randomize,
  type SliderSpec,
  type State,
} from './config';
import { createCpuRenderer, createGpuRenderer, type Renderer } from './renderer';
import styles from './ascii-flow.module.css';

const TARGET_FPS = 30;
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

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function AsciiFlow() {
  const [state, setState] = useState<State>(DEFAULTS);
  const [paused, setPaused] = useState(false);
  const [panel, setPanel] = useState<PanelState>('auto');
  const [toast, setToast] = useState('');
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const uiVisible = panel === 'auto' ? !isMobile : panel === 'shown';

  const viewRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // The render loop reads these refs, so React re-renders never restart it.
  const stateRef = useRef(state);
  const pausedRef = useRef(paused);
  const timeRef = useRef(0);
  const dirtyRef = useRef(true);
  const sizeRef = useRef({ W: 1, H: 1 });
  const rendererRef = useRef<Renderer | null>(null);
  /** draws immediately (used by the PNG capture) */
  const renderNow = useRef<() => void>(() => {});
  stateRef.current = state;
  pausedRef.current = paused;

  const showToast = useCallback((msg: string, ms = 3500) => {
    setToast(msg);
    if (ms) window.setTimeout(() => setToast((t) => (t === msg ? '' : t)), ms);
  }, []);

  const update = useCallback((patch: Partial<State>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  /** Fit the canvas to the view (or to the chosen aspect ratio). */
  const resize = useCallback(() => {
    const view = viewRef.current;
    const canvas = canvasRef.current;
    if (!view || !canvas) return;
    let w = view.clientWidth;
    let h = view.clientHeight;
    const format = stateRef.current.format;
    if (format !== 'AUTO') {
      const [a, b] = format.split(':').map(Number);
      const ratio = a / b;
      if (w / h > ratio) w = h * ratio;
      else h = w / ratio;
    }
    w = Math.max(1, Math.floor(w));
    h = Math.max(1, Math.floor(h));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const { W, H } = sizeRef.current;
    if (W !== w || H !== h || canvas.width !== Math.floor(w * dpr)) {
      sizeRef.current = { W: w, H: h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      dirtyRef.current = true;
    }
  }, []);

  // Any setting change → redraw (and refit: size/format change the canvas).
  useEffect(() => {
    dirtyRef.current = true;
    resize();
  }, [state, uiVisible, resize]);

  // Renderer + loop.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const view = viewRef.current!;
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    const makeRenderer = (): Renderer | null => {
      if (gl) {
        try {
          return createGpuRenderer(canvas, gl);
        } catch (error) {
          console.error('WebGL initialization failed', error);
          showToast('No se pudo iniciar WebGL. Revisá la aceleracion de hardware.', 0);
          return null;
        }
      }
      const ctx = canvas.getContext('2d', { alpha: false });
      return ctx ? createCpuRenderer(canvas, ctx) : null;
    };
    rendererRef.current = makeRenderer();

    const onLost = (e: Event) => {
      e.preventDefault();
      showToast('GPU pausada. Esperando recuperacion…', 0);
    };
    const onRestored = () => {
      rendererRef.current = makeRenderer();
      setToast('');
      dirtyRef.current = true;
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    const ro = new ResizeObserver(resize);
    ro.observe(view);
    resize();

    let last = 0;
    let renderStamp = 0;
    let frames = 0;
    let fps = 0;
    let fpsT = 0;
    let frameId = 0;

    const render = () => {
      const r = rendererRef.current;
      if (!r) return;
      const s = stateRef.current;
      const { W, H } = sizeRef.current;
      const { cols, rows, gpu } = r.draw({ state: s, time: timeRef.current, W, H });
      if (hudRef.current) {
        hudRef.current.textContent = `${cols} × ${rows} CELLS / ${fps} FPS / ${gpu ? 'GPU / ' : ''}${s.mode} / ${s.palette}`;
      }
    };
    renderNow.current = render;

    // Capped at 30fps and only when something changed, like the original.
    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick);
      if (document.hidden) {
        last = 0;
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      const s = stateRef.current;
      if (!pausedRef.current && s.speed > 0) {
        timeRef.current += dt * s.speed;
        dirtyRef.current = true;
      }
      const interval = 1000 / TARGET_FPS;
      if (dirtyRef.current && now - renderStamp >= interval - 0.5) {
        renderStamp += Math.max(1, Math.floor((now - renderStamp + 0.5) / interval)) * interval;
        render();
        dirtyRef.current = false;
        frames++;
      }
      if (now - fpsT > 1000) {
        fps = Math.round((frames * 1000) / (now - fpsT));
        frames = 0;
        fpsT = now;
      }
    };
    const onVisibility = () => {
      last = 0;
      renderStamp = 0;
      dirtyRef.current = true;
    };
    document.addEventListener('visibilitychange', onVisibility);
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [resize, showToast]);

  /* ---------- actions ---------- */

  const doRandom = useCallback(() => setState((s) => randomize(s)), []);
  const togglePause = useCallback(() => setPaused((p) => !p), []);
  const toggleUI = useCallback(() => setPanel(uiVisible ? 'hidden' : 'shown'), [uiVisible]);

  const reset = () => {
    setState(DEFAULTS);
    timeRef.current = 0;
  };

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await viewRef.current?.requestFullscreen();
    } catch {
      showToast('Fullscreen no disponible en este navegador.');
    }
  }, [showToast]);

  const capture = () => {
    // drawing buffer isn't preserved: draw, then snapshot in the same task
    renderNow.current();
    canvasRef.current?.toBlob((blob) => {
      if (blob) download(blob, `outer-ascii-${state.mode.toLowerCase()}-${Date.now()}.png`);
    }, 'image/png');
  };

  const savePreset = () =>
    download(
      new Blob([JSON.stringify({ app: PRESET_APP, version: 1, state }, null, 2)], { type: 'application/json' }),
      'outer-ascii-preset.json',
    );

  const loadPreset = async (file: File | undefined) => {
    if (!file) return;
    try {
      setState(parsePreset(JSON.parse(await file.text())));
      timeRef.current = 0;
      showToast('PRESET CARGADO');
    } catch {
      showToast('No se pudo leer este preset.');
    }
  };

  // Keyboard: R random · F fullscreen · H UI · Space pause (not while typing or on a button).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag) || e.ctrlKey || e.metaKey) return;
      const k = e.key.toLowerCase();
      const action = k === 'r' ? doRandom : k === 'f' ? toggleFullscreen : k === 'h' ? toggleUI : k === ' ' ? togglePause : null;
      if (action) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doRandom, toggleFullscreen, toggleUI, togglePause]);

  // Mobile, like the other lab tools: a quick tap on the texture closes the controls.
  const tap = useRef<{ x: number; y: number; at: number } | null>(null);
  const onViewPointerDown = (e: React.PointerEvent) => {
    tap.current = e.isPrimary ? { x: e.clientX, y: e.clientY, at: performance.now() } : null;
  };
  const onViewPointerUp = (e: React.PointerEvent) => {
    const t = tap.current;
    tap.current = null;
    if (!t || !isMobile || !uiVisible || (e.target as HTMLElement).closest('button')) return;
    if (Math.hypot(e.clientX - t.x, e.clientY - t.y) < 10 && performance.now() - t.at < 350) setPanel('hidden');
  };

  /* ---------- render ---------- */

  const sliders = (specs: SliderSpec[]) =>
    specs.map((spec) => (
      <Slider key={spec.key} spec={spec} value={state[spec.key]} onChange={(v) => update({ [spec.key]: v })} />
    ));

  return (
    <div className={`${styles.root} ${PANEL_CLASS[panel]}`}>
      <main
        ref={viewRef}
        className={styles.view}
        onPointerDown={onViewPointerDown}
        onPointerUp={onViewPointerUp}
        onPointerCancel={() => (tap.current = null)}
      >
        <canvas ref={canvasRef} className={styles.canvas} />
        <div className={styles.live}>
          <b>●</b> LIVE / ASCII TEXTURE
        </div>
        <div className={styles.toolbar}>
          <Button onClick={toggleFullscreen}>FULLSCREEN</Button>
          <Button onClick={toggleUI}>{uiVisible ? 'HIDE UI' : 'SHOW UI'}</Button>
        </div>
        <div className={styles.toast} role="status">
          {toast}
        </div>
        <div ref={hudRef} className={styles.hud} />
        <div className={styles.hotkeyHint} aria-label="Atajos de teclado">
          <span>
            <kbd>H</kbd> ocultar / mostrar controles
          </span>
          <span>
            <kbd>F</kbd> pantalla completa
          </span>
          <span>
            <kbd>ESPACIO</kbd> pausa <span className={styles.hintSeparator}>·</span> <kbd>R</kbd> random
          </span>
        </div>
      </main>

      <aside className={styles.sidebar}>
        <h1 className={styles.title}>
          ASCII FLOW <span className={styles.version}>v1.5</span>
        </h1>
        <div className={styles.sub}>OUTER / PROCEDURAL TEXTURES</div>
        <div className={`${styles.grid} ${styles.two} ${styles.spaced}`}>
          <Button onClick={doRandom}>⚄ RANDOM</Button>
          <Button onClick={reset}>RESET</Button>
        </div>

        <h2 className={styles.section}>01 / TEXTURA</h2>
        <div className={styles.grid}>
          {MODES.map((m) => (
            <Button key={m} active={state.mode === m} onClick={() => update({ mode: m })}>
              {m}
            </Button>
          ))}
        </div>
        {sliders(TEXTURE_SLIDERS)}

        <h2 className={styles.section}>02 / MOVIMIENTO</h2>
        {sliders(MOTION_SLIDERS)}
        <label className={styles.label}>DIRECCION</label>
        <div className={`${styles.grid} ${styles.four}`}>
          {DIRECTIONS.map((d) => (
            <Button key={d.value} active={state.angle === d.value} onClick={() => update({ angle: d.value })}>
              {d.label}
            </Button>
          ))}
        </div>
        <div className={`${styles.grid} ${styles.two} ${styles.spaced}`}>
          <Button active={state.rotate} onClick={() => update({ rotate: !state.rotate })}>
            ROTACION: {state.rotate ? 'ON' : 'OFF'}
          </Button>
          <Button active={state.pulse} onClick={() => update({ pulse: !state.pulse })}>
            PULSO: {state.pulse ? 'ON' : 'OFF'}
          </Button>
        </div>

        <h2 className={styles.section}>03 / ASCII</h2>
        {sliders(ASCII_SLIDERS)}
        <div className={`${styles.grid} ${styles.spaced}`}>
          {Object.entries(SETS).map(([name, chars]) => (
            <Button key={name} active={state.chars === chars} onClick={() => update({ chars })}>
              {name}
            </Button>
          ))}
        </div>
        <label className={styles.label} htmlFor="ascii-flow-chars">
          CARACTERES / EDITABLES
        </label>
        <input
          id="ascii-flow-chars"
          className={styles.text}
          type="text"
          spellCheck={false}
          aria-label="Caracteres ASCII"
          value={state.chars}
          onChange={(e) => update({ chars: clampChars(e.target.value) || ' ' })}
        />
        <div className={`${styles.grid} ${styles.two} ${styles.spaced}`}>
          <Button active={state.invert} onClick={() => update({ invert: !state.invert })}>
            INVERTIR: {state.invert ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={() => update({ colorMode: state.colorMode === 'BANDAS' ? 'LUZ' : 'BANDAS' })}>
            COLOR: {state.colorMode}
          </Button>
        </div>

        <h2 className={styles.section}>04 / COLOR</h2>
        {PALETTE_NAMES.map((name) => (
          <Button
            key={name}
            className={styles.palette}
            active={state.palette === name}
            onClick={() => update({ palette: name })}
          >
            <span>{name}</span>
            <span className={styles.swatches}>
              {PALETTES[name].map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </span>
          </Button>
        ))}
        <label className={styles.label}>
          FONDO
          <input
            className={styles.color}
            type="color"
            value={state.bg}
            onChange={(e) => update({ bg: e.target.value })}
          />
        </label>

        <h2 className={styles.section}>05 / SALIDA</h2>
        <div className={styles.grid}>
          {FORMATS.map((f) => (
            <Button key={f} active={state.format === f} onClick={() => update({ format: f })}>
              {f}
            </Button>
          ))}
        </div>
        <div className={`${styles.grid} ${styles.two} ${styles.spaced}`}>
          <Button active={paused} onClick={togglePause}>
            {paused ? 'PLAY' : 'PAUSA'}
          </Button>
          <Button onClick={capture}>CAPTURA PNG</Button>
        </div>
        <div className={`${styles.grid} ${styles.two} ${styles.spaced}`}>
          <Button onClick={savePreset}>GUARDAR PRESET</Button>
          <Button onClick={() => fileRef.current?.click()}>CARGAR PRESET</Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            loadPreset(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <p className={styles.note}>
          Espacio pausa · R random · F fullscreen · H interfaz
          <br />
          PNG exporta solo la textura, sin controles.
        </p>
        <footer className={styles.footer}>
          <a href="https://www.instagram.com/mati.mast/" target="_blank" rel="noopener noreferrer">
            by Mati Mast · @mati.mast ↗
          </a>
          <br />
          <a href="https://outer313.com" target="_blank" rel="noopener noreferrer">
            outer313.com ↗
          </a>
        </footer>
      </aside>
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
  active,
  className = '',
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`${styles.btn} ${active ? styles.active : ''} ${className}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Slider({ spec, value, onChange }: { spec: SliderSpec; value: number; onChange: (v: number) => void }) {
  const id = `ascii-flow-${spec.key}`;
  return (
    <>
      <label className={styles.label} htmlFor={id}>
        {spec.label}
        <output className={styles.output}>{value.toFixed(spec.key === 'size' ? 0 : 2)}</output>
      </label>
      <input
        id={id}
        className={styles.range}
        type="range"
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value}
        aria-label={spec.label}
        onChange={(e) => onChange(+e.target.value)}
      />
    </>
  );
}
