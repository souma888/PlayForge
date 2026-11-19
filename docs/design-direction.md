# Creative direction

Playforge should feel like a place players want to inhabit: cinematic, tactile and intense.
The chosen World Select direction uses pale mineral surfaces, black condensed editorial
type, terracotta accents and an original interactive 3D diorama. The Apex District,
The Wilds and Command Sector represent the breadth of games. Give genres and titles their
own identities within a consistent platform shell. Avoid generic card grids, decorative
statistics and fabricated online-player counts. The homepage scene uses Three.js procedural
geometry, drag/zoom controls and animated camera focus. District panels and saved worlds
work locally; games and the creator workshop remain in development.

## Motion language

- UI feedback: roughly 120–180ms; clear hover, focus, selection and press responses.
- Panels and layout changes: roughly 250–450ms with deliberate easing.
- Scene entrances: orchestrate a few meaningful layers; keep primary actions available.
- Use Motion for component presence/layout and CSS for simple transforms and opacity.
- Introduce GSAP or a 3D scene only when a specific scene needs it, loaded on that route.
- Honor prefers-reduced-motion globally; use instant state changes or gentle opacity.
- Keep continuous decoration away from active gameplay; pause offscreen animations.
- Maintain readable text, visible focus, semantic controls, touch targets and keyboard paths.
- Sound is opt-in. Never delay navigation to finish an animation.

## Experience goals

Discovery, quick launch, immersive full-screen play, expressive profiles, competitive
progression and a creator workshop. Rich animation must reinforce those tasks. Review
desktop, mobile, slow loading, empty states, errors and reduced-motion experiences together.
