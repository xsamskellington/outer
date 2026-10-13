'use client';

import { SECTIONS, goToSection, useSection } from '../sections/useSection';
import styles from './styles.module.css';

/** Section switcher; sits under the hero and sticks to the top while scrolling. */
const Nav = () => {
  const section = useSection();
  return (
    <nav className={styles.nav}>
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={s.id === section ? styles.active : undefined}
          aria-current={s.id === section ? 'page' : undefined}
          onClick={(ev) => {
            ev.preventDefault();
            goToSection(s.id);
          }}
        >
          {s.label} ↓
        </a>
      ))}
    </nav>
  );
};

export default Nav;
