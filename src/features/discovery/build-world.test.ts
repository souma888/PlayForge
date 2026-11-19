import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { buildWorld } from "./build-world";

describe("procedural world", () => {
  it("builds a finite, raycastable scene and animates without invalid coordinates", () => {
    const world = buildWorld();
    const ids = world.root.children.map((child) => child.userData.district).filter(Boolean);
    expect(ids.sort()).toEqual(["apex", "command", "wilds"]);
    for (const time of [0, 1, 1000]) {
      world.update(time);
      world.root.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(world.root);
      expect(bounds.isEmpty()).toBe(false);
      expect([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)).toBe(true);
    }
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    world.root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
  });
});
