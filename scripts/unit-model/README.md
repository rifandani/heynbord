# Unit Model packing

Keep Blender exports in `apps/web/art/units/raw`. Publish only the packed files.

```sh
rtk bun run unit-model:pack warden-saelith
rtk bun run unit-model:pack --all
rtk bun test scripts/unit-model/model-check.test.ts
rtk bun run web:test:unit unit-model-pack.unit.test.ts
```

The packer applies Meshopt compression at the medium level. It checks the raw model, then checks and decodes the exact compressed bytes before publication. It retains the 1,572,864 byte, 8,000 triangle, 30 bone, one material and one image limits. Embedded images must not exceed 1024 × 1024 px. Every primitive needs compressed geometry. An extension declaration alone does not pass. The required base clips must remain present and unknown clips fail.

The current 98 models (96 cards and 2 Tokens) use vertex colors and no images. Those texture-free models need no external decoder asset. The game uses the Meshopt decoder included in its JavaScript. For a model with KTX2 images, the loader detects device support and loads the local Basis transcoder. If a model has images, its published images must use KTX2 and its textures must use `KHR_texture_basisu`. Convert such images before packing. An opaque PNG or JPEG does not pass publication checks.

On 2026-10-30 the published models decreased from 35,243,464 to 18,456,628 bytes, a reduction of 47.63%. The raw exports did not change. Tests load each published model with the game's Three.js loader and check its vertex colors and skinning attributes, then compare its bounds, skin bone counts and animation data with the committed source contract. All 96 models retained exact clip durations and keyframe data. Bounds changed by less than 0.001 scene units. Each clip produced a finite posed bound.

The packing API follows the [glTF Transform Meshopt documentation](https://gltf-transform.dev/modules/functions/functions/meshopt).

CI uses committed source contracts in `source-contracts.json`; it does not need the ignored raw exports. The packer refreshes the contract of each model it packs. Each contract has source bounds, skin bone counts, clip durations and a SHA-256 digest of animation track names, interpolation and keyframe data. To refresh all source contracts after an intentional art change, run:

```sh
rtk proxy bun scripts/unit-model/record-contracts.ts
rtk bunx ultracite fix scripts/unit-model/source-contracts.json
```
