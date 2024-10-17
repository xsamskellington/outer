'use client';
import './styles.css';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Content from './components/content';

export default function Home() {
  const [deviceMobile, setDeviceMobile] = useState(false);

  useEffect(() => {
    const isMobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 1120px)').matches;

    if (isMobile) {
      setDeviceMobile(true);
    }
  }, []);

  return (
    <div className="container">
      <div className="logo">
        <Image
          src="./outer_logo_blanco.svg"
          alt="logo"
          width={280}
          height={deviceMobile ? 140 : 250}
        />
      </div>
      <Content />
    </div>
  );
}
