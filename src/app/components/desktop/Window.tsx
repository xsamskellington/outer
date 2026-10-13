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
  children: ReactNode;
};

/** A desktop window: drag it by the title bar, click to bring it forward. */
export default function Window({ title, pos, width, z, focused, onFocus, onMove, onClose, children }: Props) {
  const ref = useRef<HTMLElement>(null);

  const startDrag = (ev: React.PointerEvent) => {
    if (!pos || (ev.target as HTMLElement).closest('button')) return;
    const el = ref.current!;
    const parent = el.offsetParent as HTMLElement;
    const bounds = parent.getBoundingClientRect();
    const offset = { x: ev.clientX - bounds.left - pos.x, y: ev.clientY - bounds.top - pos.y };
    el.setPointerCapture(ev.pointerId);

    const move = (e: PointerEvent) => {
      // keep at least the title bar on screen
      const x = Math.min(Math.max(e.clientX - bounds.left - offset.x, 40 - el.offsetWidth), bounds.width - 40);
      const y = Math.min(Math.max(e.clientY - bounds.top - offset.y, 0), bounds.height - 36);
      onMove({ x, y });
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  const style: CSSProperties = pos
    ? {
        left: pos.x,
        top: pos.y,
        width: `min(${width}px, calc(100% - 32px))`,
        // never past the bottom edge; the body scrolls instead
        maxHeight: `calc(100% - ${Math.round(pos.y) + 16}px)`,
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
        <span className={styles.barTitle}>{title}</span>
        <button type="button" className={styles.close} onClick={onClose} aria-label={`Cerrar ${title}`}>
          ×
        </button>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
