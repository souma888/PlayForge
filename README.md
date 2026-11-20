# Playforge

A browser gaming universe built for ambitious games and expressive, motion-rich UI.
Action, adventure, RPG, racing, sports, strategy, simulation, social, arcade, puzzle and experimental experiences all belong here.

The homepage is an interactive Three.js world selector: three original procedural districts,
orbit/zoom controls, camera flights, moving racers, animated flags, quality and pause
controls, accessible district dialogs and browser-local saved worlds. It includes a motion provider,
lazy game registry, runtime contracts, tests and CI. Games, accounts,
multiplayer, tournaments and the creator editor are future implementation work.

The diorama includes fractured slate cliffs, a layered masonry fortress, forest and
village, trackside structures, arched viaducts and sculpted chess pieces. A generated
material atlas supplies slate, limestone, gravel and forest-floor textures. Static
geometry is batched by district/material; high quality adds screen-space ambient
occlusion. Low quality bypasses that pass and shadows.

## Run locally

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No credentials are required for the foundation.

```sh
npm run typecheck
npm test
npm run build
# All checks together:
npm run check
```

## Structure

```text
src/app/           Next.js routes, layouts and global styles
src/components/    Shared UI and motion configuration
src/styles/        Design tokens
src/features/      Platform feature modules
src/engine/        Renderer-independent contracts and lazy registry
src/games/         Per-title implementations and tests
public/games/      Small versioned assets, organized per title
docs/              Architecture, creative direction and deployment guide
.github/           CI and review template
```

## Deploy to Vercel

Import this GitHub repository in Vercel. Select **Next.js**, keep the root directory as
the repository root, use Node **24.x**, and retain the detected build/output settings.
The first build needs no environment variables. Vercel owns deployment; GitHub Actions
runs type checks, unit tests and a production build. See [deployment setup](docs/deployment.md)
for required checks and the distinction between CI validation and release gating.

Read [architecture](docs/architecture.md), [creative direction](docs/design-direction.md)
and [contributor guidance](AGENTS.md) before extending the platform.
