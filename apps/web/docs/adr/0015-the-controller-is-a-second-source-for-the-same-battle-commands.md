# The controller is a second source for the same Battle commands

The game reads a controller through the **Gamepad API** directly, with no third-party library. A pad in standard mapping becomes the same `BattleKeyCommand`s that the keyboard produces, so the Battle has one command path and one **Controls Guide**. The Town uses the same pad presses to move DOM focus, and the Building targets come from the painting rectangles that `SELECTABLE_BUILDINGS` already holds.

The Gamepad API is small and stable: standard mapping, button edges, a direction repeat, and hot-plug. The most downloaded wrapper, `joypad.js`, has no release since 2023 and no TypeScript types. `gamepad.js` has a 2026 release but no types. `gamepad-wrapper` is typed but very small. The two current packages, `@lizardbyte/gamepad-helper` and `@antha/gamepad-type`, solve only detection and button names. A library would add its own polling loop and its own input names for an API that fits in one module.

We keep key events and pad presses apart. A synthetic `KeyboardEvent` would hide the source of an input, cannot carry a controller button name, and makes the dead-zone and repeat rules invisible to the tests.

## Considered Options

- **`joypad.js`, `gamepad.js`, `gamepad-wrapper`, `gamepads`, `react-gamepad`.** Rejected. Stale or very small adoption, and most have no bundled TypeScript types. Each brings its own polling model.
- **Synthetic `KeyboardEvent`s for every input.** Rejected. It hides the input source, blocks per-pad button names, and turns the feel rules into a DOM trick.
- **One app-wide input vocabulary for every screen.** Rejected for v1. It touches every screen before the first playable result.
- **A hand-written focus graph for the Town.** Rejected. `SELECTABLE_BUILDINGS` already holds the painting rectangles, so the direction and the distance come from data.

## Consequences

- A new Battle action needs a key and a controller button. The Controls Guide shows both sets.
- Only pads with `mapping === "standard"` are supported. There is no remap screen.
- A Switch Pro Controller is out of scope: no test, no button labels, and no promise. Its id gets the generic labels, and it works only if the browser reports the standard mapping.
- The Town focus is geometric, so it follows the painting and not the DOM order.
- The Deck builder, the Workshop and the other dense screens stay keyboard and pointer only.
- Rumble is off in v1: Firefox has no `vibrationActuator`, and a vibration setting needs a motion-safety decision.
