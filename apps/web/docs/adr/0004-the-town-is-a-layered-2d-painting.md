# The Town is a 2D painting, not a 3D scene

The Town is one painted background plate. Each Building that the Player can select is a React Aria button over its part of the painting, with a label from the Message Catalog. Under the pointer or the focus, the label lifts onto a HUD plate and a soft light shows on the Building. The Town has no Three.js `<Canvas>`. The 3D look stays in the Battle.

We did this because the target look is a painted town map, and a 2D painting from the AI image tool gets that look for one developer. The first screen does not load the Three.js chunk, so it is fast (Pillar 5), and it can preload the Battle chunk in the background. Each Building is a real DOM button, so keyboard, touch and screen readers work with no raycasting.

This changes GDD 11.1 ("a 3D camp scene with the Hero") and technical design 4.2 ("a small Canvas on the Camp screen").

## Considered Options

- **A 3D diorama in React Three Fiber, with a GLB for each Building.** Rejected. It needs about 10 good building models, it loads Three.js before the first screen, and AI 3D models do not easily get the warm painted look.
- **One cut-out image for each Building on top of the plate**, so that the Building can grow and glow on hover and focus. First chosen, then removed. Each layer needed a cut by hand or a cut script, and each new painting needed all the cuts again. The label plate and the light show the hover clearly with no extra art.

## Consequences

- The art is one master painting of the full Town, so all Buildings have the same light and style. A new selectable Building needs no new art: only its box, its label box and, where its box covers another Building, a `clip-path` in `town.ts`.
- A new painting replaces one file. Only the boxes in `town.ts` change if the Buildings move.
