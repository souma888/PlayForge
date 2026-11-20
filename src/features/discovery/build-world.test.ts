import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { buildWorld } from "./build-world";

describe("procedural world", () => {
  it("builds a finite, raycastable scene and animates without invalid coordinates", () => {
    const world = buildWorld();
    const ids = world.root.children
      .map((child) => child.userData.district)
      .filter(Boolean);
    expect(ids.sort()).toEqual(["apex", "command", "wilds"]);
    for (const time of [0, 1, 1000]) {
      world.update(time);
      world.root.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(world.root);
      expect(bounds.isEmpty()).toBe(false);
      expect(
        [...bounds.min.toArray(), ...bounds.max.toArray()].every(
          Number.isFinite,
        ),
      ).toBe(true);
    }
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    world.root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        (Array.isArray(object.material)
          ? object.material
          : [object.material]
        ).forEach((material) => materials.add(material));
      }
    });
    // Atlas sampling must replace the Three.js include, before chunk expansion.
    // Replacing a texture lookup directly here silently shows all four materials.
    world.applyMaterialAtlas(new THREE.Texture());
    const cliffMaterial = [...materials].find(
      (material) => material.name === "cliff",
    ) as THREE.MeshStandardMaterial;
    expect(cliffMaterial.map).toBeTruthy();
    const shader = {
      fragmentShader: "#include <map_fragment>",
      vertexShader: "",
      uniforms: {},
    } as Parameters<typeof cliffMaterial.onBeforeCompile>[0];
    cliffMaterial.onBeforeCompile(shader, {} as THREE.WebGLRenderer);
    expect(shader.fragmentShader).not.toContain("#include <map_fragment>");
    expect(shader.fragmentShader).toContain("fract(vMapUv");
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    world.textures.forEach((texture) => texture.dispose());
  });
});
