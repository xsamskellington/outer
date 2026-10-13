import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

/** Shared size/type for every opengraph-image route. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const LOGO = `data:image/svg+xml;base64,${readFileSync(
  join(process.cwd(), 'public/outer_logo_blanco.svg'),
).toString('base64')}`;

// The SVG is 1920x1080 but the wordmark only covers x 35-1875, y 249-828.
const LOGO_WIDTH = 620;
const k = LOGO_WIDTH / 1840;

/** Black card: cropped OUTER wordmark, a green label and a dither strip. */
export function ogImage({ label, title }: { label: string; title: string }) {
  // Dither strip drawn with squares (the OG renderer's font has no block glyphs).
  const shades = ['#071006', '#17330d', '#3f8f12', '#63ff00', '#b6ff3b'];
  const cells = Array.from({ length: 3 * 66 }, (_, i) => {
    const x = i % 66;
    const y = Math.floor(i / 66);
    const v = 0.5 + 0.35 * Math.sin(x * 0.35 + y * 1.3) + 0.15 * Math.sin(x * 1.7 - y);
    return shades[Math.max(0, Math.min(4, Math.floor(v * 5)))];
  });
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#000',
          padding: '64px 72px',
          color: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, color: '#6bf82c' }}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', width: LOGO_WIDTH, height: 579 * k, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO}
              width={1920 * k}
              height={1080 * k}
              style={{ marginLeft: -35 * k, marginTop: -249 * k }}
              alt=""
            />
          </div>
          <div style={{ display: 'flex', fontSize: 34, color: '#d8d8d8', maxWidth: 900 }}>{title}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: 66 * 16, gap: 0 }}>
          {cells.map((c, i) => (
            <div key={i} style={{ width: 14, height: 14, margin: 1, background: c }} />
          ))}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
