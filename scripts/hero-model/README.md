# Hero Models

These scripts build the Hero Models of issue #168: 8 people, each in 7 Gear looks (56 appearances). All people use one skeleton and the same Gear builders. The results have not passed the 56-look art review and are not release assets yet.

## Modules

- `reference.py` builds and exports the appearances. In a running Blender, `build(person, look)` makes one figure in its own scene, `HeroBuild`, and does not change the other scenes.
- `hero_kit.py` contains the modelling, painting and skinning tools. Organic pieces are lofted or sculpted, then subdivided once. Each piece has a color rule and a weight rule. The build bakes ambient occlusion, a warm key light and brush noise into the vertex colors, so the figure looks painted.
- `hero_people.py` contains the shared bone names, the proportions of each person, the sculpted head, the face parts (nose, lips, eyes, lids, brows, ears), the hair and the clothing. The concept images in `apps/web/art/heroes/source/` define each person.
- `hero_cast.py` contains the six people after the first references: Dawn Gaze, Verdant Crest, Mesa Shade, Salt Wind, Lantern Keeper and Gold Crest. It adds hair sheets, beards grown from the head sculpt, hats, hoods, collars and clothing. Their proportions and face values are in `hero_people.PEOPLE`. The torso and the breastplate fit scale from the Standard person.
- `hero_gear.py` contains the four Gear items. Each Gear look is a set of colors and one ornament style on the same parts: plain, hammered copper, iron vines with enamel leaves, stitched leather, gold inlay, moonstones or gold fluting. The breastplate uses the torso measurements of the person, so each look fits each person. Small details, such as the inlays, the stitches, the emblem and the fuller, are geometry, not painted colors. Thus they stay sharp.
- `hero_clips.py` contains the ten clips. Each key is a complete pose in the axes of the figure. Gestures stay in the plane of the screen, and the face stays visible.

## Build and checks

From the repository root, run:

```sh
blender --background --factory-startup --python-exit-code 1 --python scripts/hero-model/reference.py
python3 scripts/hero-model/check_references.py
blender --background --factory-startup --python-exit-code 1 --python scripts/hero-model/render_references.py
blender --background --factory-startup --python-exit-code 1 --python scripts/hero-model/measure_bounds.py
python3 -m unittest discover -s scripts/hero-model -p 'test_*.py'
```

To build a part of the 56 appearances, set `HEYNBORD_HERO_PEOPLE` and `HEYNBORD_HERO_LOOKS` to comma lists, for example `HEYNBORD_HERO_PEOPLE=salt-wind,gold-crest`. The render and bounds scripts use the same variables. One appearance takes about one minute; several Blender processes can run at once.

On macOS, `blender` is `/Applications/Blender.app/Contents/MacOS/Blender`. Use the background build for the published files. In a running Blender, do not bake the clips from a timer callback: there, a frame change does not update the pose, and the clips are wrong.

When all models are ready, run the following command with `HEYNBORD_HERO_REFERENCE_OUT` set to the published model directory. It reports the 56 complete-appearance sizes and fails if a file is missing or invalid.

```sh
python3 scripts/hero-model/check_references.py --all --json
```

The GLBs go to `apps/web/art/heroes/raw/`. The pose images go to its `review/` folder. Set `HEYNBORD_HERO_REFERENCE_OUT` to use a different output folder. The structural check verifies the clips, skeleton, embedded resources and complete GLB size. It does not verify art quality or the Battle budget.

The bounds report samples the animated geometry at each frame of each clip. It does not replace a visual check in the Battle.

## Publish

Keep the Blender exports in `apps/web/art/heroes/raw`. Publish only the packed files:

```sh
bun hero-model:pack --all
bun web:test:unit hero-model-pack.unit.test.ts published-models.unit.test.ts
```

The packer applies Meshopt compression at the medium level. It checks the raw model, then checks and decodes the exact compressed bytes before publication. It keeps the 10,000,000 byte limit and the 32 bone limit, and it requires the ten Hero Model clips with no unknown clip. It compares the bounds, the skeleton and the clip keyframes against the raw export. It writes `source-contracts.json`, so CI does not need the ignored raw exports. A test walks every file in `apps/web/public/models` and fails if any primitive has no Meshopt compression. An extension declaration alone does not pass.

Hero Models use vertex colors and no images. A model with images must convert them to KTX2 before packing.

For local browser checks, build the references first, then run from `apps/web/`:

```sh
bun test:hero
```

The offline check fetches a temporary model through the Service Worker after a page reload. It does not check a full offline app restart. The development switch is off in production. The 56-look art review and the laptop and Android measurements are required before release.
