import type { GameLoader, GameModule } from "./contracts";

/** Lazy loaders keep a title's rendering engine out of the platform bundle. */
export function createGameRegistry(loaders: Readonly<Record<string, GameLoader>>) {
  const entries = new Map(Object.entries(loaders));
  return {
    ids: () => [...entries.keys()],
    async load(id: string): Promise<GameModule> {
      const loader = entries.get(id);
      if (!loader) throw new Error(`Unknown game: ${id}`);
      const game = await loader();
      if (game.manifest.id !== id) throw new Error(`Game manifest ID mismatch: ${id}`);
      return game;
    },
  };
}
