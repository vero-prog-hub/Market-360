/* Builds the walk map for the supplied market model: node scripts/build-nav.cjs
   Output: assets/models/poorna-market-nav.bin (surface heights + blocker bitmasks per 0.25 m cell)
           assets/models/poorna-market-nav.json (grid header, floor levels, spawn points, stall counters)
   Re-run whenever assets/models/poorna-market.glb or MarketData.model changes. */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const sandbox = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), sandbox);
const D = sandbox.window.MarketData, M = D.model;

const glb = fs.readFileSync(path.join(root, M.url));
const jl = glb.readUInt32LE(12), json = JSON.parse(glb.slice(20, 20 + jl)), bin = glb.slice(20 + jl + 8);
const read = (i, T, w) => { const a = json.accessors[i], v = json.bufferViews[a.bufferView], s = bin.byteOffset + (v.byteOffset || 0) + (a.byteOffset || 0);
  return new T(bin.buffer.slice(s, s + a.count * w * T.BYTES_PER_ELEMENT)); };

// Grid: the building plus the hawker verge and left kerb of the street.
const CELL = .25, BIN = .25, BINS = 72, MAXS = 8;
const minX = -89, maxX = -3, minZ = -91, maxZ = 20;
const nx = Math.ceil((maxX - minX) / CELL), nz = Math.ceil((maxZ - minZ) / CELL), cells = nx * nz;
const surf = new Int16Array(cells * MAXS).fill(-32768);      // walkable surface heights, cm
const block = new Uint32Array(cells * 3);                     // 72 height bins of 0.25 m
const cellOf = (x, z) => { const i = Math.floor((x - minX) / CELL), k = Math.floor((z - minZ) / CELL); return i < 0 || k < 0 || i >= nx || k >= nz ? -1 : k * nx + i; };
function addSurface(c, y) {
  const cm = Math.round(y * 100), o = c * MAXS;
  for (let s = 0; s < MAXS; s++) { const v = surf[o + s]; if (v === -32768) { surf[o + s] = cm; return } if (Math.abs(v - cm) < 12) { if (cm > v) surf[o + s] = cm; return } }
}
function addBlock(c, y) { const b = Math.floor(y / BIN); if (b < 0 || b >= BINS) return; block[c * 3 + (b >> 5)] |= 1 << (b & 31); }

// The building is split-level (wings at 0.6/2.04/2.76, 3.30/4.35/5.79/6.51, 7.05/8.10/9.54, 10.44/11.10/11.85 m),
// joined by ramps, so G+3 are height bands; spawn levels are the main wing's slabs.
const ox = M.offset.x, oz = M.offset.z, levels = [.6, 4.35, 8.1, 11.85], bands = [2.9, 6.6, 10.3], tables = [];
const storeyOf = y => bands.filter(b => y > b).length;
const a = [0, 0, 0], b = [0, 0, 0], c = [0, 0, 0];
let tris = 0;
for (const node of json.nodes) {
  const prim = json.meshes[node.mesh].primitives[0], name = json.materials[prim.material].name, m = node.matrix;
  const P = read(prim.attributes.POSITION, Float32Array, 3), I = prim.indices != null ? read(prim.indices, Uint32Array, 1) : null;
  const n = I ? I.length : P.length / 3, w = new Float32Array(P.length);
  for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) w[i + k] = m[k] * P[i] + m[4 + k] * P[i + 1] + m[8 + k] * P[i + 2] + m[12 + k];
  for (let i = 0; i < w.length; i += 3) { w[i] += ox; w[i + 2] += oz; }
  if (name === 'Floor:900 table') {
    let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (let i = 0; i < w.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], w[i + k]); hi[k] = Math.max(hi[k], w[i + k]); }
    const floor = storeyOf(lo[1]);
    tables.push({ x: +((lo[0] + hi[0]) / 2).toFixed(2), z: +((lo[2] + hi[2]) / 2).toFixed(2), top: +hi[1].toFixed(2), w: +(hi[0] - lo[0]).toFixed(2), d: +(hi[2] - lo[2]).toFixed(2), floor });
  }
  for (let t = 0; t < n; t += 3) {
    const ia = I ? I[t] : t, ib = I ? I[t + 1] : t + 1, ic = I ? I[t + 2] : t + 2;
    for (let k = 0; k < 3; k++) { a[k] = w[ia * 3 + k]; b[k] = w[ib * 3 + k]; c[k] = w[ic * 3 + k]; }
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx, len = Math.hypot(cx, cy, cz);
    if (len < 1e-9) continue; tris++;
    const ny = cy / len, up = ny > .5;   // only upward faces are walkable (slab undersides only block)
    const edge = Math.max(Math.hypot(ux, uy, uz), Math.hypot(vx, vy, vz), Math.hypot(b[0] - c[0], b[1] - c[1], b[2] - c[2]));
    const steps = Math.max(1, Math.ceil(edge / .12));
    for (let i = 0; i <= steps; i++) for (let j = 0; j <= steps - i; j++) {
      const s = i / steps, r = j / steps, x = a[0] + ux * s + vx * r, y = a[1] + uy * s + vy * r, z = a[2] + uz * s + vz * r;
      const cell = cellOf(x, z); if (cell < 0) continue;
      if (up) addSurface(cell, y);
      addBlock(cell, y);     // every face also blocks its own height band (walls, counters, railings, slab edges)
    }
  }
}
// Street-side ground: the hawker verge and the kerb strip are walkable at street level.
for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
  const x = minX + (i + .5) * CELL, z = minZ + (k + .5) * CELL, cell = k * nx + i;
  if (!((x > M.wallX - .4 && z <= M.zStart + .5 && z >= M.zEnd - .5) || x > -5.6)) continue;
  // Fill street level wherever the model has nothing near the ground (incl. the wall line inside the gates).
  let low = false; for (let k2 = 0; k2 < MAXS; k2++) { const v = surf[cell * MAXS + k2]; if (v !== -32768 && v < 50) low = true; }
  if (!low || x > M.wallX + .3) addSurface(cell, 0);
}
// Floor surfaces block their own height bin; clear exactly that bin so standing on a slab is not "blocked".
// (The walker checks only bins from feet+0.35 m to feet+1.75 m, so slab bins below that never matter.)

// Spawn points: a clear cell per floor near the Main Gate's ramp core, facing into the building.
const blocked = (cell, y0, y1) => { for (let bn = Math.floor(y0 / BIN); bn <= Math.floor(y1 / BIN); bn++) if (bn >= 0 && bn < BINS && block[cell * 3 + (bn >> 5)] & (1 << (bn & 31))) return true; return false; };
const surfaceNear = (cell, y) => { for (let s = 0; s < MAXS; s++) { const v = surf[cell * MAXS + s]; if (v !== -32768 && Math.abs(v / 100 - y) < .08) return v / 100 } return null; };
function clear(x, z, y, r) {
  for (let dx = -r; dx <= r + 1e-6; dx += CELL) for (let dz = -r; dz <= r + 1e-6; dz += CELL) {
    const cell = cellOf(x + dx, z + dz); if (cell < 0) return false;
    const s = surfaceNear(cell, y); if (s === null || blocked(cell, s + .35, s + 1.75)) return false;
  }
  return true;
}
const centre = { x: -30, z: -45.5 }, spawns = [];
for (const y of levels) {
  let best = null;
  for (let rad = 0; rad < 40 && !best; rad += CELL) for (let k = 0; k < 64 && !best; k++) {
    const t = k / 64 * Math.PI * 2, x = centre.x + Math.cos(t) * rad, z = centre.z + Math.sin(t) * rad;
    if (clear(x, z, y, .75)) best = { x: +x.toFixed(2), z: +z.toFixed(2), y: surfaceNear(cellOf(x, z), y) };
  }
  spawns.push(best);
}
fs.writeFileSync(path.join(root, 'assets/models/poorna-market-nav.bin'), Buffer.concat([Buffer.from(surf.buffer), Buffer.from(block.buffer)]));
const header = { version: 1, cell: CELL, bin: BIN, bins: BINS, maxSurfaces: MAXS, minX, minZ, nx, nz, levels, bands, spawns, tables, triangles: tris };
fs.writeFileSync(path.join(root, 'assets/models/poorna-market-nav.json'), JSON.stringify(header));
console.log(`nav ${nx}x${nz} cells, ${tris} triangles, ${tables.length} counters, spawns`, spawns);
