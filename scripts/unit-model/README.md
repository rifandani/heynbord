# Unit Model packing

## Unit Specs

The three pilot specs are in `specs/`: Warden Saelith, Crag Rhino and Bone Rampart. Check them with Python 3.11 or later. Blender and Python packages are not required.

```sh
rtk bun unit-model:spec:check
rtk proxy python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'
# This fixture must exit with code 1 and report spec.clips.attack: required.
rtk bun unit-model:spec:check scripts/unit-model/fixtures/missing-clip.json
```

The default command checks every `specs/*.json` file and exits with code 0 when all pass. Pass one or more file paths to check selected specs. Each error includes its file and field path.

`unit-spec.schema.json` defines the fields, Body Plan names, part names, colors and clip slots. `unit_spec.py` checks those schema rules and the prop references. `load_spec(path)` returns a `UnitSpec` typed dictionary and raises `ValueError` on invalid data. Use it before building geometry. The loader also rejects duplicate JSON members.

The initial Body Plan names are `biped-medium`, `quadruped` and `structure`. `biped-medium` has its shared builder in `body_plans/`. The other two names classify the pilots; their shared builders will follow in later issues. The part names match the existing scripts, including suffixes such as `.L`, `.FR` and `.0`. A prop ID must name a listed part. `hand` is `left`, `right` or `none` for a mounted prop. The left side is Blender +X. `cameraSide` identifies a prop on the right side that the player Unit camera sees.

The five required clips match `BASE_UNIT_CLIPS` in `apps/web/src/features/battle/scene/unit-clips.ts`: `idle`, `walk`, `attack`, `hurt` and `death`. The optional clips are `lowHp`, `cast`, `rebirth` and `summon`. Each pilot lists only the clips that its script builds. An empty clip object uses the Body Plan slot. An `override` names the unit's specific action for the future Clip Library.

The palettes and parts come from the three build scripts. Warden Saelith includes the inline belt and arrow colors. Bone Rampart's hammer is part of `skel.A.arm`. Heights include props in the rest pose: 0.985 for Warden Saelith, 0.7280354 for Crag Rhino and 1.13 for Bone Rampart. These values agree with the bounds in `source-contracts.json`. The specs record the current models; the build scripts and Source Contracts do not change.

## Packing

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

## Body Plans

`body_plans/` holds the shared builders. See `body_plans/README.md`. `biped-medium` gives the bones, the proportion table, the arm IK, the skinning rule and the clip slots of the human, elf and undead figures. Warden Saelith uses it.

Compare a new Raw Export with its Source Contract after a change to a build script, a Body Plan or the kit. Do this before you pack, because the packer refreshes the Source Contract. The check exits with code 1 on a difference.

```sh
rtk proxy /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python-exit-code 1 --python scripts/unit-model/warden-saelith.py
rtk bun unit-model:contract:check warden-saelith
rtk bun unit-model:contract:check --all
rtk bun test scripts/unit-model/source-contract.test.ts
```

## Body Regions

`unit_model_kit.py` gives each part one Body Region before the join, so a Review Gate can name an area of the one joined mesh. The fixed list is `head`, `torso`, `arm.L`, `arm.R`, `leg.L`, `leg.R`, `prop`, `base` and `effect`. The list is in `regions.json`, and the Python and TypeScript code read it. An id is a position in the list + 1, so an id of 0 means that a vertex has no region. `unit_regions.py` finds the region of a part, and it does not need Blender.

A part gets its region from the words of its name, then from the words of its main bone, and then it gets `torso`. A part with a wrong result sets it: `Part("club", CLUB, "tail.4", region="torso")`.

The export writes the id in the `_REGION` vertex attribute. The packer stops if a Raw Export has a vertex with no region, and it removes the attribute before compression. `checkUnitModel` rejects a Published Model that has the attribute. After a change to the kit, run the build scripts in Blender again.

```sh
rtk bun test scripts/unit-model/region.test.ts
python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'
```

CI has no Raw Exports, so it skips the tests that read them. On 2026-11-05 the 98 Raw Exports grew from 35,765,700 to 36,914,896 bytes (3.21%), and their packed total changed from 18,738,980 to 18,738,092 bytes (-0.005%). The largest change for one model was 0.32%. The 98 Published Models were not published again, because their vertex data and rig do not change. Blender writes the vertices in a different order on each build, so a Raw Export does not repeat byte for byte. The clips and the Source Contracts do repeat.
