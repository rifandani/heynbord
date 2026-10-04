# The Town is a layered 2D painting, not a 3D scene

The Town is a painted background plate with one cut-out image for each Building on top of it. Each Building that the Player can select is a React Aria button with a label from the Message Catalog. The Town has no Three.js `<Canvas>`. The 3D look stays in the Battle.

We did this because the target look is a painted town map, and a 2D painting from the AI image tool gets that look for one developer. The first screen does not load the Three.js chunk, so it is fast (Pillar 5), and it can preload the Battle chunk in the background. Each Building is a real DOM button, so keyboard, touch and screen readers work with no raycasting.

This changes GDD 11.1 ("a 3D camp scene with the Hero") and technical design 4.2 ("a small Canvas on the Camp screen").

## Considered Options

- **A 3D diorama in React Three Fiber, with a GLB for each Building.** Rejected. It needs about 10 good building models, it loads Three.js before the first screen, and AI 3D models do not easily get the warm painted look.
- **One flat painting with invisible hotspots.** Rejected. One Building cannot glow or lift on hover or focus, because it is not a separate image.

## Consequences

- The art starts as one master painting of the full Town, so all Buildings have the same light and style. Each selectable Building is cut out of it into its own layer, and the plate behind it is painted again. In v1, only the Town Gate has its own layer. The other Buildings stay in the plate until their screens come.
