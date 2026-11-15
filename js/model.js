/* Supplied Poorna Market model (SketchUp → glTF): parsed straight into GPU instances.
   The file holds ~90k flat instance nodes over 447 meshes, so building one Object3D per node
   would cost far more memory than the geometry itself. */
window.MarketModel = (() => {
  // Material names come from the model; each maps to a tone from the site palette.
  const palette = {
    'Basic Wall:150 MM': ['#d7a98a', 'plaster'], 'Basic Wall:230 mm': ['#d7a98a', 'plaster'],
    'Basic Wall:parapet': ['#c1b29a'], 'Concrete': ['#b9ad95'], 'Basic Wall:top sheet 2': ['#b9ad95'],
    'Concrete, Cast-in-Place gray': ['#e2d6bd', 'plaster'], 'Toposolid:SITE': ['#a99b80'], 'Toposolid:EARTH': ['#5f7f4e'],
    'Floor:150': ['#cbbfa5'], 'Floor:300 MM': ['#cbbfa5'], 'Floor:10mm': ['#cbbfa5'], 'Floor:50 mm': ['#d6c7a6'],
    'BAMBOO': ['#c9a86a'], 'Basic Wall:CANE': ['#a07e4f', 'woven'], 'Floor:column timber': ['#9a6b42', 'wood'],
    'Wood - Dimensional Timber': ['#9a6b42', 'wood'], 'Basic Wall:top sheet': ['#b0844f', 'wood'], 'Floor:900 table': ['#b0844f', 'wood'],
    'Wood - Birch': ['#b0844f', 'wood'], '*3': ['#b0844f', 'wood'], '*6': ['#a46a3c'], '*8': ['#b0844f', 'wood'], '*11': ['#d6c7a6'],
    'Basic Roof:Roof_Pitched_38Tile-25Bat-0Felt-25bat-100Ins-150Truss-12PBd': ['#a95636'],
    '*9': ['#8fb3b8', 'window'], '*4': ['#2a0e1c'], '*5': ['#2a0e1c'], '*1': ['#4a2a1c'], '*7': ['#5b3a24'],
    '<Unnamed>': ['#5c625c', 'metal'], 'Porcelain': ['#efe6d2'], '*': ['#efe6d2'], '*2': ['#efe6d2'], '*10': ['#efe6d2']
  };
  // Long thin repeated members (bamboo poles, cane slats) are redrawn as 6-sided prisms of the same
  // extent: ~58k bamboo instances at full tessellation would be ~18M vertices per frame.
  function lean(T, geometry) {
    geometry.computeBoundingBox();
    const b = geometry.boundingBox, size = b.getSize(new T.Vector3()), centre = b.getCenter(new T.Vector3());
    const axes = [size.x, size.y, size.z], long = axes.indexOf(Math.max(...axes));
    const others = axes.filter((_, i) => i !== long), r = Math.max(.01, (others[0] + others[1]) / 4);
    let g;
    if (axes[long] > 3 * Math.max(...others)) {
      g = new T.CylinderGeometry(r, r, axes[long], 6, 1, true);
      if (long === 0) g.rotateZ(Math.PI / 2); else if (long === 2) g.rotateX(Math.PI / 2);
    } else g = new T.BoxGeometry(Math.max(size.x, .01), Math.max(size.y, .01), Math.max(size.z, .01));
    g.translate(centre.x, centre.y, centre.z);
    return g;
  }
  // The model carries no UVs; a planar projection by face direction lets plaster/wood grain read.
  function planarUV(T, geometry) {
    const p = geometry.attributes.position, n = geometry.attributes.normal, uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      const [u, v] = ay >= ax && ay >= az ? [p.getX(i), p.getZ(i)] : ax >= az ? [p.getZ(i), p.getY(i)] : [p.getX(i), p.getY(i)];
      uv[i * 2] = u / 2.5; uv[i * 2 + 1] = v / 2.5;
    }
    geometry.setAttribute('uv', new T.BufferAttribute(uv, 2));
  }

  async function load({ T, url, offset, mat }) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Model ${response.status}`);
    const buffer = await response.arrayBuffer(), view = new DataView(buffer);
    if (view.getUint32(0, true) !== 0x46546c67) throw new Error('Not a GLB file');
    const jsonLength = view.getUint32(12, true);
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength)));
    const binStart = 20 + jsonLength + 8;
    const read = (index, Type, width) => {
      const a = json.accessors[index], v = json.bufferViews[a.bufferView];
      const start = binStart + (v.byteOffset || 0) + (a.byteOffset || 0), stride = v.byteStride || width * Type.BYTES_PER_ELEMENT;
      if (stride === width * Type.BYTES_PER_ELEMENT) return new Type(buffer.slice(start, start + a.count * stride));
      const out = new Type(a.count * width), dv = new DataView(buffer, start);
      for (let i = 0; i < a.count; i++) for (let k = 0; k < width; k++) out[i * width + k] = dv.getFloat32(i * stride + k * 4, true);
      return out;
    };
    // Group node matrices by mesh.
    const instances = new Map();
    for (const node of json.nodes) {
      if (node.mesh == null) continue;
      if (!instances.has(node.mesh)) instances.set(node.mesh, []);
      instances.get(node.mesh).push(node.matrix || [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    }
    const group = new T.Group(), place = new T.Matrix4().makeTranslation(offset.x, 0, offset.z), m = new T.Matrix4();
    let drawnVertices = 0;
    // All instances are baked into one geometry per material: ~34 draw calls instead of ~450.
    // Indexed baking with plain loops: one geometry per material, no per-instance object churn.
    const baked = new Map(), nm = new T.Matrix3();
    const bake = (name, geometry, matrices) => {
      const P = geometry.attributes.position.array, N = geometry.attributes.normal.array, vc = P.length / 3;
      const I = geometry.index ? geometry.index.array : Uint32Array.from({ length: vc }, (_, i) => i);
      if (!baked.has(name)) baked.set(name, { parts: [], verts: 0, idx: 0 });
      const entry = baked.get(name);
      for (const e of matrices) {
        m.fromArray(e).premultiply(place); nm.getNormalMatrix(m); const a = m.elements, q = nm.elements;
        const pos = new Float32Array(P.length), nor = new Float32Array(N.length);
        for (let i = 0; i < P.length; i += 3) {
          const x = P[i], y = P[i + 1], z = P[i + 2], nx = N[i], ny = N[i + 1], nz = N[i + 2];
          pos[i] = a[0] * x + a[4] * y + a[8] * z + a[12]; pos[i + 1] = a[1] * x + a[5] * y + a[9] * z + a[13]; pos[i + 2] = a[2] * x + a[6] * y + a[10] * z + a[14];
          const tx = q[0] * nx + q[3] * ny + q[6] * nz, ty = q[1] * nx + q[4] * ny + q[7] * nz, tz = q[2] * nx + q[5] * ny + q[8] * nz, l = Math.hypot(tx, ty, tz) || 1;
          nor[i] = tx / l; nor[i + 1] = ty / l; nor[i + 2] = tz / l;
        }
        entry.parts.push([pos, nor, I, entry.verts]); entry.verts += vc; entry.idx += I.length;
      }
    };
    for (const [meshIndex, matrices] of instances) {
      const prim = json.meshes[meshIndex].primitives[0], source = json.materials[prim.material] || { name: '<Unnamed>' };
      let geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.BufferAttribute(read(prim.attributes.POSITION, Float32Array, 3), 3));
      if (prim.attributes.NORMAL != null) geometry.setAttribute('normal', new T.BufferAttribute(read(prim.attributes.NORMAL, Float32Array, 3), 3));
      else geometry.computeVertexNormals();
      if (prim.indices != null) geometry.setIndex(new T.BufferAttribute(read(prim.indices, Uint32Array, 1), 1));
      // Heavily repeated thin members are first slimmed to prisms, then everything is baked per material.
      if (matrices.length >= 150 && geometry.attributes.position.count > 40) { const g = lean(T, geometry); geometry.dispose(); geometry = g; }
      bake(source.name, geometry, matrices); geometry.dispose();
    }
    for (const [name, { parts, verts, idx }] of baked) {
      const position = new Float32Array(verts * 3), normal = new Float32Array(verts * 3), index = new Uint32Array(idx);
      let ii = 0; for (const [p, n, I, base] of parts) { position.set(p, base * 3); normal.set(n, base * 3); for (let k = 0; k < I.length; k++) index[ii++] = I[k] + base; }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.BufferAttribute(position, 3)); geometry.setAttribute('normal', new T.BufferAttribute(normal, 3));
      geometry.setIndex(new T.BufferAttribute(index, 1));
      planarUV(T, geometry); geometry.computeBoundingSphere();
      const [color, kind] = palette[name] || ['#d6c7a6'];
      const mesh = new T.Mesh(geometry, mat(color, kind));
      mesh.castShadow = kind !== 'window' && !/BAMBOO|CANE/.test(name); mesh.receiveShadow = kind !== 'window'; mesh.name = name; group.add(mesh);
      drawnVertices += verts;
    }
    group.userData = { nodes: json.nodes.length, meshes: instances.size, drawCalls: group.children.length, drawnVertices };
    return group;
  }
  return { load };
})();
