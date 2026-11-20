"use client";
import { useEffect, useRef } from "react";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { buildWorld } from "./build-world";
import type { DistrictId } from "./districts";

export interface SceneHandle {
  focus(id: DistrictId | null): void;
}
interface Props {
  apiRef: React.RefObject<SceneHandle | null>;
  onSelect(id: DistrictId): void;
  onReady(): void;
  onError(): void;
  paused: boolean;
  reducedMotion: boolean;
  quality: "high" | "low";
}

export default function WorldScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  }, [props]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      latest.current.onError();
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "3D world map. Drag to orbit, scroll to zoom. Use the district buttons for keyboard selection.",
    );
    const scene = new T.Scene();
    scene.background = new T.Color("#dcdde0");
    scene.fog = new T.Fog("#dcdde0", 42, 70);
    const camera = new T.PerspectiveCamera(35, 1, 0.5, 85);
    const home = new T.Vector3(8, 12, 22),
      target = new T.Vector3(-0.8, 0.7, 0);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.minDistance = 13;
    controls.maxDistance = 38;
    controls.minPolarAngle = 0.5;
    controls.maxPolarAngle = 1.35;
    controls.target.copy(target);
    camera.position.copy(home);
    controls.update();
    scene.add(new T.HemisphereLight("#d9e4f3", "#77776e", 1.5));
    const sun = new T.DirectionalLight("#fff0d8", 2.8);
    sun.position.set(-12, 22, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.normalBias = 0.045;
    scene.add(sun);
    const world = buildWorld();
    scene.add(world.root);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const ao = new SSAOPass(scene, camera, 512, 512, 16);
    ao.kernelRadius = 0.45;
    ao.minDistance = 0.0003;
    ao.maxDistance = 0.025;
    composer.addPass(ao);
    const output = new OutputPass();
    composer.addPass(output);
    let frame = 0,
      time = 0,
      previous = 0,
      visible = true,
      dead = false;
    new T.TextureLoader().load(
      "/textures/diorama-materials.webp",
      (atlas) => {
        if (dead) {
          atlas.dispose();
          return;
        }
        world.applyMaterialAtlas(atlas);
      },
      undefined,
      () => {
        /* The authored colors and procedural bump remain a usable fallback. */
      },
    );
    let flight: {
      from: T.Vector3;
      to: T.Vector3;
      fromTarget: T.Vector3;
      toTarget: T.Vector3;
      start: number;
    } | null = null;
    const api: SceneHandle = {
      focus(id) {
        const toTarget =
          id === "apex"
            ? new T.Vector3(-5, 0, 3.5)
            : id === "wilds"
              ? new T.Vector3(0.5, 4, -3.7)
              : id === "command"
                ? new T.Vector3(5, 1, 3.2)
                : target.clone();
        const to = id
          ? toTarget.clone().add(new T.Vector3(10, 10, 14))
          : home.clone();
        if (latest.current.reducedMotion) {
          camera.position.copy(to);
          controls.target.copy(toTarget);
          controls.update();
        } else
          flight = {
            from: camera.position.clone(),
            to,
            fromTarget: controls.target.clone(),
            toTarget,
            start: performance.now(),
          };
      },
    };
    props.apiRef.current = api;
    const resize = () => {
      const w = container.clientWidth,
        h = container.clientHeight;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      camera.aspect = w / h;
      // Fit the complete diorama on narrow screens instead of clipping its districts.
      camera.zoom = Math.min(1, camera.aspect / 1.35);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(container);
    const raycaster = new T.Raycaster(),
      pointer = new T.Vector2();
    let downX = 0,
      downY = 0;
    const down = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
      flight = null;
    };
    const up = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(world.root, true);
      let object: T.Object3D | null = hits[0]?.object || null;
      while (object) {
        if (object.userData.district) {
          latest.current.onSelect(object.userData.district as DistrictId);
          return;
        }
        object = object.parent;
      }
    };
    const lost = (event: Event) => {
      event.preventDefault();
      latest.current.onError();
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    function animate(now: number) {
      if (dead) return;
      frame = requestAnimationFrame(animate);
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (!visible || document.hidden) return;
      if (!latest.current.paused) time += delta;
      world.update(time);
      if (flight) {
        const p = Math.min((now - flight.start) / 1200, 1),
          ease = 1 - Math.pow(1 - p, 4);
        camera.position.lerpVectors(flight.from, flight.to, ease);
        controls.target.lerpVectors(flight.fromTarget, flight.toTarget, ease);
        if (p === 1) flight = null;
      }
      const ratio = Math.min(
        devicePixelRatio,
        latest.current.quality === "high" ? 1.75 : 1,
      );
      if (renderer.getPixelRatio() !== ratio) {
        renderer.setPixelRatio(ratio);
        composer.setPixelRatio(ratio);
      }
      const shadows = latest.current.quality === "high";
      if (renderer.shadowMap.enabled !== shadows) {
        renderer.shadowMap.enabled = shadows;
        scene.traverse((o) => {
          if (o instanceof T.Mesh) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => {
              m.needsUpdate = true;
            });
          }
        });
      }
      controls.update();
      ao.enabled = shadows;
      composer.render();
    }
    frame = requestAnimationFrame(animate);
    latest.current.onReady();
    return () => {
      dead = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      controls.dispose();
      props.apiRef.current = null;
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      const geometries = new Set<T.BufferGeometry>(),
        materials = new Set<T.Material>();
      scene.traverse((o) => {
        if (o instanceof T.Mesh) {
          geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      world.textures.forEach((texture) => texture.dispose());
      sun.shadow.dispose();
      ao.dispose();
      output.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // The scene has one lifetime; changing UI settings is read through latest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div className="world-canvas" ref={host} />;
}
