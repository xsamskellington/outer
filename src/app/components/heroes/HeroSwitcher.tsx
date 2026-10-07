'use client';

import { useEffect, useState } from 'react';
import { HEROES } from '.';
import styles from './switcher.module.css';

type HeroId = (typeof HEROES)[number]['id'];

/** Preview-only: lets you flip between hero options. Remember with ?hero=<id>. */
export default function HeroSwitcher() {
  const [id, setId] = useState<HeroId>(HEROES[0].id);

  useEffect(() => {
    const fromUrl = new URLSearchParams(location.search).get('hero');
    if (HEROES.some((h) => h.id === fromUrl)) setId(fromUrl as HeroId);
  }, []);

  const choose = (next: HeroId) => {
    setId(next);
    const url = new URL(location.href);
    url.searchParams.set('hero', next);
    history.replaceState(null, '', url);
  };

  const { Component } = HEROES.find((h) => h.id === id)!;

  return (
    <>
      <Component key={id} />
      <div className={styles.switcher} role="radiogroup" aria-label="Opción de portada">
        <span className={styles.label}>Portada</span>
        {HEROES.map((h, i) => (
          <button
            key={h.id}
            type="button"
            role="radio"
            aria-checked={h.id === id}
            className={h.id === id ? styles.active : styles.option}
            onClick={() => choose(h.id)}
            title={h.label}
          >
            {i + 1}. {h.label}
          </button>
        ))}
      </div>
    </>
  );
}
