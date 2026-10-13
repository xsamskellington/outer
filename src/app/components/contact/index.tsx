import styles from './styles.module.css';

const Contact = () => (
  <footer id="contacto" className={styles.contact}>
    <p>
      Escribinos por <a href="mailto:hola@outer313.com?subject=Hola Outers!">mail</a> o{' '}
      <a href="https://www.instagram.com/outer_313/" target="_blank" rel="noopener noreferrer">
        instagram
      </a>
      .
    </p>
  </footer>
);

export default Contact;
