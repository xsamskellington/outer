import { MAX_LINKS } from './config';

/**
 * Plexus connections between particle centres, allocation-free per frame.
 *
 * Same result as the original: walking particles in order, each one links to its
 * nearest neighbours (within `distance`, with free link slots) until it has `links`
 * connections. The original built a string-keyed spatial hash plus arrays and Sets
 * every frame; with at most 450 particles a typed-array scan is faster and makes no
 * garbage.
 */
export class PlexusSolver {
  private readonly counts: Uint8Array;
  /** adjacency: up to MAX_LINKS neighbour indices per particle */
  private readonly adj: Int16Array;
  private readonly candDist: Float32Array;
  private readonly candIdx: Int32Array;
  private readonly sorted = new Int16Array(MAX_LINKS);

  constructor(private readonly n: number) {
    this.counts = new Uint8Array(n);
    this.adj = new Int16Array(n * MAX_LINKS);
    this.candDist = new Float32Array(n);
    this.candIdx = new Int32Array(n);
  }

  /** Writes line segments into `out` and returns how many floats were written. */
  connect(c: Float32Array, distance: number, linkLimit: number, out: Float32Array) {
    const { n, counts, adj, candDist, candIdx } = this;
    const d2 = distance * distance;
    const links = Math.min(MAX_LINKS, Math.round(linkLimit));
    counts.fill(0);
    let ptr = 0;

    for (let i = 0; i < n; i++) {
      if (counts[i] >= links) continue;
      const a = i * 3;
      const ax = c[a];
      const ay = c[a + 1];
      const az = c[a + 2];

      let m = 0;
      for (let j = i + 1; j < n; j++) {
        if (counts[j] >= links) continue;
        const b = j * 3;
        const x = ax - c[b];
        const y = ay - c[b + 1];
        const z = az - c[b + 2];
        const dd = x * x + y * y + z * z;
        if (dd < d2) {
          candDist[m] = dd;
          candIdx[m] = j;
          m++;
        }
      }

      // Take the nearest candidates first (partial selection instead of a full sort).
      while (counts[i] < links && m > 0) {
        let best = 0;
        for (let k = 1; k < m; k++) if (candDist[k] < candDist[best]) best = k;
        const j = candIdx[best];
        candDist[best] = candDist[m - 1];
        candIdx[best] = candIdx[m - 1];
        m--;

        if (ptr + 6 > out.length) return ptr;
        const b = j * 3;
        out[ptr++] = ax;
        out[ptr++] = ay;
        out[ptr++] = az;
        out[ptr++] = c[b];
        out[ptr++] = c[b + 1];
        out[ptr++] = c[b + 2];
        adj[i * MAX_LINKS + counts[i]++] = j;
        adj[j * MAX_LINKS + counts[j]++] = i;
      }
    }
    return ptr;
  }

  private linked(j: number, k: number) {
    const base = j * MAX_LINKS;
    for (let s = 0; s < this.counts[j]; s++) if (this.adj[base + s] === k) return true;
    return false;
  }

  /**
   * Triangles where all three edges are connected and every side is within `distance`.
   * Must run after `connect`. Returns how many floats were written.
   */
  triangulate(c: Float32Array, distance: number, maxFaces: number, out: Float32Array) {
    const { n, counts, adj, sorted } = this;
    const fd2 = distance * distance;
    const limit = maxFaces * 9;
    let fp = 0;

    for (let i = 0; i < n; i++) {
      // neighbours above i, ascending (insertion sort, at most 12)
      let len = 0;
      for (let s = 0; s < counts[i]; s++) {
        const j = adj[i * MAX_LINKS + s];
        if (j <= i) continue;
        let p = len++;
        while (p > 0 && sorted[p - 1] > j) {
          sorted[p] = sorted[p - 1];
          p--;
        }
        sorted[p] = j;
      }

      for (let u = 0; u < len; u++) {
        for (let w = u + 1; w < len; w++) {
          const j = sorted[u];
          const k = sorted[w];
          if (!this.linked(j, k)) continue;
          const ia = i * 3;
          const ja = j * 3;
          const ka = k * 3;
          const dij = (c[ia] - c[ja]) ** 2 + (c[ia + 1] - c[ja + 1]) ** 2 + (c[ia + 2] - c[ja + 2]) ** 2;
          const dik = (c[ia] - c[ka]) ** 2 + (c[ia + 1] - c[ka + 1]) ** 2 + (c[ia + 2] - c[ka + 2]) ** 2;
          const djk = (c[ja] - c[ka]) ** 2 + (c[ja + 1] - c[ka + 1]) ** 2 + (c[ja + 2] - c[ka + 2]) ** 2;
          if (dij > fd2 || dik > fd2 || djk > fd2) continue;
          out[fp++] = c[ia];
          out[fp++] = c[ia + 1];
          out[fp++] = c[ia + 2];
          out[fp++] = c[ja];
          out[fp++] = c[ja + 1];
          out[fp++] = c[ja + 2];
          out[fp++] = c[ka];
          out[fp++] = c[ka + 1];
          out[fp++] = c[ka + 2];
          if (fp >= limit) return fp;
        }
      }
    }
    return fp;
  }
}
