# Game modules

Each title owns its manifest, implementation, assets and tests in a named directory here.
Export a GameModule matching src/engine/contracts.ts and register a dynamic import through
createGameRegistry. No games are implemented in this foundation.

Choose rendering tools per title: Phaser for a suitable 2D title, Three.js / React Three Fiber
for a suitable 3D title, or another engine behind the same boundary. Install engines when
the first actual game needs them. Use workers for CPU-heavy AI, pathfinding and simulation.
