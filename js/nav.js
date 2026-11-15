/* Walk map for the supplied market building (built by scripts/build-nav.cjs).
   Each 0.25 m cell lists walkable surface heights and a bitmask of occupied 0.25 m height bins,
   so walking follows floors and ramps and stops at walls, railings, counters and floor edges. */
window.MarketNav = (() => {
  async function load(base) {
    const [header, binary] = await Promise.all([
      fetch(base + '.json').then(r => { if (!r.ok) throw new Error('nav header ' + r.status); return r.json() }),
      fetch(base + '.bin').then(r => { if (!r.ok) throw new Error('nav map ' + r.status); return r.arrayBuffer() })
    ]);
    const h = header, cells = h.nx * h.nz, S = h.maxSurfaces;
    const surf = new Int16Array(binary, 0, cells * S), block = new Uint32Array(binary.slice(cells * S * 2));
    const EMPTY = -32768, STEP_UP = .45, STEP_DOWN = .6, RADIUS = .22;
    const cell = (x, z) => { const i = Math.floor((x - h.minX) / h.cell), k = Math.floor((z - h.minZ) / h.cell); return i < 0 || k < 0 || i >= h.nx || k >= h.nz ? -1 : k * h.nx + i; };
    const inGrid = (x, z) => x < h.minX + h.nx * h.cell && x > h.minX && z > h.minZ && z < h.minZ + h.nz * h.cell;
    function blocked(c, y0, y1) {
      for (let b = Math.max(0, Math.floor(y0 / h.bin)), e = Math.min(h.bins - 1, Math.floor(y1 / h.bin)); b <= e; b++) if (block[c * 3 + (b >> 5)] & (1 << (b & 31))) return true;
      return false;
    }
    // Highest surface reachable from feet height y in a cell (stepping up a little, or down a ramp).
    function surfaceNear(c, y, up = STEP_UP, down = STEP_DOWN) {
      let best = null;
      for (let s = 0; s < S; s++) { const v = surf[c * S + s]; if (v === EMPTY) continue; const sy = v / 100; if (sy <= y + up && sy >= y - down && (best === null || sy > best)) best = sy; }
      return best;
    }
    // Feet height when standing at x,z having come from height y, or null if the spot is not walkable.
    function stand(x, z, y, radius = RADIUS) {
      const c = cell(x, z); if (c < 0) return null;
      const s = surfaceNear(c, y); if (s === null || blocked(c, s + .35, s + 1.75)) return null;
      for (const [dx, dz] of [[radius, 0], [-radius, 0], [0, radius], [0, -radius]]) {
        const o = cell(x + dx, z + dz); if (o < 0) return null;
        const so = surfaceNear(o, s, .3, .3); if (so === null || blocked(o, so + .35, so + 1.75)) return null;
      }
      return s;
    }
    const storeyOf = y => h.bands.filter(b => y > b).length;
    // A clear standing spot near (x,z) on the given storey band, searching outward.
    function findClear(x, z, storey, maxRadius = 4, radius = .5) {
      const lo = [-1, ...h.bands][storey], hi = [...h.bands, 99][storey];
      for (let r = 0; r <= maxRadius; r += h.cell) for (let k = 0, n = Math.max(1, Math.round(r * 12)); k < n; k++) {
        const t = k / n * Math.PI * 2, px = x + Math.cos(t) * r, pz = z + Math.sin(t) * r, c = cell(px, pz); if (c < 0) continue;
        for (let s = 0; s < S; s++) { const v = surf[c * S + s]; if (v === EMPTY) continue; const sy = v / 100;
          if (sy > lo && sy <= hi && stand(px, pz, sy, radius) !== null) return { x: px, z: pz, y: sy }; }
      }
      return null;
    }
    // Walkable cells of one storey, for the mini-map.
    function storeyMask(storey) {
      const lo = [-1, ...h.bands][storey], hi = [...h.bands, 99][storey], mask = new Uint8Array(cells);
      for (let c = 0; c < cells; c++) for (let s = 0; s < S; s++) { const v = surf[c * S + s]; if (v === EMPTY) continue; const sy = v / 100;
        if (sy > lo + .25 && sy <= hi && !blocked(c, sy + .35, sy + 1.75)) { mask[c] = 1; break } }
      return mask;
    }
    return { header: h, inGrid, stand, storeyOf, findClear, storeyMask, cell };
  }
  return { load, current: null };
})();
