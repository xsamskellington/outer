import './styles.css';

const Content = () => {
  return (
    <div className="text-container">
      <div className="text-content">
        <div className="text-info">
          <p>
            Somos un estudio y laboratorio creativo que explora (y habita) las
            fronteras entre la tek y el arte.
          </p>
        </div>
        <div className="text-info">
          <p>
            Hicimos efectos visuales para cine{' '}
            <span className="data">
              [&nbsp;&nbsp;
              <a
                href="https://www.imdb.com/title/tt10275534/?ref_=fn_al_tt_1"
                target="_blank"
              >
                Misántropo
              </a>
              ,{' '}
              <a
                href="https://www.imdb.com/title/tt21995284/?ref_=fn_al_tt_1"
                target="_blank"
              >
                Weak Rangers
              </a>
              ,{'  '}
              <a
                href="https://www.imdb.com/title/tt1408101/?ref_=nv_sr_srsg_0_tt_8_nm_0_in_0_q_star%2520trek%2520into"
                target="_blank"
              >
                Star Trek Into Darkness
              </a>
              &nbsp;&nbsp;]
            </span>
          </p>
          <p>
            para series{' '}
            <span className="data">
              [&nbsp;&nbsp;
              <a href="https://www.imdb.com/title/tt13244092/" target="_blank">
                Carmel
              </a>
              ,{' '}
              <a href="https://www.imdb.com/title/tt13587032/" target="_blank">
                Iosi
              </a>
              ,{' '}
              <a
                href="https://www.youtube.com/watch?app=desktop&v=Sipqpaqnl5k&ab_channel=Mart%C3%ADnGarabal"
                target="_blank"
              >
                Famoso
              </a>
              ,&nbsp;
              <a href="https://www.imdb.com/title/tt26451138/" target="_blank">
                Division Palermo
              </a>
              &nbsp;&nbsp;]
            </span>
          </p>
          <p>
            y videoclips
            <span className="data">
              [&nbsp;&nbsp;
              <a
                href="https://www.youtube.com/watch?v=7LIERMc27-Q&ab_channel=CA7RIEL%26PACOAMOROSO"
                target="_blank"
              >
                Ouke
              </a>
              ,&nbsp;
              <a
                href="https://www.youtube.com/watch?v=V5y2u2B0sTA&ab_channel=MILOJ"
                target="_blank"
              >
                Digan
              </a>
              ,&nbsp;
              <a
                href="https://www.youtube.com/watch?v=kh1sF-sbkbw&ab_channel=nickinicole"
                target="_blank"
              >
                Colocao
              </a>
              &nbsp;&nbsp;]
            </span>
          </p>
        </div>
        <div className="text-info">
          <p>
            También hacemos instalaciones audiovisuales{' '}
            <span className="data">
              [&nbsp;&nbsp;
              <a
                href="https://www.instagram.com/niteliteclub/?hl=en"
                target="_blank"
              >
                Nite-Lite
              </a>
              , <a>Estados Correlacionados</a>, <a>Acción Fungi</a>
              &nbsp;&nbsp;]
            </span>
          </p>
        </div>
        <div className="about-us">
          <p>
            Escribinos por{' '}
            <a
              href="mailto:hola@outer313.com?subject=Hola Outers!"
              target="_blank"
            >
              mail
            </a>{' '}
            o{' '}
            <a href="https://www.instagram.com/outer_313/" target="_blank">
              instagram
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Content;
