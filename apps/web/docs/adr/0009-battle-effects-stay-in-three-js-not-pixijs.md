# Battle effects stay in Three.js, not PixiJS

All Battle effects are in the Three.js scene: skill casts, attacks, hits, movement and Statuses. The effects are flipbook billboards and particles in the `fx.ts` → `particle-layer.tsx` pipeline, and they use the `playback` clock. `effects-layer.tsx` draws only the damage numbers and the summon rings. Only screen-level effects, for example a full-screen flash or a vignette, are DOM and CSS with `motion`. We do not add PixiJS.

We did this because the Units and the Heroes are 3D (web ADR-0007), and an effect on a Unit or on the ground must have correct depth. For example, a flame on a back-Lane Unit must go behind a front-Lane Unit. PixiJS v8 can use the WebGL context of Three.js, but the two renderers draw separate layers and do not depth-sort with each other. A Pixi effect is always on top of the Units, or always under them.

## Considered Options

- **PixiJS as a canvas or a layer on top of the Three.js scene, for all effects.** Rejected. The depth is incorrect for all effects on a Unit or on the ground. Each frame must also project each world position to the screen, and Pixi must follow the camera shake, the resize and the device pixel ratio.
- **PixiJS only for screen-level effects.** Rejected. These effects are few and simple, and DOM and CSS can do them. A second renderer adds a bundle, a GL state reset in each frame (`resetState()`) and a second scene graph. Pixi masks also need a stencil buffer, and the Battle canvas sets `stencil: false`.
- **A particle library for Three.js, for example `three.quarks`.** Rejected for now. We need few particle types, and a small pool is sufficient. A library has its own update loop and clock, so the QA pause (`playback.paused`) and the speed ×2 are difficult.

## Consequences

- The effects are presets with keys from the rules data: a Damage Type, a Status, or an action (melee, ranged, cast, move). A card does not get its own effect, so a new card needs no new effect art.
- The look comes from single key images in one effects atlas, animated in code with scale, rotation, fade and UV scroll, and from additive glow sprites. Real multi-frame sprite sheets and bloom are later options, not the default.
- An effect can make the duration of its event longer, up to a fixed limit for each event. Speed ×2 halves the effect times. Skip shows no effects.
- With reduced motion, the effects keep their information and lose their motion. A Status loop becomes a static tint and its badge.
