---
status: accepted
---

# Published 3D models are compressed artifacts

The game downloads only compressed 3D models. A Blender export is working
material, not a published asset.

- Keep the Blender export in `apps/web/art/<family>/raw`. That folder is
  ignored by git. Publish only the Meshopt-compressed GLB under
  `apps/web/public/models`.
- Compress with glTF Transform Meshopt at the medium level. The checker
  also accepts Draco, but the packers do not produce it. Every primitive
  attribute and index buffer must compress. An extension declaration alone
  does not pass.
- A published GLB must embed its images. An image must use KTX2, and its
  texture must use `KHR_texture_basisu`. The current models have no images
  and store color in vertex attributes.
- The packer decodes the exact bytes that it will write. It compares the
  bounds, the bones and the clip keyframes with the raw export. A mismatch
  stops publication.
- Commit a `source-contracts.json` for each model family. CI reads it, not
  the ignored raw exports.
- A test walks `apps/web/public/models` and fails on an uncompressed GLB or
  on a model without a committed source contract.

The reason is size and history. On 2026-10-31, the 56 Hero Models went from
100,081,188 to 27,713,416 bytes, 72.31% smaller, with no change to the rig,
the clips or the bounds. The 98 Unit Models took the same treatment on
2026-10-30 and went from 35,243,464 to 18,456,628 bytes. A raw export that
is committed once stays in git history forever, so the pack step runs
before the first commit of a new model.

This keeps the model compression work in the scope of
[ADR-0018](./0018-battle-budgets-allow-larger-unit-models.md).
