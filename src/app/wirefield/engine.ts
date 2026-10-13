import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DEFAULT_GLOBALS, MAX_FACES, MAX_LINKS, type EmitterParams, type GlobalParams, type Shape } from './config';
import { PlexusSolver } from './plexus';

const CAMERA_HOME = new THREE.Vector3(0, 8, 34);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/** Edge outlines of each particle shape, shared by every emitter. */
const SHAPE_EDGES: Record<Shape, Float32Array> = (() => {
  const shapes: Record<Shape, THREE.BufferGeometry> = {
    tetra: new THREE.TetrahedronGeometry(1),
    cube: new THREE.BoxGeometry(1, 1, 1),
    octa: new THREE.OctahedronGeometry(1),
    icosa: new THREE.IcosahedronGeometry(1, 0),
    torus: new THREE.TorusGeometry(0.75, 0.25, 5, 9),
  };
  const out = {} as Record<Shape, Float32Array>;
  for (const key of Object.keys(shapes) as Shape[]) {
    const edges = new THREE.EdgesGeometry(shapes[key], 18);
    out[key] = Float32Array.from(edges.getAttribute('position').array as Float32Array);
    edges.dispose();
    shapes[key].dispose();
  }
  return out;
})();

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function dynamicGeometry(floats: number) {
  const geometry = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(new Float32Array(floats), 3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', attr);
  return { geometry, array: attr.array as Float32Array, attr };
}

/** Everything the renderer owns for one emitter. Rebuilt when shape or count change. */
class EmitterRuntime {
  params: EmitterParams;
  readonly shape: Shape;
  readonly count: number;
  readonly group = new THREE.Group();

  // particle seeds
  private readonly px: Float32Array;
  private readonly py: Float32Array;
  private readonly pz: Float32Array;
  private readonly phase: Float32Array;
  private readonly scale: Float32Array;
  private readonly rot: Float32Array;

  readonly centers: Float32Array;
  private readonly source: Float32Array;
  private readonly lineData: ReturnType<typeof dynamicGeometry>;
  private readonly plexData: ReturnType<typeof dynamicGeometry>;
  private readonly nodeData: ReturnType<typeof dynamicGeometry>;
  private readonly faceData: ReturnType<typeof dynamicGeometry>;
  private readonly lines: THREE.LineSegments;
  private readonly plexLines: THREE.LineSegments;
  private readonly plexNodes: THREE.Points;
  private readonly faces: THREE.Mesh;
  private readonly lineMat: THREE.LineBasicMaterial;
  private readonly plexMat: THREE.LineBasicMaterial;
  private readonly nodeMat: THREE.PointsMaterial;
  private readonly faceMat: THREE.MeshBasicMaterial;
  private readonly solver: PlexusSolver;

  constructor(params: EmitterParams) {
    this.params = params;
    this.shape = params.shape;
    this.count = params.count;
    const n = params.count;

    this.source = SHAPE_EDGES[params.shape];
    const verts = this.source.length / 3;

    this.px = new Float32Array(n);
    this.py = new Float32Array(n);
    this.pz = new Float32Array(n);
    this.phase = new Float32Array(n);
    this.scale = new Float32Array(n);
    this.rot = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = rnd(-1, 1);
      const a = rnd(0, Math.PI * 2);
      const r = Math.sqrt(1 - u * u);
      this.px[i] = r * Math.cos(a);
      this.py[i] = u;
      this.pz[i] = r * Math.sin(a);
      this.phase[i] = rnd(0, 7);
      this.scale[i] = rnd(0.55, 1.5);
      this.rot[i] = rnd(-3, 3);
    }
    this.centers = new Float32Array(n * 3);
    this.solver = new PlexusSolver(n);

    const color = params.color;
    this.lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false });
    this.plexMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: params.plexOpacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.nodeMat = new THREE.PointsMaterial({
      color,
      size: params.plexPointSize,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
    });
    this.faceMat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: params.faceOpacity,
      depthWrite: false,
    });

    this.lineData = dynamicGeometry(n * verts * 3);
    this.plexData = dynamicGeometry(n * MAX_LINKS * 6);
    this.nodeData = dynamicGeometry(n * 3);
    this.faceData = dynamicGeometry(MAX_FACES * 9);
    this.plexData.geometry.setDrawRange(0, 0);
    this.faceData.geometry.setDrawRange(0, 0);

    this.lines = new THREE.LineSegments(this.lineData.geometry, this.lineMat);
    this.plexLines = new THREE.LineSegments(this.plexData.geometry, this.plexMat);
    this.plexNodes = new THREE.Points(this.nodeData.geometry, this.nodeMat);
    this.faces = new THREE.Mesh(this.faceData.geometry, this.faceMat);

    // Everything moves every frame, so skip bounding-sphere work and culling.
    for (const obj of [this.lines, this.plexLines, this.plexNodes, this.faces]) {
      obj.frustumCulled = false;
      this.group.add(obj);
    }
    this.applyVisibility();
  }

  setColor(color: string) {
    for (const m of [this.lineMat, this.plexMat, this.nodeMat, this.faceMat]) m.color.set(color);
  }

  private applyVisibility() {
    const { plexMode, plexFaces } = this.params;
    this.lines.visible = plexMode !== 'only';
    this.plexLines.visible = plexMode !== 'off';
    this.plexNodes.visible = plexMode !== 'off';
    this.faces.visible = plexMode !== 'off' && plexFaces;
  }

  update(t: number, g: GlobalParams, v: THREE.Vector3, q: THREE.Quaternion, euler: THREE.Euler) {
    const e = this.params;
    const out = this.lineData.array;
    const src = this.source;
    const verts = src.length / 3;
    const { centers, px, py, pz, phase, scale, rot } = this;
    const attraction = 1 - g.attract * 0.18;
    const freq = g.frequency;
    let ptr = 0;

    for (let i = 0; i < this.count; i++) {
      const ph = phase[i];
      const flowPhase = t * e.flow + ph;
      const ang = ph * 2.4 + t * g.vortex * 0.15;
      let x = px[i];
      let y = py[i];
      let z = pz[i];
      const r = e.radius;

      if (e.distribution === 'ring') {
        x = Math.cos(ang);
        z = Math.sin(ang);
        y *= 0.12;
      } else if (e.distribution === 'disk') {
        const k = Math.sqrt(Math.abs(py[i]));
        x *= k;
        z *= k;
        y *= 0.07;
      } else if (e.distribution === 'column') {
        x *= 0.22;
        z *= 0.22;
      } else if (e.distribution === 'cloud') {
        x *= 1.3;
        y *= 0.8;
        z *= 1.3;
      }

      const wave = Math.sin(x * freq * 3 + t * 0.35 + ph) * Math.cos(z * freq * 3 - t * 0.3);
      const cx = x * r + Math.sin(flowPhase * 0.71 + pz[i] * 8) * e.spread + wave * g.noise * 2;
      const cy = y * r + Math.cos(flowPhase * 0.89 + px[i] * 8) * e.spread + Math.sin(z * 9 * freq + t) * g.noise * 1.6;
      const cz = z * r + Math.sin(flowPhase * 0.53 + py[i] * 8) * e.spread + Math.cos(x * 8 * freq - t) * g.noise * 2;
      v.set(cx * attraction, cy * attraction, cz * attraction);

      euler.set(t * e.spin * 0.4 + rot[i], t * e.spin * 0.6 + ph, t * e.spin * 0.3 + ph);
      q.setFromEuler(euler);
      const s = e.size * scale[i] * (1 + e.pulse * 0.35 * Math.sin(t * 0.85 + ph));

      centers[i * 3] = v.x;
      centers[i * 3 + 1] = v.y;
      centers[i * 3 + 2] = v.z;

      // rotate each outline vertex by q (v' = v + w*t + q×t, with t = 2 q×v)
      const ix = q.x;
      const iy = q.y;
      const iz = q.z;
      const iw = q.w;
      for (let j = 0; j < verts; j++) {
        const ax = src[j * 3] * s;
        const ay = src[j * 3 + 1] * s;
        const az = src[j * 3 + 2] * s;
        const tx = 2 * (iy * az - iz * ay);
        const ty = 2 * (iz * ax - ix * az);
        const tz = 2 * (ix * ay - iy * ax);
        out[ptr++] = v.x + ax + iw * tx + iy * tz - iz * ty;
        out[ptr++] = v.y + ay + iw * ty + iz * tx - ix * tz;
        out[ptr++] = v.z + az + iw * tz + ix * ty - iy * tx;
      }
    }
    this.lineData.attr.needsUpdate = true;
    this.updatePlexus();
  }

  private updatePlexus() {
    const e = this.params;
    this.applyVisibility();
    if (e.plexMode === 'off') return;

    const lineFloats = this.solver.connect(this.centers, e.plexDistance, e.plexLinks, this.plexData.array);
    this.plexData.geometry.setDrawRange(0, lineFloats / 3);
    this.plexData.attr.needsUpdate = true;
    this.plexMat.opacity = e.plexOpacity;

    this.nodeData.array.set(this.centers);
    this.nodeData.attr.needsUpdate = true;
    this.nodeMat.size = e.plexPointSize;

    let faceFloats = 0;
    const maxFaces = Math.min(MAX_FACES, Math.round(e.faceLimit));
    if (e.plexFaces && maxFaces > 0) {
      faceFloats = this.solver.triangulate(this.centers, e.faceDistance, maxFaces, this.faceData.array);
    }
    this.faceData.geometry.setDrawRange(0, faceFloats / 3);
    this.faceData.attr.needsUpdate = true;
    this.faceMat.opacity = e.faceOpacity;
  }

  dispose() {
    for (const d of [this.lineData, this.plexData, this.nodeData, this.faceData]) d.geometry.dispose();
    for (const m of [this.lineMat, this.plexMat, this.nodeMat, this.faceMat]) m.dispose();
  }
}

export type EngineOptions = {
  maxPixelRatio?: number;
  onFps?: (fps: number) => void;
};

export class WirefieldEngine {
  globals: GlobalParams = { ...DEFAULT_GLOBALS };
  paused = false;
  orbit = false;
  fpsEnabled = false;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly clock = new THREE.Clock();
  private readonly resizeObserver: ResizeObserver;
  private readonly runtimes = new Map<number, EmitterRuntime>();
  private readonly v = new THREE.Vector3();
  private readonly q = new THREE.Quaternion();
  private readonly euler = new THREE.Euler();
  private elapsed = 0;
  private frameId = 0;
  private fpsFrames = 0;
  private fpsSeconds = 0;

  constructor(
    private readonly container: HTMLElement,
    private readonly options: EngineOptions = {},
  ) {
    const { clientWidth: w, clientHeight: h } = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.maxPixelRatio ?? 2));
    // updateStyle=false: CSS sizes the canvas; only the drawing buffer follows the container.
    this.renderer.setSize(w, h, false);
    this.renderer.setClearColor(0x07090d);
    container.prepend(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500);
    this.camera.position.copy(CAMERA_HOME);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.loop();
  }

  /** Reconcile the scene with the emitter list from the UI. */
  setEmitters(list: EmitterParams[]) {
    const keep = new Set(list.map((e) => e.id));
    this.runtimes.forEach((rt, id) => {
      if (!keep.has(id)) this.removeRuntime(id, rt);
    });

    for (const params of list) {
      const rt = this.runtimes.get(params.id);
      if (!rt || rt.shape !== params.shape || rt.count !== params.count) {
        if (rt) this.removeRuntime(params.id, rt);
        const fresh = new EmitterRuntime(params);
        this.runtimes.set(params.id, fresh);
        this.scene.add(fresh.group);
        continue;
      }
      if (rt.params.color !== params.color) rt.setColor(params.color);
      rt.params = params;
    }
  }

  resetCamera() {
    this.camera.position.copy(CAMERA_HOME);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  /** PNG of the current frame. Rendered and read in the same task, so no preserveDrawingBuffer needed. */
  screenshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  dispose() {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.runtimes.forEach((rt, id) => this.removeRuntime(id, rt));
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private removeRuntime(id: number, rt: EmitterRuntime) {
    this.scene.remove(rt.group);
    rt.dispose();
    this.runtimes.delete(id);
  }

  /** Fit the canvas to its container. Also runs automatically via ResizeObserver. */
  resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  private loop = () => {
    this.frameId = requestAnimationFrame(this.loop);
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);

    if (this.fpsEnabled) {
      this.fpsFrames++;
      this.fpsSeconds += rawDt;
      if (this.fpsSeconds >= 0.5) {
        this.options.onFps?.(Math.round(this.fpsFrames / this.fpsSeconds));
        this.fpsFrames = 0;
        this.fpsSeconds = 0;
      }
    }

    if (!this.paused) this.elapsed += dt * this.globals.speed;
    if (this.orbit && !this.paused) {
      this.camera.position.applyAxisAngle(Y_AXIS, dt * 0.12 * this.globals.speed);
    }

    const t = this.elapsed;
    this.runtimes.forEach((rt) => rt.update(t, this.globals, this.v, this.q, this.euler));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
