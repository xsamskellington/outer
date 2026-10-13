import styles from './styles.module.css';

const CONTACT = [
  { label: 'Mail', value: 'hola@outer313.com', href: 'mailto:hola@outer313.com?subject=Hola Outers!' },
  { label: 'Instagram', value: '@outer_313', href: 'https://www.instagram.com/outer_313/' },
];

const About = () => (
  <section className={styles.section}>
    <h2 className={styles.heading}>About</h2>
    <p className={styles.statement}>
      Somos un estudio y laboratorio creativo que explora y habita las fronteras entre la tek y el arte.
    </p>

    <h3 className={styles.subheading}>Contacto</h3>
    <ul className={styles.list}>
      {CONTACT.map((c) => (
        <li key={c.label}>
          <a
            className={styles.row}
            href={c.href}
            {...(c.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            <span className={styles.label}>{c.label}</span>
            <span className={styles.value}>{c.value}</span>
            <span className={styles.arrow} aria-hidden="true">
              ↗
            </span>
          </a>
        </li>
      ))}
    </ul>
  </section>
);

export default About;
