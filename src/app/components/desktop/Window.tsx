'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';
import styles from './styles.module.css';

export type Point = { x: number; y: number };

type Props = {
  title: string;
  /** top-left corner in px; null = not placed yet (mobile, or before first layout) */
  pos: Point | null;
  width: number;
  z: number;
  focused: boolean;
  onFocus: () => void;
  onMove: (p: Point) => void;
  onClose: () => void;
  /** show a corner handle that changes the width (content decides the height) */
  onResize?: (width: number) => void;
  minWidth?: number;
  children: ReactNode;
};

/** A desktop window: drag it by the title bar, click to bring it forward. */
export default function Window({
  title,
  pos,
  width,
  z,
  focused,
  onFocus,
  onMove,
  onClose,
  onResize,
  minWidth = 220,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  /** Pointer-captured gesture on `el`: calls onMove for each move until release. */
  const track = (el: HTMLElement, ev: React.PointerEvent, onMovePointer: (e: PointerEvent) => void) => {
    el.setPointerCapture(ev.pointerId);
    const up = () => {
      el.removeEventListener('pointermove', onMovePointer);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', onMovePointer);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  const startResize = (ev: React.PointerEvent) => {
    if (!pos || !onResize) return;
    const handle = ev.currentTarget as HTMLElement;
    const bounds = (ref.current!.offsetParent as HTMLElement).getBoundingClientRect();
    const startX = ev.clientX;
    const startWidth = ref.current!.offsetWidth;
    const maxWidth = bounds.width - pos.x - 16;
    track(handle, ev, (e) => onResize(Math.round(Math.min(Math.max(startWidth + e.clientX - startX, minWidth), maxWidth))));
  };

  const startDrag = (ev: React.PointerEvent) => {
    if (!pos || (ev.target as HTMLElement).closest('button')) return;
    const el = ref.current!;
    const parent = el.offsetParent as HTMLElement;
    const bounds = parent.getBoundingClientRect();
    const offset = { x: ev.clientX - bounds.left - pos.x, y: ev.clientY - bounds.top - pos.y };
    track(el, ev, (e) => {
      // keep at least the title bar on screen
      const x = Math.min(Math.max(e.clientX - bounds.left - offset.x, 40 - el.offsetWidth), bounds.width - 40);
      const y = Math.min(Math.max(e.clientY - bounds.top - offset.y, 0), bounds.height - 36);
      onMove({ x, y });
    });
  };

  const style: CSSProperties = pos
    ? {
        left: pos.x,
        top: pos.y,
        width: `min(${width}px, calc(100% - 32px))`,
        // a fixed cap, so dragging toward the bottom moves the window instead of squashing it
        maxHeight: 'calc(100% - 48px)',
        zIndex: z,
      }
    : { zIndex: z };

  return (
    <section
      ref={ref}
      aria-label={title}
      className={`${styles.window} ${pos ? styles.placed : ''} ${focused ? styles.focused : ''}`}
      style={style}
      onPointerDown={onFocus}
    >
      <header className={styles.bar} onPointerDown={startDrag}>
        <span className={styles.barTitle} data-nosnippet="">
          {title}
        </span>
        <button type="button" className={styles.close} onClick={onClose} aria-label={`Cerrar ${title}`}>
          ×
        </button>
      </header>
      <div className={styles.body}>{children}</div>
      {onResize && pos && (
        <span
          className={styles.resize}
          onPointerDown={startResize}
          role="separator"
          aria-label={`Cambiar el tamaño de ${title}`}
        />
      )}
    </section>
  );
}
