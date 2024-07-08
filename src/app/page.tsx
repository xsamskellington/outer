import './styles.css';

export default function Home() {
  return (
    <div className="container">
      <video
        width="600"
        autoPlay
        loop
        muted
        playsInline
        style={{ display: 'block' }}
      >
        <source src="/video/vhs_outer.MP4" type="video/mp4" />
        Tu navegador no soporta el elemento de video.
      </video>
    </div>
  );
}
