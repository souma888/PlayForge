import { describe, expect, it, vi } from "vitest";
import { createGameRegistry } from "./registry";
import type { GameModule } from "./contracts";

function moduleFor(id: string): GameModule {
  return {
    manifest: { id, title: id, genres: ["rpg"], renderer: "webgl", inputs: ["gamepad"], modes: ["solo"], saveVersion: 1 },
    create: vi.fn(),
  };
}

describe("game registry", () => {
  it("loads only the requested game engine", async () => {
    const racing = vi.fn(async () => moduleFor("racing"));
    const rpg = vi.fn(async () => moduleFor("rpg"));
    const registry = createGameRegistry({ racing, rpg });
    expect(registry.ids()).toEqual(["racing", "rpg"]);
    expect(racing).not.toHaveBeenCalled();
    expect(rpg).not.toHaveBeenCalled();
    expect((await registry.load("rpg")).manifest.renderer).toBe("webgl");
    expect(racing).not.toHaveBeenCalled();
    expect(rpg).toHaveBeenCalledOnce();
  });
  it("rejects unknown IDs including inherited object properties", async () => {
    const registry = createGameRegistry({});
    await expect(registry.load("missing")).rejects.toThrow("Unknown game");
    await expect(registry.load("toString")).rejects.toThrow("Unknown game");
  });
  it("rejects a loader returning a different title", async () => {
    const registry = createGameRegistry({ racing: async () => moduleFor("other") });
    await expect(registry.load("racing")).rejects.toThrow("manifest ID mismatch");
  });
});
