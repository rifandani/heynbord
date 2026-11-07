# Review Gate fixes: beast batch 1 and Bone Rampart

Date: 2026-11-07. Pull request [#194](https://github.com/rifandani/heynbord/pull/194).

The Unit Model Review of PR 194 failed on 16 units. This record covers the 6 units that failed a Review Gate: Crag Rhino, Gorehorn Red Maw, Old Frostmaw, Woolly Mammoth and Cave Bear of [#186](https://github.com/rifandani/heynbord/issues/186), and Bone Rampart of [#187](https://github.com/rifandani/heynbord/issues/187). After the fixes, all 11 Review Gates pass on each of these 6 units on a local run. Each `gates-pass/` folder beside this file has the capture and `gates.json` of that run.

The other 10 units still fail. They need work that a person must approve:

- No Unit Spec: Rimebreath Drake, Fuse Runner, Elderreed Dartmaster, Tailsweep Basilisk and Tusk Brute.
- No Turnaround: Amberwing Dart, Boss Snikkit, Junk Walker, Rocket Barrel Rider and Grand Gearjammer.

## Results

| Unit | CI gates before | Local gates after | Fixes |
| --- | --- | --- | --- |
| crag-rhino | turntable, attachment-anchor, palette fail | 11 pass | Palette; `horn` bone for the shield; shield rim stops at the bite; `holedParts` |
| gorehorn-red-maw | joint-loops, palette fail | 11 pass | Palette; spine core; neck under the mane |
| old-frostmaw | interior-difference, joint-loops, attachment-anchor, palette fail | 11 pass | Palette; neck core; bell nearer the jaw root |
| woolly-mammoth | palette fail | 11 pass | Palette |
| cave-bear | self-intersection, palette fail | 11 pass | Palette; mouth off the jaw pole |
| bone-rampart | turntable, self-intersection, palette fail | 11 pass | Palette; slabs turned outward; loose bones on the ground |

## Palette

The model colors were cooler and less saturated than the warm card paintings. Each failed main color moved to a near color of its card painting, by the smallest change that passes. A vertex color is the base color times a light value, so a change of a base color moves all its vertices. The Unit Spec palettes have the same changes.

| Unit | Color changes |
| --- | --- |
| woolly-mammoth | toe `#d9cbb0` → `#ecd5c7`, bird `#d8d8d0` → `#e9e4db`, bird dark `#3a3a3e` → `#40393d`, nest `#9a7a4a` → `#9d764e` |
| cave-bear | cut `#b8323a` → `#9b4d3b`, cut dark `#6e1c20` → `#5c2b26`, honey `#b67412` → `#b6752a` |
| gorehorn-red-maw | horn `#bfae88` → `#bd9d79`, snout `#ab9d84` → `#b3977d`, snout dark `#7e715e` → `#a87c5c` |
| old-frostmaw | scale `#dde1e3` → `#cdd3de`, scale dark `#a7b0b8` → `#aeb6cb`, scale shadow `#7a8794` → `#7f8b9d`, ice `#c4e9ff` → `#a8d4f0`, bell `#c9963f` → `#d8d0c8`, bell dark `#8a6326` → `#7d685c` |
| crag-rhino | 6 hide, plate, rim and boss colors, each a little warmer |
| bone-rampart | gold `#d2a548` → `#c69a61`, bone `#a99c7c` → `#d1bba7`, bone light `#e3d9c0` → `#efd4bd`, socket `#1c1f22` → `#262728` |

The Old Frostmaw bell is now ivory with a brown cord, as the horn of its approved Turnaround. Its shape is still a bell. The Turnaround and its approved prop list show a hunting horn.

## Geometry

- **Joint loops (Gorehorn, Old Frostmaw).** The gate counts vertices near the bone axis: 2 × 0.35 of the bone length, or 0.12 of the height on a center bone. The fur and scale shapes are wider than that, so no visible ring can count. The beasts that pass get these rings from the inner surfaces of their overlapping spheres. Each failed joint now has a thin core in the body or the neck, with a ring at the joint and one on each side. The core blends its weights across the joint, so it bends with the bones. It is inside the visible shape. Old Frostmaw has 2 straight core tubes, because one tube cannot turn as sharply as its head without crossing itself.
- **Attachment anchor (Crag Rhino).** The shield is on the big horn, at the front of the snout. The `head` joint is at the back of the head, 0.27 from the shield. A new `horn` bone (child of `head`) starts on the big horn and holds the big horn and the shield. The Unit Spec names `horn` for the shield. This adds a bone, so all 7 clip digests and the bone count of the Crag Rhino Source Contract change. The bounds change by less than 1e-7.
- **Attachment anchor (Old Frostmaw).** The bell moved 0.05 back along the jaw, nearer the jaw root.
- **Turntable (Crag Rhino).** The iron rim of the shield was a full ring, so it crossed the broken bite and closed a hole. The rim is now an arc that stops at the bite. It has its own fixed frame, because `kit.tube` turns its ring frame where its path is near vertical, and that twist crossed the rim. `plates` and `fur` are in `holedParts`: they are many separate slabs and locks on the body, and the gaps between them are not holes through one part.
- **Turntable (Bone Rampart).** The loose bones were 2 mm over the top of the platform, and 2 were past its edge in the air. They now lie on the ground in front of the platform, as the build script says.
- **Self-intersection (Bone Rampart).** The width, normal and height axes of a shield are left-handed, so `kit.slab` made each band and fleur inside out. All 27 slabs of the shields had a negative volume. The gate found only some of them. `outward_slab` turns the box when its axes are left-handed.
- **Self-intersection (Cave Bear).** The mouth and the jaw had a shared top pole, so the join made one island that crossed itself. The mouth is 1 mm higher.

## Margins

The `interior-difference` limit is 0.28. These local values are near it, and a Linux render in CI can give a slightly different value:

- old-frostmaw back head: 0.2770
- woolly-mammoth front legs: 0.2765
- crag-rhino back legs: 0.2761

## Validation

- The 6 Unit Specs, pack checks, Source Contract checks and Turnaround checks pass.
- Clip checks pass for the 6 units.
- Python suite: 175 tests pass, 2 skipped (Blender only).
- `bun test scripts --timeout 30000`: 184 tests pass.
- `bun run web:test:unit unit-model`: 129 tests pass.
- `bun run lint`: passes.

No CI run of these changes is recorded here.
