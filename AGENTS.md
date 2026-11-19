# Playforge

## Product direction
- Build a distinctive, ambitious browser gaming universe called Playforge.
- Support action, adventure, RPG, racing, sports, strategy, simulation, social and experimental games alongside arcade and puzzle games. Never narrow the platform to simple minigames.
- Prioritize polished UI/UX, expressive art direction, rich animations and deliberate transitions. Avoid generic dashboard templates and fabricated live activity.
- Motion must respect reduced-motion preferences, keyboard input, touch and gameplay performance. Audio starts only after user action.

## Architecture
- Next.js App Router, React, strict TypeScript, Node 24, npm and Vercel.
- Keep platform UI separate from rendering engines and game simulation. Load game engines per title on the client, never in the global shell.
- Use src/engine for shared runtime contracts and src/games for implementations. A game can use DOM, Canvas 2D, WebGL, WebGPU or a sandboxed external runtime.
- Keep per-frame updates out of React state. Dispose loops, audio, listeners and GPU resources when leaving a game.
- Multiplayer scores and tournament outcomes require server authority. Browser scores are untrusted.
- Community code must run in an isolated origin with explicit permissions, never in the platform's trusted execution context.
- Read docs/architecture.md and docs/design-direction.md before expanding the foundation.

## Validation and commits
- Run npm run check before pushing. Commit package-lock.json with dependency changes.
- Keep commits focused and use short, concrete, natural messages describing the change and its purpose.
- Never commit secrets, generated builds or fabricated test results.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
