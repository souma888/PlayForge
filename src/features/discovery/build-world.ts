import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { DistrictId } from "./districts";

// Everything in this diorama is original geometry. Static details are baked by
// district and material so thousands of architectural parts need few draw calls.
export function buildWorld() {
  const root = new T.Group();
  let seed = 31861;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const noise = (x: number, z: number) =>
    Math.sin(x * 2.7 + z * 0.8) * 0.05 +
    Math.sin(z * 4.1 - x * 1.8) * 0.035 +
    Math.sin(x * 11 + z * 7) * 0.012;
  const stone = "#b2afa6",
    trim = "#d2caba",
    shadow = "#343c40",
    orange = "#d46a20";
  const textures: T.Texture[] = [];
  const grain = new Uint8Array(128 * 128 * 4);
  for (let i = 0; i < 128 * 128; i++) {
    const v = 125 + Math.floor(rand() * 130);
    grain.set([v, v, v, 255], i * 4);
  }
  const bump = new T.DataTexture(grain, 128, 128);
  bump.wrapS = bump.wrapT = T.RepeatWrapping;
  bump.repeat.set(4, 4);
  bump.needsUpdate = true;
  textures.push(bump);
  const mats = new Map<string, T.MeshStandardMaterial>();
  function mat(color: string) {
    if (!mats.has(color))
      mats.set(
        color,
        new T.MeshStandardMaterial({
          name: color,
          color,
          roughness: 0.91,
          bumpMap: bump,
          bumpScale: 0.018,
          flatShading: false,
        }),
      );
    return mats.get(color)!;
  }
  function mesh(
    p: T.Object3D,
    g: T.BufferGeometry,
    c: string,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const m = new T.Mesh(g, mat(c));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    p.add(m);
    return m;
  }
  const box = (
    p: T.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c = stone,
  ) => mesh(p, new T.BoxGeometry(w, h, d), c, x, y, z);
  const cyl = (
    p: T.Object3D,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    c = stone,
    n = 16,
    rt = r,
  ) => mesh(p, new T.CylinderGeometry(rt, r, h, n), c, x, y, z);
  function segment(
    p: T.Object3D,
    a: T.Vector3,
    b: T.Vector3,
    r: number,
    c: string,
  ) {
    const m = cyl(p, 0, 0, 0, r, a.distanceTo(b), c, 6);
    m.position.copy(a).lerp(b, 0.5);
    m.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      b.clone().sub(a).normalize(),
    );
    return m;
  }
  const flags: T.Mesh[] = [];
  function banner(
    p: T.Object3D,
    x: number,
    y: number,
    z: number,
    h = 1,
    s = 0.35,
  ) {
    cyl(p, x, y + h / 2, z, 0.012, h, "#625e50", 6);
    const g = new T.PlaneGeometry(s, h * 0.43, 8, 6),
      a = g.getAttribute("position");
    for (let i = 0; i < a.count; i++)
      a.setZ(i, Math.sin(a.getX(i) * 14) * 0.025);
    g.computeVertexNormals();
    const flag = mesh(p, g, orange, x + s / 2, y + h * 0.75, z);
    flag.material = mat(orange).clone();
    flag.material.side = T.DoubleSide;
    flags.push(flag);
    const sigil = mesh(
      p,
      new T.PlaneGeometry(s * 0.28, h * 0.15),
      "#e5ce9d",
      x + s * 0.52,
      y + h * 0.75,
      z + 0.035,
    );
    sigil.rotation.z = Math.PI / 4;
  }
  // Sharp, continuous blue rock faces with strata, cracks and ochre inclusions.
  function terrain(
    id: DistrictId,
    x: number,
    y: number,
    z: number,
    rx: number,
    rz: number,
    surface: string,
  ) {
    const group = new T.Group();
    group.position.set(x, y, z);
    group.userData.district = id;
    root.add(group);
    const N = 128,
      L = 22,
      positions: number[] = [],
      colors: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    const perimeter = Array.from(
      { length: N },
      (_, i) =>
        1 +
        0.09 * Math.sin((i / N) * Math.PI * 6) +
        0.055 * Math.cos((i / N) * Math.PI * 14),
    );
    for (let j = 0; j <= L; j++)
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2,
          fade = j / L,
          r =
            (1 + fade * 0.07) * perimeter[i] +
            (j === 0
              ? 0
              : Math.sin(a * 13 + j * 0.55) * 0.035 + (rand() - 0.5) * 0.035);
        const cx =
            Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.78),
          sz = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.78);
        positions.push(
          cx * rx * r,
          -fade * 4.5 +
            (j === 0 ? noise(cx * rx, sz * rz) : (rand() - 0.5) * 0.22),
          sz * rz * r,
        );
        uv.push(i / N, j / L);
        const c = new T.Color(
          rand() < 0.018
            ? "#a16a37"
            : ["#25466e", "#304e76", "#3f6086", "#264063", "#496989"][
                Math.floor(rand() * 5)
              ],
        );
        c.multiplyScalar(0.82 + rand() * 0.3);
        colors.push(c.r, c.g, c.b);
        if (j < L) {
          const n = j * N + i,
            q = j * N + ((i + 1) % N);
          indices.push(n, q, n + N, q, q + N, n + N);
        }
      }
    const geom = new T.BufferGeometry();
    geom.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    geom.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    geom.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    const cliff = mesh(group, geom, "#ffffff");
    cliff.material = new T.MeshStandardMaterial({
      name: "cliff",
      vertexColors: true,
      roughness: 1,
      flatShading: true,
      bumpMap: bump,
      bumpScale: 0.035,
    });
    const shape = new T.Shape();
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2,
        px =
          Math.sign(Math.cos(a)) *
          Math.pow(Math.abs(Math.cos(a)), 0.78) *
          rx *
          perimeter[i],
        pz =
          Math.sign(Math.sin(a)) *
          Math.pow(Math.abs(Math.sin(a)), 0.78) *
          rz *
          perimeter[i];
      if (i === 0) shape.moveTo(px, -pz);
      else shape.lineTo(px, -pz);
    }
    shape.closePath();
    const topGeometry = new T.ShapeGeometry(shape, 24);
    const topPositions = topGeometry.getAttribute("position"),
      topUV = topGeometry.getAttribute("uv");
    for (let i = 0; i < topPositions.count; i++)
      topUV.setXY(
        i,
        topPositions.getX(i) / (rx * 2) + 0.5,
        topPositions.getY(i) / (rz * 2) + 0.5,
      );
    const top = mesh(group, topGeometry, surface, 0, 0.025, 0);
    top.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 120; i++) {
      const a = rand() * Math.PI * 2,
        r = 0.92 + rand() * 0.07;
      const g = new T.DodecahedronGeometry(0.08 + rand() * 0.16, 0);
      const rock = mesh(
        group,
        g,
        id === "apex" ? "#b47951" : "#5a6d7c",
        Math.cos(a) * rx * r,
        0.06,
        Math.sin(a) * rz * r,
      );
      rock.scale.set(1, 0.6 + rand(), 1);
      rock.rotation.set(rand(), rand(), rand());
    }
    return group;
  }
  const apex = terrain("apex", -5.1, 0, 3.5, 4.5, 3.6, "#c18660");
  const wilds = terrain("wilds", 0.5, 2.35, -3.7, 4.5, 3.7, "#6b7461");
  const command = terrain("command", 5.1, 0.55, 3.2, 3.8, 3.25, "#9b9c8b");
  // Irregular rock masses are modeled as displaced surfaces, not giant loose boulders.
  function mountain(
    p: T.Object3D,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    c: string,
  ) {
    const g = new T.ConeGeometry(r, h, 11, 7);
    const a = g.getAttribute("position");
    for (let i = 0; i < a.count; i++) {
      const yy = a.getY(i);
      const xx = a.getX(i),
        zz = a.getZ(i),
        angle = Math.atan2(zz, xx);
      const ridge =
        1 +
        Math.sin(angle * 5 + yy * 4) * 0.22 +
        Math.sin(angle * 9 - yy * 2) * 0.12;
      a.setX(i, xx * ridge + Math.sin(yy * 2) * 0.13);
      a.setZ(i, zz * ridge + Math.cos(yy * 3) * 0.09);
      a.setY(i, yy + noise(xx * 5, zz * 5));
    }
    g.computeVertexNormals();
    const m = mesh(p, g, c, x, y + h / 2, z);
    m.rotation.y = rand() * 6;
    return m;
  }
  for (let i = 0; i < 14; i++)
    mountain(
      wilds,
      -2.6 + rand() * 5,
      0,
      -2.1 - rand() * 0.9,
      0.45 + rand() * 0.65,
      1.7 + rand() * 1.8,
      ["#355276", "#46627f", "#29496c"][i % 3],
    );
  for (let i = 0; i < 14; i++)
    mountain(
      apex,
      -3.9 + rand() * 1.5,
      0,
      -2.3 + rand() * 1.7,
      0.3 + rand() * 0.6,
      0.3 + rand() * 0.7,
      "#b6754d",
    );
  // Dense branched conifers: individual branch whorls and varied needle profiles.
  function pine(p: T.Object3D, x: number, y: number, z: number, h: number) {
    cyl(p, x, y + h * 0.48, z, 0.025, h * 0.95, "#68533f", 5, 0.012);
    for (let level = 0; level < 8; level++) {
      const t = level / 8,
        r = h * 0.25 * (1 - t) * (0.8 + rand() * 0.2),
        yy = y + h * (0.18 + t * 0.78);
      const foliage = mesh(
        p,
        new T.ConeGeometry(r, h * 0.3, 7, 1),
        ["#253e37", "#314b3d", "#405440", "#30493e"][level % 4],
        x,
        yy,
        z,
      );
      foliage.rotation.y = rand() * 6;
      for (let k = 0; k < 3; k++) {
        const a = k * 2.09 + level * 0.8;
        const branch = mesh(
          p,
          new T.ConeGeometry(r * 0.26, h * 0.23, 4),
          "#3a5140",
          x + Math.cos(a) * r * 0.6,
          yy - h * 0.04,
          z + Math.sin(a) * r * 0.6,
        );
        branch.rotation.z = Math.cos(a) * 0.6;
        branch.rotation.x = Math.sin(a) * 0.6;
      }
    }
  }
  for (let i = 0; i < 240; i++) {
    const x = (rand() - 0.5) * 8,
      z = (rand() - 0.5) * 6.3;
    if (
      (x * x) / 16 + (z * z) / 10 > 1 ||
      (Math.abs(x) < 1.65 && Math.abs(z) < 1.5)
    )
      continue;
    pine(wilds, x, 0.03, z, 0.5 + rand() * 0.95);
  }
  // Scree, exposed bedrock and scrub break up the forest floor at miniature scale.
  for (let i = 0; i < 520; i++) {
    const x = (rand() - 0.5) * 8,
      z = (rand() - 0.5) * 6.4;
    if (
      (x * x) / 15 + (z * z) / 9 > 1 ||
      (Math.abs(x) < 1.6 && Math.abs(z) < 1.4)
    )
      continue;
    const r = 0.025 + rand() * 0.095;
    const rock = mesh(
      wilds,
      new T.DodecahedronGeometry(r, 0),
      i % 3 ? "#818879" : "#a2a38f",
      x,
      0.04,
      z,
    );
    rock.scale.set(1, 0.4 + rand() * 0.4, 1);
    rock.rotation.y = rand() * 6;
  }
  // Water descending through the mountain and an old winding footpath.
  function ribbon(
    p: T.Object3D,
    points: T.Vector3[],
    width: number,
    color: string,
  ) {
    const curve = new T.CatmullRomCurve3(points),
      pos: number[] = [],
      uv: number[] = [],
      ix: number[] = [];
    for (let i = 0; i <= 160; i++) {
      const q = curve.getPointAt(i / 160),
        v = curve.getTangentAt(i / 160),
        n = new T.Vector3(-v.z, 0, v.x).normalize();
      for (const s of [-1, 1]) {
        pos.push(q.x + n.x * width * s, q.y, q.z + n.z * width * s);
        uv.push(i / 5, (s + 1) / 2);
      }
      if (i < 160) {
        const k = i * 2;
        ix.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.setIndex(ix);
    g.computeVertexNormals();
    mesh(p, g, color);
    return curve;
  }
  ribbon(
    wilds,
    [
      new T.Vector3(-2, 0.09, -2),
      new T.Vector3(-2.2, 0.1, -0.4),
      new T.Vector3(-1.8, 0.09, 1.6),
      new T.Vector3(-2.4, 0.09, 3.4),
    ],
    0.13,
    "#588d9c",
  );
  for (let i = 0; i < 8; i++)
    box(wilds, -2.4 + i * 0.025, -i * 0.18, 3.45, 0.19, 0.3, 0.06, "#81a4a9");
  ribbon(
    wilds,
    [
      new T.Vector3(0, 0.09, 1.2),
      new T.Vector3(0.3, 0.09, 1.8),
      new T.Vector3(1.7, 0.09, 2.5),
      new T.Vector3(3, 0.09, 1.3),
    ],
    0.11,
    "#a49b80",
  );
  // Walls with masonry courses, corbels, arrow slits, buttresses and parapets.
  function masonry(
    p: T.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c = stone,
  ) {
    box(p, x, y + h / 2, z, w, h, d, c);
    for (let row = 0; row < Math.floor(h / 0.16); row++) {
      const yy = y + 0.08 + row * 0.16;
      box(p, x, yy, z + d / 2 + 0.002, w, 0.009, 0.006, "#7d807b");
      for (let k = 0; k < w / 0.24; k++)
        box(
          p,
          x - w / 2 + (k + 0.5 + (row % 2) * 0.5) * 0.24,
          yy + 0.07,
          z + d / 2 + 0.005,
          0.008,
          0.13,
          0.006,
          "#8b8d83",
        );
    }
    box(p, x, y + h + 0.025, z, w + 0.06, 0.05, d + 0.06, trim);
  }
  function slit(
    p: T.Object3D,
    x: number,
    y: number,
    z: number,
    w = 0.075,
    h = 0.25,
  ) {
    box(p, x, y, z, w + 0.04, h + 0.04, 0.035, trim);
    box(p, x, y, z + 0.022, w, h, 0.012, shadow);
  }
  function crenels(
    p: T.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    d = 0.14,
  ) {
    for (let i = 0; i < Math.ceil(w / 0.22); i++)
      box(p, x - w / 2 + 0.1 + i * 0.22, y, z, 0.12, 0.19, d, trim);
  }
  function turret(
    p: T.Object3D,
    x: number,
    y: number,
    z: number,
    h: number,
    r = 0.3,
    roof = false,
  ) {
    cyl(p, x, y + h / 2, z, r, h, stone, 12);
    cyl(p, x, y + 0.12, z, r * 1.18, 0.24, "#979b94", 12);
    for (let j = 0; j < h / 0.22; j++)
      cyl(p, x, y + j * 0.22, z, r * 1.005, 0.012, "#969991", 12);
    cyl(p, x, y + h - 0.04, z, r * 1.16, 0.12, trim, 12);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      box(
        p,
        x + Math.cos(a) * r,
        y + h + 0.08,
        z + Math.sin(a) * r,
        0.11,
        0.2,
        0.11,
        trim,
      );
    }
    for (let yy = 0.55; yy < h - 0.2; yy += 0.6) {
      slit(p, x, y + yy, z + r * 0.99);
      slit(p, x + r * 0.97, y + yy, z, 0.05, 0.2);
    }
    if (roof) {
      mesh(
        p,
        new T.ConeGeometry(r * 1.12, 0.8, 12),
        "#5f6a6e",
        x,
        y + h + 0.4,
        z,
      );
      cyl(p, x, y + h + 0.92, z, 0.014, 0.3, "#a49c7c", 6);
    }
  }
  const fortress = new T.Group();
  wilds.add(fortress);
  fortress.scale.set(1.22, 0.95, 1.1);
  // The Wilds: a layered mountain fortress, tall central keep and ceremonial gate.
  for (let i = 0; i < 3; i++)
    box(
      fortress,
      0,
      0.08 + i * 0.1,
      0,
      3.6 - i * 0.12,
      0.15,
      2.65 - i * 0.1,
      "#8e938b",
    );
  masonry(fortress, 0, 0.3, 0.95, 2.7, 1.5, 0.27);
  crenels(fortress, 0, 1.92, 0.95, 2.8, 0.3);
  for (const x of [-1.4, 1.4]) {
    turret(fortress, x, 0.2, 0.95, 2.25, 0.33);
    masonry(fortress, x, 0.3, 0, 0.27, 1.4, 1.9);
  }
  masonry(fortress, 0, 0.3, -0.9, 2.8, 2, 0.28);
  crenels(fortress, 0, 2.4, -0.9, 2.9, 0.28);
  masonry(fortress, 0, 0.3, -0.2, 2, 3.6, 1.35, "#b8b6ac");
  masonry(fortress, 0, 3.9, -0.2, 1.5, 0.55, 1.15);
  crenels(fortress, 0, 4.53, 0.4, 1.6, 0.14);
  for (const x of [-1, 1])
    for (const z of [-0.9, 0.45])
      turret(fortress, x, 0.3, z, 4 + (z < 0 ? 0.4 : 0), 0.22, false);
  turret(fortress, -0.25, 4.2, -0.35, 1.1, 0.22, false);
  for (const x of [-0.48, 0, 0.48])
    for (const y of [1.5, 2.2, 2.9, 3.4])
      slit(fortress, x, y, 0.49, 0.09, 0.32);
  for (const x of [-1.1, -0.8, 0.8, 1.1]) {
    box(fortress, x, 1, 0.985, 0.14, 1.7, 0.4, "#969b92");
    slit(fortress, x, 1.5, 1.2, 0.04, 0.2);
  }
  // Deep gate surround and curved archivolt, with visible timber doors.
  box(fortress, 0, 0.82, 1.1, 0.53, 0.95, 0.07, "#383f3b");
  for (const x of [-0.3, 0.3])
    box(fortress, x, 0.85, 1.16, 0.12, 1.1, 0.15, trim);
  const gate = mesh(
    fortress,
    new T.TorusGeometry(0.3, 0.065, 6, 16, Math.PI),
    trim,
    0,
    1.35,
    1.19,
  );
  for (let i = 0; i < 6; i++)
    box(fortress, -0.22 + i * 0.088, 0.79, 1.15, 0.075, 0.8, 0.025, "#655c49");
  for (let i = 0; i < 18; i++)
    box(
      fortress,
      0,
      0.25 - i * 0.011,
      1.28 + i * 0.05,
      0.8,
      0.08,
      0.065,
      "#bab4a2",
    );
  banner(fortress, 0.25, 2.5, 0.52, 1.85, 0.65);
  banner(fortress, -1.4, 2.4, 0.95, 0.8, 0.23);
  // Armored gate guardians on plinths, with shields and upright swords.
  for (const x of [-0.76, 0.76]) {
    box(fortress, x, 0.43, 1.43, 0.32, 0.22, 0.34, "#939995");
    cyl(fortress, x, 0.64, 1.43, 0.12, 0.2, "#777f7e", 8);
    mesh(fortress, new T.SphereGeometry(0.1, 8, 6), "#727d7e", x, 1.1, 1.43);
    mesh(
      fortress,
      new T.CylinderGeometry(0.14, 0.1, 0.32, 8),
      "#778380",
      x,
      0.88,
      1.43,
    );
    for (const dx of [-0.06, 0.06])
      box(fortress, x + dx, 0.65, 1.43, 0.065, 0.25, 0.09, "#6e7979");
    segment(
      fortress,
      new T.Vector3(x - 0.11, 0.98, 1.43),
      new T.Vector3(x - 0.17, 0.8, 1.52),
      0.035,
      "#7d8784",
    );
    box(fortress, x + 0.14, 0.84, 1.54, 0.18, 0.28, 0.035, "#6d7978");
    box(fortress, x - 0.18, 0.96, 1.52, 0.018, 0.65, 0.025, "#b1b5a8");
  }
  // Timber village, windows, chimneys, roof shingles and village smoke.
  const smoke: T.Mesh[] = [];
  for (let i = 0; i < 11; i++) {
    const x = 1.55 + (i % 4) * 0.48,
      z = 1.35 + Math.floor(i / 4) * 0.5;
    const h = 0.28 + rand() * 0.2;
    box(wilds, x, h / 2, z, 0.36, h, 0.38, "#b5a485");
    const roof = mesh(
      wilds,
      new T.ConeGeometry(0.31, 0.28, 4),
      "#605a42",
      x,
      h + 0.13,
      z,
    );
    roof.rotation.y = Math.PI / 4;
    box(wilds, x, 0.13, z + 0.2, 0.08, 0.17, 0.01, "#554e3c");
    box(wilds, x + 0.11, h * 0.65, z + 0.2, 0.06, 0.07, 0.012, "#d9b568");
    box(wilds, x - 0.13, h + 0.12, z - 0.08, 0.055, 0.3, 0.06, "#a19c88");
    for (let k = 0; k < 4; k++) {
      const puff = mesh(
        wilds,
        new T.SphereGeometry(0.045 + k * 0.013, 6, 4),
        "#b9bdb3",
        x - 0.13,
        h + 0.35 + k * 0.09,
        z - 0.08,
      );
      puff.userData.base = puff.position.clone();
      smoke.push(puff);
    }
  }
  // Apex: a smooth sweeping tarmac circuit, painted curbs and banked retaining walls.
  const trackPoints = [
    [-3.1, 0.16, 1.1],
    [-2, 0.16, 2.4],
    [0.3, 0.16, 2.55],
    [2.8, 0.16, 1.3],
    [1.6, 0.16, 0.15],
    [-0.3, 0.16, 0.4],
    [-1.5, 0.16, -0.45],
    [-0.3, 0.16, -2.25],
    [1.9, 0.16, -2.1],
    [2.6, 0.16, -1],
    [0.8, 0.16, -0.7],
    [-1.2, 0.16, -1.5],
    [-3, 0.16, -1.3],
  ].map((p) => new T.Vector3(...(p as [number, number, number])));
  const track = new T.CatmullRomCurve3(trackPoints, true, "catmullrom", 0.3);
  const pos: number[] = [],
    uv: number[] = [],
    ix: number[] = [];
  for (let i = 0; i <= 600; i++) {
    const p = track.getPointAt(i / 600),
      t = track.getTangentAt(i / 600),
      n = new T.Vector3(-t.z, 0, t.x).normalize();
    for (const s of [-1, 1]) {
      pos.push(p.x + n.x * 0.32 * s, p.y, p.z + n.z * 0.32 * s);
      uv.push(i / 20, (s + 1) / 2);
    }
    if (i < 600) {
      const k = i * 2;
      ix.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
    if (i % 3 === 0)
      for (const side of [-1, 1]) {
        const curb = box(
          apex,
          p.x + n.x * 0.35 * side,
          0.16,
          p.z + n.z * 0.35 * side,
          0.085,
          0.035,
          0.13,
          i % 2 ? "#d9d4bf" : "#bc3a2d",
        );
        curb.rotation.y = Math.atan2(t.x, t.z);
        if (i % 6 === 0) {
          const wall = box(
            apex,
            p.x + n.x * 0.43 * side,
            0.07,
            p.z + n.z * 0.43 * side,
            0.05,
            0.18,
            0.23,
            "#a9a18d",
          );
          wall.rotation.y = curb.rotation.y;
        }
      }
    if (i % 12 === 0) {
      const dash = box(apex, p.x, 0.168, p.z, 0.025, 0.005, 0.13, "#d9ce9f");
      dash.rotation.y = Math.atan2(t.x, t.z);
    }
  }
  const road = new T.BufferGeometry();
  road.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  road.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  road.setIndex(ix);
  road.computeVertexNormals();
  mesh(apex, road, "#373d40");
  // Grandstand: stepped seating, roof trusses, columns, pit garages and orange awnings.
  for (let i = 0; i < 9; i++)
    box(
      apex,
      -0.6,
      0.16 + i * 0.07,
      -2.5 - i * 0.075,
      2.8,
      0.09,
      0.16,
      i % 2 ? "#a9a597" : "#bcb5a4",
    );
  const canopy = box(apex, -0.6, 1.03, -2.9, 3.15, 0.055, 1.05, "#525a5c");
  canopy.rotation.x = -0.1;
  for (let i = 0; i < 8; i++) {
    const x = -1.95 + i * 0.38;
    cyl(apex, x, 0.6, -3.12, 0.018, 1.1, "#606462", 6);
    segment(
      apex,
      new T.Vector3(x, 0.66, -3.12),
      new T.Vector3(x, 1.02, -2.5),
      0.012,
      "#646c68",
    );
  }
  for (let i = 0; i < 6; i++) {
    box(apex, -1.7 + i * 0.43, 0.2, -2.45, 0.37, 0.35, 0.4, "#aaa798");
    box(apex, -1.7 + i * 0.43, 0.17, -2.23, 0.28, 0.24, 0.015, "#484f4e");
  }
  for (let i = 0; i < 3; i++) {
    const x = -2.9 + i * 0.65;
    box(apex, x, 0.2, 0.3, 0.45, 0.4, 0.45, "#a79d83");
    const tent = mesh(
      apex,
      new T.ConeGeometry(0.43, 0.2, 4),
      "#d47a29",
      x,
      0.75,
      0.3,
    );
    tent.rotation.y = Math.PI / 4;
    for (const dx of [-0.3, 0.3])
      cyl(apex, x + dx, 0.4, 0.3, 0.012, 0.7, "#6c6552", 6);
  }
  for (let i = 0; i < 10; i++)
    banner(apex, -3.1 + i * 0.67, 0, -3.2, 0.7, 0.17);
  // Trackside fences and small dry scrub clusters.
  for (let i = 0; i < 95; i++) {
    const a = rand() * Math.PI * 2,
      r = 0.75 + rand() * 0.2,
      x = Math.cos(a) * 4.25 * r,
      z = Math.sin(a) * 3.3 * r;
    if (Math.abs(z) < 2.8 && Math.abs(x) < 3.2) continue;
    mesh(
      apex,
      new T.DodecahedronGeometry(0.025 + rand() * 0.05, 0),
      "#8c784d",
      x,
      0.06,
      z,
    );
  }
  const cars: T.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const car = new T.Group();
    car.userData.dynamic = true;
    apex.add(car);
    cars.push(car);
    const color = ["#be2f22", "#e1d9c2", "#d0902c"][i];
    box(car, 0, 0.095, 0, 0.18, 0.07, 0.37, color);
    box(car, 0, 0.15, -0.015, 0.145, 0.07, 0.18, "#283f4a");
    box(car, 0, 0.19, -0.02, 0.14, 0.015, 0.13, color);
    box(car, 0, 0.12, 0.17, 0.22, 0.025, 0.04, "#282c2d");
    for (const x of [-0.1, 0.1])
      for (const z of [-0.11, 0.11]) {
        const tire = cyl(car, x, 0.07, z, 0.045, 0.035, "#252a2a", 12);
        tire.rotation.z = Math.PI / 2;
      }
    for (const x of [-0.055, 0.055])
      box(car, x, 0.1, -0.19, 0.04, 0.02, 0.01, "#e6ddaa");
  }
  // Command: stepped podium, paved courtyards, carved temple and cypress avenues.
  for (let i = 0; i < 6; i++)
    box(
      command,
      0,
      0.04 + i * 0.07,
      0,
      5.5 - i * 0.18,
      0.1,
      4.9 - i * 0.18,
      i % 2 ? "#b4b2a6" : "#c6c0b1",
    );
  for (let x = 0; x < 10; x++)
    for (let z = 0; z < 8; z++)
      box(
        command,
        (x - 4.5) * 0.45,
        0.47,
        (z - 3.5) * 0.45,
        0.444,
        0.025,
        0.444,
        (x + z) % 2 ? "#999f99" : "#cac8bc",
      );
  function palace(x: number, z: number, w: number, h: number, d: number) {
    masonry(command, x, 0.45, z, w, h, d, "#b9b8af");
    for (const side of [-1, 1]) {
      box(
        command,
        x + (side * w) / 2,
        0.55 + h / 2,
        z,
        0.12,
        h + 0.15,
        d + 0.16,
        trim,
      );
      for (let yy = 0.8; yy < h + 0.3; yy += 0.4)
        slit(command, x + side * w * 0.26, yy, z + d / 2 + 0.025, 0.1, 0.23);
    }
    for (let i = 0; i < 3; i++)
      box(
        command,
        x,
        0.45 + h + i * 0.07,
        z,
        w + 0.18 - i * 0.09,
        0.07,
        d + 0.18 - i * 0.09,
        trim,
      );
    crenels(command, x, 0.45 + h + 0.3, z + d / 2, w, 0.13);
  }
  palace(0, -1.65, 2.7, 1.2, 0.8);
  palace(0, -1.7, 1.35, 2.4, 0.8);
  palace(0, -1.75, 0.65, 3.4, 0.65);
  for (const x of [-1.9, 1.9]) palace(x, -1.3, 0.65, 1.65, 0.7);
  for (const x of [-2.1, 2.1]) palace(x, 0.2, 0.6, 0.8, 1.5);
  for (let i = 0; i < 9; i++) {
    const x = -1.4 + i * 0.35;
    box(command, x, 0.95, -1.17, 0.11, 0.95, 0.16, trim);
    box(command, x, 1.47, -1.1, 0.16, 0.08, 0.25, trim);
  }
  for (const x of [-1.5, 1.5]) banner(command, x, 0.8, -1.04, 1.2, 0.34);
  banner(command, 0, 1.75, -1.27, 1.7, 0.54);
  // Lathed chess pieces with collars, stems, rounded crowns and sculpted knight head.
  const profile = [
    new T.Vector2(0, 0),
    new T.Vector2(0.2, 0),
    new T.Vector2(0.23, 0.06),
    new T.Vector2(0.2, 0.12),
    new T.Vector2(0.14, 0.16),
    new T.Vector2(0.1, 0.25),
    new T.Vector2(0.08, 0.47),
    new T.Vector2(0.13, 0.51),
    new T.Vector2(0.13, 0.55),
    new T.Vector2(0.08, 0.57),
  ];
  for (const [x, z, s] of [
    [-0.9, 0.5, 1.1],
    [1, 0.15, 1],
    [0.6, 1.3, 0.65],
  ]) {
    const piece = new T.Group();
    command.add(piece);
    piece.position.set(x, 0.49, z);
    piece.scale.setScalar(s);
    mesh(piece, new T.LatheGeometry(profile, 24), orange);
    mesh(piece, new T.SphereGeometry(0.12, 20, 14), orange, 0, 0.67, 0);
  }
  // A sculpted knight profile and a crowned queen give each tactical piece a silhouette.
  const knight = new T.Group();
  command.add(knight);
  knight.position.set(-1.15, 0.49, 1.25);
  knight.scale.setScalar(1.2);
  mesh(knight, new T.LatheGeometry(profile.slice(0, 7), 24), orange);
  const horse = new T.Shape();
  horse.moveTo(-0.12, 0.3);
  horse.lineTo(-0.12, 0.68);
  horse.lineTo(-0.03, 0.88);
  horse.lineTo(0.02, 0.82);
  horse.lineTo(0.16, 0.76);
  horse.lineTo(0.25, 0.61);
  horse.lineTo(0.22, 0.55);
  horse.lineTo(0.07, 0.61);
  horse.lineTo(0.05, 0.48);
  horse.lineTo(0.14, 0.32);
  horse.closePath();
  const head = mesh(
    knight,
    new T.ExtrudeGeometry(horse, {
      depth: 0.14,
      bevelEnabled: true,
      bevelSize: 0.015,
      bevelThickness: 0.015,
      bevelSegments: 2,
      steps: 1,
    }),
    orange,
    0,
    0,
    -0.07,
  );
  mesh(
    knight,
    new T.SphereGeometry(0.013, 8, 6),
    "#6d391b",
    0.055,
    0.745,
    0.087,
  );
  const queen = new T.Group();
  command.add(queen);
  queen.position.set(1.2, 0.49, -0.65);
  queen.scale.setScalar(1.25);
  mesh(queen, new T.LatheGeometry(profile, 24), orange);
  cyl(queen, 0, 0.65, 0, 0.14, 0.2, orange, 24, 0.18);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const x = Math.cos(a) * 0.14,
      z = Math.sin(a) * 0.14;
    mesh(queen, new T.ConeGeometry(0.035, 0.16, 8), orange, x, 0.82, z);
    mesh(queen, new T.SphereGeometry(0.025, 8, 6), orange, x, 0.91, z);
  }
  // Cypress rather than pine trees surrounding the stone district.
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2,
      x = Math.cos(a) * 3.15,
      z = Math.sin(a) * 2.6;
    const h = 0.55 + rand() * 0.35;
    cyl(command, x, h / 2, z, 0.018, h, "#6c604a", 5);
    const crown = mesh(
      command,
      new T.SphereGeometry(0.14, 7, 7),
      "#3e4b33",
      x,
      h * 0.65,
      z,
    );
    crown.scale.set(1, 3, 1);
  }
  for (let i = 0; i < 22; i++) {
    const a = rand() * Math.PI * 2;
    box(
      command,
      Math.cos(a) * 2.8,
      0.1,
      Math.sin(a) * 2.35,
      0.15,
      0.08,
      0.2,
      "#7f8964",
    );
  }
  // Viaducts with actual arch openings, stone voussoirs and tiny balustrades.
  function bridge(a: T.Vector3, b: T.Vector3, width = 0.55, pale = false) {
    const length = a.distanceTo(b),
      g = new T.Group();
    g.position.copy(a).lerp(b, 0.5);
    g.lookAt(b);
    root.add(g);
    const c = pale ? "#ececee" : "#aaa99c";
    box(g, 0, 0, 0, width, 0.12, length, c);
    for (const x of [-width / 2, width / 2]) {
      box(g, x, 0.17, 0, 0.055, 0.045, length, c);
      for (let z = -length / 2; z < length / 2; z += 0.16)
        box(g, x, 0.09, z, 0.035, 0.15, 0.035, c);
    }
    for (let z = -length / 2 + 0.12; z < length / 2; z += 0.8) {
      box(g, 0, -1.05, z, width * 0.72, 2, 0.16, c);
      for (const x of [-width * 0.4, width * 0.4]) {
        const arch = mesh(
          g,
          new T.TorusGeometry(0.32, 0.075, 5, 16, Math.PI),
          c,
          x,
          -0.38,
          z + 0.4,
        );
        arch.rotation.y = Math.PI / 2;
        for (let i = 0; i < 9; i++) {
          const angle = (i / 8) * Math.PI;
          const block = box(
            g,
            x,
            -0.38 + Math.sin(angle) * 0.34,
            z + 0.4 + Math.cos(angle) * 0.34,
            0.08,
            0.09,
            0.12,
            pale ? c : trim,
          );
          block.rotation.x = angle;
        }
      }
    }
    return g;
  }
  bridge(new T.Vector3(-2.5, 0.14, 0.4), new T.Vector3(-1.5, 2.42, -1.3));
  bridge(new T.Vector3(-1.4, 0.14, 4), new T.Vector3(1.8, 0.69, 4));
  bridge(new T.Vector3(2.5, 2.42, -1), new T.Vector3(4, 0.69, 0.4));
  // Pale distant aqueducts frame the silhouette instead of dominating it.
  bridge(new T.Vector3(-18, 0, -12), new T.Vector3(18, 0, -12), 1, true);
  const backdrop = root.children[root.children.length - 1];
  backdrop.position.y = -0.9;
  backdrop.scale.y = 3;
  // Compact the static meshes in place, preserving district selection metadata.
  function batch(group: T.Object3D) {
    const buckets = new Map<T.Material, T.BufferGeometry[]>();
    const remove: T.Object3D[] = [];
    group.updateMatrixWorld(true);
    const inverse = group.matrixWorld.clone().invert();
    group.traverse((o) => {
      if (!(o instanceof T.Mesh) || Array.isArray(o.material)) return;
      let ancestor: T.Object3D | null = o;
      while (ancestor && ancestor !== group) {
        if (
          ancestor.userData.dynamic ||
          flags.includes(ancestor as T.Mesh) ||
          smoke.includes(ancestor as T.Mesh)
        )
          return;
        ancestor = ancestor.parent;
      }
      if (o.material.vertexColors) return;
      const g = o.geometry.index
        ? o.geometry.toNonIndexed()
        : o.geometry.clone();
      g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
      if (!g.getAttribute("uv"))
        g.setAttribute(
          "uv",
          new T.Float32BufferAttribute(
            new Float32Array(g.getAttribute("position").count * 2),
            2,
          ),
        );
      for (const key of Object.keys(g.attributes))
        if (!["position", "normal", "uv"].includes(key)) g.deleteAttribute(key);
      if (!buckets.has(o.material)) buckets.set(o.material, []);
      buckets.get(o.material)!.push(g);
      remove.push(o);
    });
    for (const o of remove) {
      (o as T.Mesh).geometry.dispose();
      o.removeFromParent();
    }
    for (const [material, parts] of buckets) {
      const g = mergeGeometries(parts);
      parts.forEach((p) => p.dispose());
      if (!g) throw new Error("Unable to batch world geometry");
      const m = new T.Mesh(g, material);
      m.castShadow = m.receiveShadow = true;
      group.add(m);
    }
  }
  batch(apex);
  batch(wilds);
  batch(command);
  // Bridges also share a static batch, while districts remain separate raycast targets.
  const scenery = new T.Group();
  for (const o of [...root.children]) if (!o.userData.district) scenery.add(o);
  root.add(scenery);
  batch(scenery);
  function applyMaterialAtlas(atlas: T.Texture) {
    atlas.colorSpace = T.SRGBColorSpace;
    textures.push(atlas);
    const maps = Array.from({ length: 4 }, () => {
      const t = atlas.clone();
      t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
      t.anisotropy = 8;
      t.needsUpdate = true;
      textures.push(t);
      return t;
    });
    const seen = new Set<T.Material>();
    root.traverse((o) => {
      if (!(o instanceof T.Mesh)) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!(m instanceof T.MeshStandardMaterial) || seen.has(m)) continue;
        seen.add(m);
        let index = -1;
        if (["cliff", "#355276", "#46627f", "#29496c"].includes(m.name))
          index = 0;
        else if (
          [
            "#b2afa6",
            "#b8b6ac",
            "#b9b8af",
            "#b4b2a6",
            "#c6c0b1",
            "#c6c0b1",
            "#d2caba",
            "#aaa99c",
          ].includes(m.name)
        )
          index = 1;
        else if (["#c18660", "#b6754d", "#b47951"].includes(m.name)) index = 2;
        else if (m.name === "#6b7461") index = 3;
        if (index < 0) continue;
        m.map = maps[index];
        m.color.set(index === 0 ? "#91b0e1" : "#ffffff");
        const atlasIndex = index;
        m.onBeforeCompile = (shader) => {
          const repeats = atlasIndex === 0 ? "vec2(7.0, 1.2)" : "vec2(1.0)";
          const offset = `vec2(${atlasIndex % 2 === 0 ? "0.005" : "0.505"}, ${atlasIndex < 2 ? "0.505" : "0.005"})`;
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <map_fragment>",
            T.ShaderChunk.map_fragment.replace(
              "texture2D( map, vMapUv )",
              `texture2D( map, ${offset} + fract(vMapUv * ${repeats}) * 0.49 )`,
            ),
          );
        };
        m.customProgramCacheKey = () => `diorama-atlas-${atlasIndex}`;
        if (index === 0) m.vertexColors = false;
        m.needsUpdate = true;
      }
    });
  }
  return {
    root,
    textures,
    applyMaterialAtlas,
    update(time: number) {
      cars.forEach((car, i) => {
        const t = (time * (0.025 + i * 0.003) + i * 0.32) % 1,
          p = track.getPointAt(t),
          v = track.getTangentAt(t);
        car.position.copy(p);
        car.rotation.y = Math.atan2(v.x, v.z);
      });
      flags.forEach((flag, i) => {
        flag.rotation.y = Math.sin(time * 1.8 + i) * 0.1;
      });
      smoke.forEach((p, i) => {
        const base = p.userData.base as T.Vector3;
        p.position.copy(base);
        p.position.x += Math.sin(time * 0.7 + i) * 0.04;
        p.position.y += Math.sin(time + i) * 0.025;
      });
    },
  };
}
