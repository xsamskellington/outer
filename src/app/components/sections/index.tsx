'use client';

import { useCallback, useEffect, useState } from 'react';
import Works from '../works';
import Lab from '../lab';
import About from '../about';
import { CONTENT_ID, useSection } from './useSection';
import styles from './styles.module.css';

/** Shows one section at a time; the others are unmounted (Lab previews stop too). */
export default function Sections() {
  const section = useSection();
  // Lives here so it survives switching sections, but not a reload.
  const [clicked, setClicked] = useState<ReadonlySet<string>>(() => new Set());
  const onOpen = useCallback((url: string) => setClicked((s) => new Set(s).add(url)), []);

  // Arriving with a hash (e.g. outer313.com/#lab): jump to the content.
  useEffect(() => {
    if (location.hash) document.getElementById(CONTENT_ID)?.scrollIntoView({ block: 'start' });
  }, []);

  return (
    <div id={CONTENT_ID} className={styles.content}>
      <div key={section} className={styles.view}>
        {section === 'trabajos' && <Works clicked={clicked} onOpen={onOpen} />}
        {section === 'lab' && <Lab />}
        {section === 'about' && <About />}
      </div>
    </div>
  );
}
