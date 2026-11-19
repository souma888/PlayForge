# Architecture

## Foundation

Next.js App Router and React provide the catalog, profiles, navigation and server endpoints.
Strict TypeScript defines the platform/game boundary. Motion handles component and layout
transitions; CSS handles small interaction effects. One app keeps initial Vercel deployment
simple. Extract workspace packages only when another app or service actually shares code.

## Games beyond minigames

GameManifest describes genre, rendering, controls, play modes and save-format version.
GameModule creates a runtime with start/pause/resume/resize/dispose lifecycle methods.
The lazy registry imports only the selected title. These contracts are a foundation;
the host, engine adapters, saves and actual games are not implemented yet.

Use Phaser for suitable 2D games, Three.js / React Three Fiber for suitable 3D worlds,
and engine-specific WebAssembly or sandbox integrations where appropriate. These are
planned options, not installed dependencies. Avoid forcing every title into one engine.
Keep simulation updates outside React; send coarse HUD snapshots to the UI. Use fixed
simulation steps where needed, worker-based AI/pathfinding, capped device-pixel ratios,
quality tiers and capability checks. WebGPU titles need a supported fallback or a clear
compatibility screen. Gamepad, touch and keyboard support must be declared per title.

## Online services

Vercel hosts the platform and stateless HTTP APIs. Identity, durable storage, asset storage,
matchmaking and room infrastructure are selected and provisioned when their features are
implemented. Nothing currently pretends to provide them. Keep transport and persistence
behind interfaces. Evaluate current Vercel realtime support against the actual title's tick
rate, room lifetime, latency and concurrency requirements; use dedicated authoritative
room servers when those requirements demand them. Never store shared room state in
process-local Next.js memory or treat browser-submitted scores as trusted results.

## Creator content

Begin with validated declarative level data for a supported title. Version schemas and
enforce size/complexity limits. Player-authored executable code needs an isolated origin,
sandboxed frame, explicit message protocol and moderation before launch. It must never
execute inside the trusted platform shell.

## Growth sequence

1. Art-directed lobby and accessible navigation with motion primitives.
2. A complete game host and one substantial title, validating the lifecycle contracts.
3. Multiple genres and a 3D title; input, quality and asset-loading systems.
4. Real identity, persistence, achievements and verified score submission.
5. Authoritative multiplayer, matchmaking and tournaments.
6. Level tools, community publishing and moderation.

This is a sequencing guide, not a restriction on the eventual library.
