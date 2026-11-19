/** Shared platform boundary; each game chooses its own simulation and renderer. */
export type GameGenre =
  | "action" | "adventure" | "rpg" | "racing" | "sports"
  | "strategy" | "simulation" | "social" | "arcade" | "puzzle" | "experimental";

export type Renderer = "dom" | "canvas2d" | "webgl" | "webgpu" | "sandbox";
export type InputMethod = "keyboard-mouse" | "touch" | "gamepad";
export type PlayMode = "solo" | "local-multiplayer" | "online-coop" | "online-competitive";

export interface GameManifest {
  id: string;
  title: string;
  genres: readonly GameGenre[];
  renderer: Renderer;
  inputs: readonly InputMethod[];
  modes: readonly PlayMode[];
  /** Version the game's save format independently of its release. */
  saveVersion: number;
}

export interface GameContext {
  container: HTMLElement;
  signal: AbortSignal;
  reducedMotion: boolean;
  /** Starts muted. An explicit user gesture can enable audio. */
  audioEnabled: boolean;
}

export interface GameRuntime {
  start(): void | Promise<void>;
  pause(): void;
  resume(): void;
  resize(width: number, height: number, pixelRatio: number): void;
  /** Must be safe to call repeatedly and release all owned resources. */
  dispose(): void | Promise<void>;
}

export interface GameModule {
  manifest: GameManifest;
  create(context: GameContext): Promise<GameRuntime>;
}

export type GameLoader = () => Promise<GameModule>;
