'use client';
import './styles.css';
import { useState } from 'react';

const Content = () => {
  const [clickedLink, setClickedLink] = useState(null);

  const handleClick = (index: any) => {
    setClickedLink(index);
  };

  return (
    <div className="text-container">
      <div className="text-content">
        <div className="text-info">
          <p>
            Somos un estudio y laboratorio creativo que explora y habita las
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
                onClick={() => handleClick(1)}
                style={{ color: clickedLink === 1 ? '#fe4141' : '#6bf82c' }}
              >
                Misántropo
              </a>
              ,{' '}
              <a
                href="https://www.imdb.com/title/tt21995284/?ref_=fn_al_tt_1"
                target="_blank"
                onClick={() => handleClick(2)}
                style={{ color: clickedLink === 2 ? '#fe4141' : '#6bf82c' }}
              >
                Weak Rangers
              </a>
              ,{'  '}
              <a
                href="https://www.imdb.com/title/tt1408101/?ref_=nv_sr_srsg_0_tt_8_nm_0_in_0_q_star%2520trek%2520into"
                target="_blank"
                onClick={() => handleClick(3)}
                style={{ color: clickedLink === 3 ? '#fe4141' : '#6bf82c' }}
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
              <a
                href="https://www.imdb.com/title/tt13244092/"
                target="_blank"
                onClick={() => handleClick(4)}
                style={{ color: clickedLink === 4 ? '#fe4141' : '#6bf82c' }}
              >
                Carmel
              </a>
              ,{' '}
              <a
                href="https://www.imdb.com/title/tt13587032/"
                target="_blank"
                onClick={() => handleClick(5)}
                style={{ color: clickedLink === 5 ? '#fe4141' : '#6bf82c' }}
              >
                Iosi
              </a>
              ,{' '}
              <a
                href="https://www.youtube.com/watch?app=desktop&v=Sipqpaqnl5k&ab_channel=Mart%C3%ADnGarabal"
                target="_blank"
                onClick={() => handleClick(6)}
                style={{ color: clickedLink === 6 ? '#fe4141' : '#6bf82c' }}
              >
                Famoso
              </a>
              ,&nbsp;
              <a
                href="https://www.imdb.com/title/tt26451138/"
                target="_blank"
                onClick={() => handleClick(7)}
                style={{ color: clickedLink === 7 ? '#fe4141' : '#6bf82c' }}
              >
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
                onClick={() => handleClick(8)}
                style={{ color: clickedLink === 8 ? '#fe4141' : '#6bf82c' }}
              >
                Ouke
              </a>
              ,&nbsp;
              <a
                href="https://www.youtube.com/watch?v=V5y2u2B0sTA&ab_channel=MILOJ"
                target="_blank"
                onClick={() => handleClick(9)}
                style={{ color: clickedLink === 9 ? '#fe4141' : '#6bf82c' }}
              >
                Digan
              </a>
              ,&nbsp;
              <a
                href="https://www.youtube.com/watch?v=kh1sF-sbkbw&ab_channel=nickinicole"
                target="_blank"
                onClick={() => handleClick(10)}
                style={{ color: clickedLink === 10 ? '#fe4141' : '#6bf82c' }}
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
                onClick={() => handleClick(11)}
                style={{ color: clickedLink === 11 ? '#fe4141' : '#6bf82c' }}
              >
                Nite-Lite
              </a>
              ,{' '}
              <a
                href="https://www.newtro.xyz/"
                target="_blank"
                onClick={() => handleClick(12)}
                style={{ color: clickedLink === 12 ? '#fe4141' : '#6bf82c' }}
              >
                Newtro Arts
              </a>
              &nbsp;&nbsp;]
            </span>
          </p>
        </div>

        <div className="text-info">
          <p>
            Estos son los últimos proyectos en los que colaboramos{' '}
            <span className="data">
              [&nbsp;&nbsp;
              <a
                href="https://www.youtube.com/watch?v=zYc1qMe_kpc&ab_channel=CA7RIEL%26PACOAMOROSO"
                target="_blank"
                onClick={() => handleClick(13)}
                style={{ color: clickedLink === 13 ? '#fe4141' : '#6bf82c' }}
              >
                Ca7riel y Paco Amoroso - Papota
              </a>
              ,{' '}
              <span className="mobile-break">
                <br></br>
              </span>
              <a
                href="https://www.youtube.com/watch?v=alJS56V2g64&pp=ygUNZWxzYSB5IGVsIG1hcg%3D%3D"
                target="_blank"
                onClick={() => handleClick(14)}
                style={{ color: clickedLink === 14 ? '#fe4141' : '#6bf82c' }}
              >
                Elsa y Elmar - Drogada de Emociones
              </a>
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
              onClick={() => handleClick(12)}
              style={{ color: clickedLink === 12 ? '#fe4141' : '#6bf82c' }}
            >
              mail
            </a>{' '}
            o{' '}
            <a
              href="https://www.instagram.com/outer_313/"
              target="_blank"
              onClick={() => handleClick(13)}
              style={{ color: clickedLink === 13 ? '#fe4141' : '#6bf82c' }}
            >
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
