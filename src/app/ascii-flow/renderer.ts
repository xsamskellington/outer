import { MODES, PALETTES, type State } from './config';

/*
 * Port of the renderer in outer_ascii_flow_v1_5.html.
 * GPU path: two passes — the procedural field at character resolution, then glyph compositing.
 * CPU path (no WebGL): the same field in JS, glyphs blitted from a pre-rendered atlas.
 */

const fract = (x: number) => x - Math.floor(x);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Character cell size in CSS px for a given font size. */
export const cellSize = (size: number) => ({ cw: size * 0.62, ch: size * 1.15 });

const rgbHex = (c: string): [number, number, number] => {
  let h = c.slice(1);
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
};

export type Frame = { state: State; time: number; W: number; H: number };

export interface Renderer {
  /** draws one frame; returns the "cols × rows CELLS" part of the HUD plus GPU/CPU */
  draw(f: Frame): { cols: number; rows: number; gpu: boolean };
  dispose(): void;
}

/* ------------------------------------------------------------------ GPU ------------------------------------------------------------------ */

const VERTEX = `attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;

const FIELD_SHADER = `precision highp float;
uniform vec2 resolution,grid,cell;uniform float t,scale,warp,seed,angle,direction,contrast,invert,pulse,glyphCount,colorMode;uniform int mode;
uniform sampler2D noiseTex;
float hash(vec2 p){return texture2D(noiseTex,(mod(p,256.)+.5)/256.).r;}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float field(vec2 p){float x=p.x,y=p.y,s=seed*.17;
if(mode==0){float qx=noise(vec2(x*.7+t*.13+s,y*.7)),qy=noise(vec2(x*.7+8.,y*.7-t*.11+s));return .5+.5*sin(x*2.2+y*.8+(qx-qy)*warp*8.+t*.6);}
if(mode==1)return .5+.5*sin(x*2.6+sin(y*2.+t)*warp*1.8+t)*cos(y*1.3-x*.4-t*.35);
if(mode==2)return .5+(sin(x*2.+t)+sin(y*2.4-t*.7)+sin((x+y)*1.5+t*.4)+sin(length(vec2(x+warp*sin(t*.4),y))*3.-t))/8.;
if(mode==3)return noise(vec2(x+t*.22,y+s))*.6+noise(vec2(x*2.2+s,y*2.2-t*.3))*.28+noise(vec2(x*4.3,y*4.3+t*.4))*.12;
if(mode==4)return .5+.5*sin(length(p)*4.-sin(atan(y,x)*5.+t)*warp-t*1.5);
x+=sin(y+t)*warp*.3;y+=sin(x-t*.7)*warp*.3;p=vec2(x,y);vec2 ip=floor(p);float d=10.;
for(int a=-1;a<=1;a++){for(int b=-1;b<=1;b++){vec2 k=ip+vec2(float(a),float(b));vec2 pos=k+.5+.42*vec2(sin(t*.6+6.28*hash(k)),cos(t*.5+6.28*hash(k+vec2(31,-17))));vec2 delta=p-pos;d=min(d,dot(delta,delta));}}return min(1.,sqrt(d));}
void main(){vec2 pixel=vec2(gl_FragCoord.x,grid.y-gl_FragCoord.y)*cell;float z=scale*(1.+pulse*.12*sin(t*1.4));vec2 p=(pixel-resolution*.5)/resolution.y*z*3.;float co=cos(angle),si=sin(angle);p=vec2(p.x*co-p.y*si,p.x*si+p.y*co)+vec2(cos(direction),sin(direction))*t*.22;
float v=clamp((field(p)-.5)*contrast+.5,0.,.99999);v=mix(v,.99999-v,invert);float color=colorMode>.5?v:fract(v*1.5+noise(p*.3+vec2(23,0))*.6);gl_FragColor=vec4(floor(v*glyphCount)/255.,min(4.,floor(color*5.))/255.,0,1);}`;

const DISPLAY_SHADER = `precision highp float;
uniform sampler2D fieldTex,glyphTex;uniform vec2 resolution,grid,cell,bufferSize;uniform float glyphCount;uniform vec2 glyphTile;uniform vec3 background;uniform vec3 colors[5];
void main(){vec2 pixel=vec2(gl_FragCoord.x/bufferSize.x,1.-gl_FragCoord.y/bufferSize.y)*resolution;vec2 index=floor(pixel/cell);vec2 data=texture2D(fieldTex,vec2((index.x+.5)/grid.x,1.-(index.y+.5)/grid.y)).rg;float glyph=floor(data.r*255.+.5),c=floor(data.g*255.+.5);vec2 local=fract(pixel/cell);float alpha=texture2D(glyphTex,vec2((glyph*glyphTile.x+clamp(local.x*glyphTile.x,.5,glyphTile.x-.5))/(glyphCount*glyphTile.x),clamp(local.y*glyphTile.y,.5,glyphTile.y-.5)/glyphTile.y)).a;vec3 color=colors[0];if(c>.5)color=colors[1];if(c>1.5)color=colors[2];if(c>2.5)color=colors[3];if(c>3.5)color=colors[4];gl_FragColor=vec4(mix(background,color,alpha),1);}`;

const FIELD_UNIFORMS = ['t', 'scale', 'warp', 'seed', 'angle', 'direction', 'contrast', 'invert', 'pulse', 'glyphCount', 'colorMode'] as const;

export function createGpuRenderer(canvas: HTMLCanvasElement, gl: WebGLRenderingContext): Renderer {
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const program = (source: string) => {
    const p = gl.createProgram()!;
    gl.attachShader(p, shader(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, source));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'program');
    return p;
  };

  const fieldProgram = program(FIELD_SHADER);
  const displayProgram = program(DISPLAY_SHADER);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const use = (p: WebGLProgram) => {
    gl.useProgram(p);
    const a = gl.getAttribLocation(p, 'position');
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  };

  // uniform locations, looked up once
  const locCache = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();
  const loc = (p: WebGLProgram, n: string) => {
    let m = locCache.get(p);
    if (!m) locCache.set(p, (m = new Map()));
    if (!m.has(n)) m.set(n, gl.getUniformLocation(p, n));
    return m.get(n)!;
  };
  const f1 = (p: WebGLProgram, n: string, v: number) => gl.uniform1f(loc(p, n), v);
  const f2 = (p: WebGLProgram, n: string, a: number, b: number) => gl.uniform2f(loc(p, n), a, b);

  const texture = () => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const fieldTex = texture();
  const glyphTex = texture();
  const noiseTex = texture();
  const fbo = gl.createFramebuffer();

  let cols = 0;
  let rows = 0;
  let glyphKey = '';
  let colorKey = '';
  let noiseSeed = NaN;
  let tileW = 1;
  let tileH = 1;
  let rgb = new Float32Array(15);
  const fieldValues: Record<(typeof FIELD_UNIFORMS)[number], number> = {
    t: 0, scale: 0, warp: 0, seed: 0, angle: 0, direction: 0, contrast: 0, invert: 0, pulse: 0, glyphCount: 0, colorMode: 0,
  };

  // Stable lattice values uploaded once per seed (no sine-based hash on the GPU).
  const updateNoise = (seed: number) => {
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, noiseTex);
    if (noiseSeed === seed) return;
    noiseSeed = seed;
    const values = new Uint8Array(256 * 256 * 4);
    let n = (Math.floor(seed * 1000003) ^ 0x9e3779b9) >>> 0;
    for (let i = 0; i < 256 * 256; i++) {
      n = (n + 0x6d2b79f5) >>> 0;
      let z = n;
      z = Math.imul(z ^ (z >>> 15), z | 1);
      z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
      values[i * 4] = (z ^ (z >>> 14)) >>> 24;
      values[i * 4 + 3] = 255;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);
  };

  return {
    draw({ state, time, W, H }) {
      if (gl.isContextLost()) return { cols, rows, gpu: true };
      updateNoise(state.seed);
      const { cw, ch } = cellSize(state.size);
      const cc = Math.ceil(W / cw);
      const rr = Math.ceil(H / ch);
      const chars = Array.from(state.chars || ' ');

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldTex);
      if (cc !== cols || rr !== rows) {
        cols = cc;
        rows = rr;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cols, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fieldTex, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Framebuffer incompleto');
      }

      // glyph atlas, rebuilt only when the characters or size change
      const key = state.chars + '|' + state.size;
      if (key !== glyphKey) {
        glyphKey = key;
        const a = document.createElement('canvas');
        const aw = Math.ceil(cw * 3);
        const ah = Math.ceil(ch * 3);
        tileW = aw;
        tileH = ah;
        a.width = aw * chars.length;
        a.height = ah;
        const c = a.getContext('2d')!;
        c.fillStyle = '#fff';
        c.font = state.size * 3 + 'px monospace';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        for (let g = 0; g < chars.length; g++) {
          c.save();
          c.beginPath();
          c.rect(g * aw, 0, aw, ah);
          c.clip();
          c.fillText(chars[g], g * aw + aw / 2, ah / 2);
          c.restore();
        }
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, glyphTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, a);
      }

      // pass 1: field at character resolution
      gl.disable(gl.BLEND);
      gl.disable(gl.DITHER);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, cols, rows);
      use(fieldProgram);
      gl.uniform1i(loc(fieldProgram, 'noiseTex'), 2);
      f2(fieldProgram, 'resolution', W, H);
      f2(fieldProgram, 'grid', cols, rows);
      f2(fieldProgram, 'cell', cw, ch);
      fieldValues.t = time;
      fieldValues.scale = state.scale;
      fieldValues.warp = state.warp;
      fieldValues.seed = state.seed;
      fieldValues.angle = state.rotate ? time * 0.16 : 0;
      fieldValues.direction = (state.angle * Math.PI) / 180;
      fieldValues.contrast = state.contrast;
      fieldValues.invert = +state.invert;
      fieldValues.pulse = +state.pulse;
      fieldValues.glyphCount = chars.length;
      fieldValues.colorMode = state.colorMode === 'LUZ' ? 1 : 0;
      for (const n of FIELD_UNIFORMS) f1(fieldProgram, n, fieldValues[n]);
      gl.uniform1i(loc(fieldProgram, 'mode'), MODES.indexOf(state.mode));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // pass 2: glyphs on screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      use(displayProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldTex);
      gl.uniform1i(loc(displayProgram, 'fieldTex'), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, glyphTex);
      gl.uniform1i(loc(displayProgram, 'glyphTex'), 1);
      f2(displayProgram, 'resolution', W, H);
      f2(displayProgram, 'grid', cols, rows);
      f2(displayProgram, 'cell', cw, ch);
      f2(displayProgram, 'bufferSize', canvas.width, canvas.height);
      f1(displayProgram, 'glyphCount', chars.length);
      f2(displayProgram, 'glyphTile', tileW, tileH);
      gl.uniform3fv(loc(displayProgram, 'background'), rgbHex(state.bg));
      if (colorKey !== state.palette) {
        colorKey = state.palette;
        rgb = new Float32Array(PALETTES[state.palette].flatMap(rgbHex));
      }
      gl.uniform3fv(loc(displayProgram, 'colors[0]'), rgb);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return { cols, rows, gpu: true };
    },
    dispose() {
      for (const t of [fieldTex, glyphTex, noiseTex]) gl.deleteTexture(t);
      gl.deleteFramebuffer(fbo);
      gl.deleteBuffer(quad);
      gl.deleteProgram(fieldProgram);
      gl.deleteProgram(displayProgram);
    },
  };
}

/* ------------------------------------------------------------------ CPU ------------------------------------------------------------------ */

export function createCpuRenderer(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Renderer {
  // Per-seed exact memoization of the lattice hash: collisions recompute, values never change.
  const hashValues = new Float64Array(65536);
  const hashX = new Float64Array(65536);
  const hashY = new Float64Array(65536);
  const hashValid = new Uint8Array(65536);
  let hashSeed = NaN;
  let seed = 0;

  const hash = (x: number, y: number) => {
    if (hashSeed !== seed) {
      hashSeed = seed;
      hashValid.fill(0);
    }
    const index = ((x & 255) << 8) | (y & 255);
    if (hashValid[index] && hashX[index] === x && hashY[index] === y) return hashValues[index];
    const value = fract(Math.sin(x * 127.1 + y * 311.7 + seed * 19.19) * 43758.5453);
    hashX[index] = x;
    hashY[index] = y;
    hashValid[index] = 1;
    hashValues[index] = value;
    return value;
  };

  const cellPositions = new Map<string, [number, number]>();
  const cellPosition = (x: number, y: number, t: number) => {
    const key = x + ',' + y;
    let p = cellPositions.get(key);
    if (!p) {
      p = [x + 0.5 + 0.42 * Math.sin(t * 0.6 + 6.28 * hash(x, y)), y + 0.5 + 0.42 * Math.cos(t * 0.5 + 6.28 * hash(x + 31, y - 17))];
      cellPositions.set(key, p);
    }
    return p;
  };

  const noise = (x: number, y: number) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    let u = fract(x);
    let v = fract(y);
    u = u * u * (3 - 2 * u);
    v = v * v * (3 - 2 * v);
    return mix(mix(hash(i, j), hash(i + 1, j), u), mix(hash(i, j + 1), hash(i + 1, j + 1), u), v);
  };

  const field = (state: State, x: number, y: number, t: number) => {
    const w = state.warp;
    const s = state.seed * 0.17;
    switch (state.mode) {
      case 'FLOW': {
        const qx = noise(x * 0.7 + t * 0.13 + s, y * 0.7);
        const qy = noise(x * 0.7 + 8, y * 0.7 - t * 0.11 + s);
        return 0.5 + 0.5 * Math.sin(x * 2.2 + y * 0.8 + (qx - qy) * w * 8 + t * 0.6);
      }
      case 'WAVES':
        return 0.5 + 0.5 * Math.sin(x * 2.6 + Math.sin(y * 2 + t) * w * 1.8 + t) * Math.cos(y * 1.3 - x * 0.4 - t * 0.35);
      case 'PLASMA':
        return 0.5 + (Math.sin(x * 2 + t) + Math.sin(y * 2.4 - t * 0.7) + Math.sin((x + y) * 1.5 + t * 0.4) + Math.sin(Math.hypot(x + w * Math.sin(t * 0.4), y) * 3 - t)) / 8;
      case 'NOISE':
        return noise(x + t * 0.22, y + s) * 0.6 + noise(x * 2.2 + s, y * 2.2 - t * 0.3) * 0.28 + noise(x * 4.3, y * 4.3 + t * 0.4) * 0.12;
      case 'RINGS':
        return 0.5 + 0.5 * Math.sin(Math.hypot(x, y) * 4 - Math.sin(Math.atan2(y, x) * 5 + t) * w - t * 1.5);
      case 'CELLS': {
        x += Math.sin(y + t) * w * 0.3;
        y += Math.sin(x - t * 0.7) * w * 0.3;
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        let d = 10;
        for (let a = -1; a <= 1; a++)
          for (let b = -1; b <= 1; b++) {
            const p = cellPosition(ix + a, iy + b, t);
            d = Math.min(d, (x - p[0]) ** 2 + (y - p[1]) ** 2);
          }
        return Math.min(1, Math.sqrt(d));
      }
    }
  };

  let atlas: HTMLCanvasElement | null = null;
  let atlasKey = '';
  let atlasCellW = 0;
  let atlasCellH = 0;
  const buildAtlas = (chars: string[], colors: readonly string[], size: number, W: number) => {
    const dpr = canvas.width / W;
    const key = JSON.stringify([chars, colors, size, dpr]);
    if (key === atlasKey) return;
    atlasKey = key;
    atlasCellW = Math.ceil(size * 0.9);
    atlasCellH = Math.ceil(size * 1.4);
    atlas = document.createElement('canvas');
    atlas.width = Math.ceil(atlasCellW * chars.length * dpr);
    atlas.height = Math.ceil(atlasCellH * colors.length * dpr);
    const a = atlas.getContext('2d')!;
    a.scale(dpr, dpr);
    a.font = size + 'px monospace';
    a.textBaseline = 'middle';
    a.textAlign = 'center';
    for (let c = 0; c < colors.length; c++) {
      a.fillStyle = colors[c];
      for (let g = 0; g < chars.length; g++) {
        if (chars[g] !== ' ') a.fillText(chars[g], g * atlasCellW + atlasCellW / 2, c * atlasCellH + atlasCellH / 2);
      }
    }
  };

  return {
    draw({ state, time, W, H }) {
      cellPositions.clear();
      seed = state.seed;
      const size = state.size;
      const { cw, ch } = cellSize(size);
      const cols = Math.ceil(W / cw);
      const rows = Math.ceil(H / ch);
      const chars = Array.from(state.chars || ' ');
      const colors = PALETTES[state.palette];
      buildAtlas(chars, colors, size, W);
      const dpr = canvas.width / W;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = state.bg;
      ctx.fillRect(0, 0, W, H);
      const t = time;
      const angle = state.rotate ? t * 0.16 : 0;
      const co = Math.cos(angle);
      const si = Math.sin(angle);
      const dir = (state.angle * Math.PI) / 180;
      const scale = state.scale * (state.pulse ? 1 + 0.12 * Math.sin(t * 1.4) : 1);
      const offsetX = Math.cos(dir) * t * 0.22;
      const offsetY = Math.sin(dir) * t * 0.22;
      const k = (scale * 3) / H;

      for (let j = 0; j < rows; j++) {
        const py = (j + 0.5) * ch;
        const y = (py - H * 0.5) * k;
        for (let i = 0; i < cols; i++) {
          const px = (i + 0.5) * cw;
          const x = (px - W * 0.5) * k;
          const xx = x * co - y * si + offsetX;
          const yy = x * si + y * co + offsetY;
          let v = field(state, xx, yy, t);
          v = Math.max(0, Math.min(0.99999, (v - 0.5) * state.contrast + 0.5));
          if (state.invert) v = 0.99999 - v;
          const g = Math.floor(v * chars.length);
          if (chars[g] === ' ') continue;
          const c = state.colorMode === 'LUZ' ? v : fract(v * 1.5 + noise(xx * 0.3 + 23, yy * 0.3) * 0.6);
          const ci = Math.min(colors.length - 1, Math.floor(c * colors.length));
          ctx.drawImage(
            atlas!,
            g * atlasCellW * dpr,
            ci * atlasCellH * dpr,
            atlasCellW * dpr,
            atlasCellH * dpr,
            px - atlasCellW / 2,
            py - atlasCellH / 2,
            atlasCellW,
            atlasCellH,
          );
        }
      }
      return { cols, rows, gpu: false };
    },
    dispose() {
      atlas = null;
      cellPositions.clear();
    },
  };
}
