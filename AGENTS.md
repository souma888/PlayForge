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
