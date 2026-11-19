import * as T from "three";
import type { DistrictId } from "./districts";

/** Original procedural diorama. All geometry and materials are owned by the scene. */
export function buildWorld() {
  const root = new T.Group();
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const materials = new Map<string, T.MeshStandardMaterial>();
  const material = (color: string) => {
    if (!materials.has(color))
      materials.set(
        color,
        new T.MeshStandardMaterial({
          color,
          roughness: 0.87,
          flatShading: true,
        }),
      );
    return materials.get(color)!;
  };
  function mesh(
    parent: T.Object3D,
    geometry: T.BufferGeometry,
    color: string,
    x: number,
    y: number,
    z: number,
  ) {
    const object = new T.Mesh(geometry, material(color));
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  const box = (
    p: T.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: string,
  ) => mesh(p, new T.BoxGeometry(w, h, d), c, x, y, z);
  const cylinder = (
    p: T.Object3D,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    c: string,
    n = 8,
  ) => mesh(p, new T.CylinderGeometry(r, r, h, n), c, x, y, z);
  const flags: T.Mesh[] = [];
  function flag(p: T.Object3D, x: number, y: number, z: number, size = 1) {
    cylinder(p, x, y + 0.6 * size, z, 0.015 * size, 1.2 * size, "#57534c");
    const cloth = box(
      p,
      x + 0.18 * size,
      y + size,
      z,
      0.35 * size,
      0.45 * size,
      0.025,
      "#e8782e",
    );
    flags.push(cloth);
  }
  function tree(p: T.Object3D, x: number, y: number, z: number, s: number) {
    cylinder(p, x, y + s * 0.22, z, s * 0.045, s * 0.5, "#53483b", 5);
    for (let i = 0; i < 3; i++)
      mesh(
        p,
        new T.ConeGeometry(s * (0.3 - i * 0.055), s * 0.7, 6),
        i % 2 ? "#304b43" : "#24423a",
        x,
        y + s * (0.5 + i * 0.23),
        z,
      );
  }
  function island(
    id: DistrictId,
    x: number,
    y: number,
    z: number,
    radius: number,
    surface: string,
  ) {
    const group = new T.Group();
    group.position.set(x, y, z);
    group.userData.district = id;
    root.add(group);
    mesh(
      group,
      new T.CylinderGeometry(radius, radius * 0.92, 0.3, 11),
      surface,
      0,
      -0.15,
      0,
    );
    mesh(
      group,
      new T.CylinderGeometry(radius * 0.92, radius * 0.46, 2.4, 11),
      "#344c68",
      0,
      -1.5,
      0,
    );
    for (let i = 0; i < 48; i++) {
      const angle = random() * Math.PI * 2;
      const r = radius * (0.68 + random() * 0.28);
      const rock = mesh(
        group,
        new T.DodecahedronGeometry(0.25 + random() * 0.65, 0),
        i % 4 ? "#3e5873" : "#536c84",
        Math.cos(angle) * r,
        -0.5 - random() * 1.9,
        Math.sin(angle) * r,
      );
      rock.scale.set(0.65, 1.5 + random(), 0.8);
      rock.rotation.set(random(), random(), random());
    }
    return group;
  }
  const apex = island("apex", -4.2, 0, 2.5, 3.7, "#c98255");
  const wilds = island("wilds", 0.4, 1.5, -3.5, 3.9, "#717c68");
  const command = island("command", 4.2, 0.3, 2.6, 3.3, "#b9b8a9");

  // Sculpted switchback circuit with curb blocks and a moving miniature racer.
  const track = new T.CatmullRomCurve3(
    [
      new T.Vector3(-2.6, 0.12, 0.5),
      new T.Vector3(-2, 0.12, 2),
      new T.Vector3(0.1, 0.12, 2.6),
      new T.Vector3(2.5, 0.12, 1),
      new T.Vector3(1.3, 0.12, -0.2),
      new T.Vector3(-0.4, 0.12, 0.5),
      new T.Vector3(-1.2, 0.12, -0.8),
      new T.Vector3(0.2, 0.12, -2.4),
      new T.Vector3(2, 0.12, -1.9),
      new T.Vector3(1.7, 0.12, -0.8),
      new T.Vector3(-0.7, 0.12, -1.4),
      new T.Vector3(-2.7, 0.12, -1.5),
    ],
    true,
    "catmullrom",
    0.25,
  );
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= 240; i++) {
    const t = i / 240,
      point = track.getPointAt(t),
      tangent = track.getTangentAt(t);
    const normal = new T.Vector3(-tangent.z, 0, tangent.x).normalize();
    for (const side of [-1, 1])
      positions.push(
        point.x + normal.x * 0.28 * side,
        point.y,
        point.z + normal.z * 0.28 * side,
      );
    if (i < 240) {
      const n = i * 2;
      indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
    if (i % 3 === 0)
      for (const side of [-1, 1]) {
        const curb = box(
          apex,
          point.x + normal.x * 0.31 * side,
          0.14,
          point.z + normal.z * 0.31 * side,
          0.1,
          0.05,
          0.17,
          i % 2 ? "#eee6d6" : "#bc4735",
        );
        curb.rotation.y = Math.atan2(tangent.x, tangent.z);
      }
  }
  const road = new T.BufferGeometry();
  road.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  road.setIndex(indices);
  road.computeVertexNormals();
  mesh(apex, road, "#44484a", 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const p = track.getPointAt(i / 30),
      t = track.getTangentAt(i / 30);
    const dash = box(apex, p.x, 0.145, p.z, 0.025, 0.01, 0.13, "#eee5cf");
    dash.rotation.y = Math.atan2(t.x, t.z);
  }
  for (let i = 0; i < 15; i++) {
    const angle = random() * Math.PI * 2;
    const r = 2.9 + random() * 0.45;
    const stone = mesh(
      apex,
      new T.DodecahedronGeometry(0.25 + random() * 0.4),
      "#b56d46",
      Math.cos(angle) * r,
      0.15,
      Math.sin(angle) * r,
    );
    stone.scale.y = 1.2 + random();
  }
  // Grandstand, pit building and shade canopy.
  for (let i = 0; i < 4; i++)
    box(apex, -0.3, 0.2 + i * 0.12, -2.9 + i * 0.13, 2, 0.15, 0.4, "#d5c8af");
  box(apex, -0.3, 0.95, -2.8, 2.2, 0.09, 0.8, "#4a5354");
  for (const x of [-1.2, 0.6])
    cylinder(apex, x, 0.55, -2.8, 0.025, 0.85, "#555754");
  box(apex, -2.5, 0.3, -0.4, 0.6, 0.6, 0.6, "#d5c8af");
  flag(apex, -2.6, 0.6, -0.4);
  for (let i = 0; i < 5; i++) flag(apex, -1.4 + i * 0.55, 0, -3.1, 0.65);
  const car = new T.Group();
  apex.add(car);
  box(car, 0, 0.14, 0, 0.22, 0.13, 0.43, "#d73124");
  box(car, 0, 0.24, -0.02, 0.18, 0.1, 0.19, "#263c48");
  box(car, 0, 0.21, 0.22, 0.3, 0.03, 0.05, "#171d23");
  for (const x of [-0.13, 0.13])
    for (const z of [-0.13, 0.13]) {
      const wheel = cylinder(car, x, 0.1, z, 0.07, 0.05, "#202427", 8);
      wheel.rotation.z = Math.PI / 2;
    }

  // Mountain spires, dense conifers and an architectural citadel.
  for (let i = 0; i < 9; i++) {
    const mountain = mesh(
      wilds,
      new T.ConeGeometry(0.6 + random() * 0.7, 2 + random() * 2, 5),
      i % 2 ? "#4b6279" : "#354e69",
      -2 + random() * 4,
      1,
      -2 + random(),
    );
    mountain.rotation.y = random() * 3;
  }
  for (let i = 0; i < 85; i++) {
    const x = (random() - 0.5) * 6.6,
      z = (random() - 0.5) * 6;
    if (Math.abs(x) < 1.7 && Math.abs(z) < 1.5) continue;
    if (x * x + z * z > 10) continue;
    tree(wilds, x, 0, z, 0.5 + random() * 0.7);
  }
  box(wilds, 0, 0.18, 0, 3.4, 0.35, 2.6, "#9b9c91");
  function tower(x: number, z: number, h: number) {
    cylinder(wilds, x, h / 2 + 0.3, z, 0.36, h, "#c4c3b4");
    cylinder(wilds, x, h + 0.3, z, 0.43, 0.15, "#d5d0bd");
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      box(
        wilds,
        x + Math.cos(a) * 0.33,
        h + 0.47,
        z + Math.sin(a) * 0.33,
        0.13,
        0.23,
        0.13,
        "#ccc8b8",
      );
    }
    box(wilds, x, h * 0.7, z + 0.36, 0.1, 0.3, 0.025, "#414b4c");
  }
  for (const x of [-1.3, 1.3])
    for (const z of [-0.9, 0.9]) tower(x, z, 1.4 + random() * 0.6);
  box(wilds, 0, 0.85, 0.95, 2.4, 1.15, 0.22, "#b5b5a8");
  box(wilds, 0, 0.63, 1.08, 0.45, 0.85, 0.03, "#444a46");
  box(wilds, 0, 1.5, -0.3, 1.5, 2.4, 1.2, "#c5c2b3");
  tower(-0.45, -0.7, 3.2);
  tower(0.65, -0.6, 2.8);
  box(wilds, 0.05, 1.7, 0.33, 0.4, 1.3, 0.025, "#d7762c");
  flag(wilds, -0.45, 3.5, -0.7, 1.1);
  for (let i = 0; i < 9; i++)
    box(wilds, 0, 0.1 - i * 0.035, 1.5 + i * 0.12, 0.8, 0.12, 0.15, "#bdbba9");
  // Village at the foot of the castle.
  for (let i = 0; i < 6; i++) {
    const x = 1.2 + random() * 1.4,
      z = 1.6 + random() * 0.8;
    box(wilds, x, 0.22, z, 0.35, 0.42, 0.45, "#b6a88a");
    const roof = mesh(
      wilds,
      new T.ConeGeometry(0.38, 0.28, 4),
      "#625a44",
      x,
      0.54,
      z,
    );
    roof.rotation.y = Math.PI / 4;
  }

  // Command sector: stepped stone plaza and oversize chess sculptures.
  for (let i = 0; i < 3; i++)
    box(
      command,
      0,
      0.1 + i * 0.12,
      0,
      4.8 - i * 0.5,
      0.15,
      4.6 - i * 0.5,
      "#d6d2c3",
    );
  for (let x = 0; x < 6; x++)
    for (let z = 0; z < 6; z++)
      box(
        command,
        (x - 2.5) * 0.52,
        0.47,
        (z - 2.5) * 0.52,
        0.51,
        0.025,
        0.51,
        (x + z) % 2 ? "#a6aaa2" : "#e1ddcf",
      );
  box(command, 0, 0.85, -1.85, 2.8, 1.1, 0.65, "#bfbfb2");
  box(command, 0, 1.45, -1.85, 3, 0.15, 0.8, "#e4ddcb");
  for (const x of [-1.1, -0.55, 0, 0.55, 1.1]) {
    box(command, x, 0.95, -1.47, 0.16, 0.8, 0.18, "#e5decc");
    box(command, x, 0.95, -1.56, 0.22, 0.9, 0.07, "#737d7e");
  }
  for (const x of [-1.7, 1.7]) {
    box(command, x, 0.9, -1.5, 0.6, 1.6, 0.65, "#ccc9b9");
    for (const dx of [-0.2, 0.2])
      box(command, x + dx, 1.8, -1.5, 0.13, 0.25, 0.65, "#dcd5c3");
    flag(command, x, 1.8, -1.5, 0.7);
  }
  for (const [x, z, s] of [
    [-0.8, 0.4, 1],
    [0.8, -0.5, 0.75],
    [0.6, 1, 0.65],
  ]) {
    cylinder(command, x, 0.55, z, 0.24 * s, 0.12, "#d16d28");
    mesh(
      command,
      new T.ConeGeometry(0.18 * s, 0.55 * s, 12),
      "#e87c30",
      x,
      0.55 + 0.3 * s,
      z,
    );
    mesh(
      command,
      new T.SphereGeometry(0.16 * s, 12, 8),
      "#ed8c3e",
      x,
      0.55 + 0.65 * s,
      z,
    );
  }
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    tree(
      command,
      Math.cos(a) * 2.65,
      0,
      Math.sin(a) * 2.65,
      0.45 + random() * 0.25,
    );
  }

  // Arched viaducts tie the three districts into one navigable world.
  function bridge(a: T.Vector3, b: T.Vector3, width = 0.46) {
    const length = a.distanceTo(b),
      g = new T.Group();
    g.position.copy(a).lerp(b, 0.5);
    g.lookAt(b);
    root.add(g);
    box(g, 0, 0, 0, width, 0.14, length, "#b8b6a7");
    for (const x of [-width / 2, width / 2])
      box(g, x, 0.15, 0, 0.05, 0.2, length, "#d1ccba");
    for (let z = -length / 2 + 0.25; z < length / 2; z += 0.65) {
      box(g, 0, -0.8, z, width * 0.7, 1.5, 0.16, "#b6b4a7");
      const arch = mesh(
        g,
        new T.TorusGeometry(0.27, 0.065, 4, 10, Math.PI),
        "#c8c3b2",
        0,
        -0.43,
        z + 0.3,
      );
      arch.rotation.y = Math.PI / 2;
    }
  }
  bridge(new T.Vector3(-2.1, 0.1, 0.2), new T.Vector3(-1.5, 1.55, -1.2));
  bridge(new T.Vector3(-1, 0.1, 3.2), new T.Vector3(1.6, 0.4, 3.2));
  bridge(new T.Vector3(2.1, 1.55, -1), new T.Vector3(3.5, 0.4, 0.3));

  // Quiet background aqueduct, deliberately pale and architectural.
  const aqueduct = new T.Group();
  root.add(aqueduct);
  for (let i = 0; i < 16; i++) {
    const x = -16 + i * 2;
    box(aqueduct, x, -1, -9, 0.35, 5, 0.8, "#dcddd6");
    const arch = mesh(
      aqueduct,
      new T.TorusGeometry(0.83, 0.19, 5, 12, Math.PI),
      "#dcddd6",
      x + 1,
      0.3,
      -9,
    );
    arch.rotation.z = 0;
  }
  box(aqueduct, 0, 1.5, -9, 34, 0.35, 0.9, "#e0e1da");

  const birds = new T.Group();
  root.add(birds);
  for (let i = 0; i < 5; i++) {
    const wing = mesh(
      birds,
      new T.ConeGeometry(0.08, 0.3, 3),
      "#526365",
      i * 0.4,
      5 + (i % 2) * 0.2,
      -3 + i * 0.25,
    );
    wing.rotation.z = Math.PI / 2;
  }
  return {
    root,
    update(time: number) {
      const t = (time * 0.035) % 1,
        p = track.getPointAt(t),
        tangent = track.getTangentAt(t);
      car.position.copy(p);
      car.rotation.y = Math.atan2(tangent.x, tangent.z);
      flags.forEach((flag, i) => {
        flag.rotation.y = Math.sin(time * 2 + i) * 0.14;
      });
      birds.position.set(
        Math.sin(time * 0.12) * 2,
        Math.sin(time * 0.4) * 0.15,
        Math.cos(time * 0.12),
      );
    },
  };
}
