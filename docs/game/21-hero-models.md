# Hero Models

Status: all 22 design decisions accepted on 2026-10-30. The Blender
pipeline builds all 8 people in all 7 Gear looks (56 appearances). The
published runtime assets are the compressed GLBs in
`apps/web/public/models/heroes` (27,713,416 bytes for all 56; the largest
appearance is 536,656 bytes, under the 10,000,000-byte ceiling). The
3D feature is enabled in all builds. A manual desktop spot check reports
60 fps, 16 ms and 57 current draw calls. The full laptop NFR-01 record
and the Android record are pending; no Android device is available. The
56-look art review remains open evidence.

Tracking issue: [#168 — Hero Models](https://github.com/rifandani/heynbord/issues/168).
It contains all 22 decisions, acceptance criteria and the work checklist
through release. Keep it open until the full feature passes its checks.

## Source

The Player supplied a Scrawl capture on 2026-10-30:
`scrawl-1793336807432-16e2-14.scrawl`. The contact sheet and all six cropped
frames were inspected before this document was created.

## Requested behavior

- Show an animated 3D figure for the Player's Hero on the Board.
- Animate the Hero when an enemy Unit attacks it.
- Animate the Hero when the Player summons a Unit.
- Animate the Hero when the Player plays a Skill Card.
- Show the current 3D figure on the Hero screen.
- Show the actual Gear on the figure. A change of Active Gear look in the
  Bazaar must show on the figure, including a change back to Standard kit.
- Give each Hero portrait a matching 3D figure, including Standard portrait.
- Limit the assets of each selected 3D appearance to 10,000,000 bytes,
  including shared files, before HTTP compression.

## Current constraints

- There are seven paid Hero portraits and the free Standard portrait.
- There are six paid Gear looks and the free Standard kit.
- The Active Hero portrait serves all four Classes. The Class comes from
  the Active Deck ([ADR-0032](../adr/0032-the-class-stays-on-the-deck-slot.md)).
- One Active Gear look changes the Weapon, Armor, Trinket and Banner
  together. Gear levels and stats are separate from that choice.
- The enemy Side currently keeps its Class glyph instead of using the
  Player's Hero portrait.

## Accepted decisions — round 1

1. **Size:** the body, textures, animations and selected Gear files needed
   for one appearance total at most 10,000,000 published bytes before HTTP
   compression. Shared files count in each appearance that needs them.
   This is a ceiling, not a target. It does not include every other Gear
   look or every other portrait.
2. **Figure:** a full-body Hero Model in the painted fantasy style, with
   more face and clothing detail than current Unit Models. Battle and
   the Hero screen use the same model.
3. **Identity:** the Hero portrait defines the person. A change of Gear
   look keeps the face and key features such as the headscarf. Gear
   replaces the relevant clothing and objects.
4. **Gear:** all four items are visible: a sword in hand, a breastplate,
   an amulet and a small banner attached to the back. The face stays clear.
5. **Class:** the same person and selected Gear serve all four Classes.
   Cast gestures differ by Class. A Mage still uses the sword of the
   selected Gear look.
6. **Coverage:** the first release covers Player Heroes. Enemy Heroes
   and Dungeon Bosses keep their current presentation and need a
   separate art brief for a later release.
7. **Standard:** one new Human person, with a clear face and simple
   clothing, serves all four Classes. Standard kit is its initial Gear
   appearance, and the Player can select any owned Gear look as usual.

The catalog therefore needs eight Hero Models compatible with seven Gear
appearances, including their Standard looks: 56 supported combinations.
The portrait and Gear selections remain separate.

## Accepted decisions — round 2

8. **Animations:** idle, Low HP, summon, one cast gesture for each of the
   four Classes, hurt, victory and defeat. Any damage that reduces Hero
   HP causes a hurt reaction, including damage from effects.
9. **Summon source:** the Hero gestures when it plays a Creature Card.
   A Token summon belongs to the Unit that caused it. A Unit appearing
   by itself does not trigger a Hero gesture.
10. **Timing and motion:** keep current Battle action times. A summon
    gesture spans the existing card-play and summon beats. Victory and
    defeat continue behind the result panel. Pause stops animation,
    speed ×2 speeds it up, and Skip goes directly to the final pose.
    Reduced motion stops idle movement and keeps short action gestures.
11. **Hero screen:** the model sits on the left, with the four Gear
    plates in a 2 × 2 grid on the right: Trinket and Banner above, Weapon
    and Armor below. HP and Forge Stones are above. A compact form
    supports landscape phones. Drag and arrow buttons rotate the model;
    Reset View returns to its initial angle.
12. **Bazaar:** a shared 3D preview stands at the right of the Hero
    portrait shelf and of the Gear looks shelf. It shows a candidate
    portrait with active Gear, or candidate Gear with the active person.
    Preview and Buy keep the current selection. Use changes it.
13. **Loading:** load only the needed appearance and cache it for reuse.
    A matching 2D portrait shows during loading or after failure. Retry
    is available, and Battle remains playable.
14. **Replay:** new Replays save the portrait and Gear look IDs at Battle
    start. The Battle Log uses that same appearance. Older Replays use
    Standard portrait and Standard kit.
15. **Production:** extend the Blender pipeline with a shared Hero
    skeleton and reusable Gear parts. First finish Standard character
    and Tent Rings with both Standard kit and Gold Inlay. Review their
    faces, clothing, Gear fit and animations before making the other
    models.
16. **Small portraits:** keep painted 2D faces in the Top Bar and small
    catalog thumbnails. Add a matching painted face for the new Standard
    character. Use 3D on the Board, Hero screen and Bazaar preview.

## Accepted decisions — round 3

17. **Body and fit:** use distinct faces and modest differences in height
    and build on the shared skeleton. Every Gear look must fit every
    person. All four Gear items stay visible at level 0. Upgrades change
    stats, while the Gear look controls appearance.
18. **Low HP and interruption:** Low HP starts at one-third of maximum
    HP or less, matching Units. The Hero HP bar uses the same threshold.
    Animation priority is victory/defeat, hurt, cast/summon, then Low HP
    or idle. Replace an interrupted gesture instead of queuing it.
19. **Battle presentation:** keep the current camera, Hero position,
    Side ring and legal target markers. Replace the upright portrait
    frame with the model. The body, sword and banner must fit the Hero
    area throughout every animation and keep Units visible. Model
    geometry does not change Hero targeting.
20. **Replay compatibility:** save Cosmetic IDs and show their current
    art, without retaining old model files. Viewing a look grants no
    ownership. Unknown or wrong-family IDs use that family's Standard
    look. Existing Replay links remain readable.
21. **Budget priority:** keep the whole-Battle limits. All assets
    for one Battle must total less than 50,000,000 published bytes before HTTP compression, with fewer than 150 draw
    calls. There is no limit on the number of rigged model types: every
    Unit has a Unit Model, and the Hero Model is separate. The
    10,000,000-byte Hero limit remains an
    absolute ceiling, not an additional allowance. Actual Hero assets
    must be smaller to fit the Battle budget.

    The original 8,000,000-byte and six-rigged-model-type limits in issue
    #168 were superseded by [web ADR-0018](../../apps/web/docs/adr/0018-battle-budgets-allow-larger-unit-models.md)
    and the accepted #169 decision on 2026-10-31. The 10,000,000-byte Hero
    ceiling and the 150-draw-call limit remain.
22. **Release checks:** check all 56 portrait/Gear combinations, all four
    Class casts, animation controls, loading failures, Replay appearance,
    keyboard controls and landscape phones. Meet the existing 60 fps
    laptop and 30 fps Android requirements on the reference devices.
    Review the first model references before producing the other models.
    Enable 3D Heroes when all eight models are ready.

    The owner enabled 3D Heroes in all builds on 2026-10-31. The listed
    checks remain required release evidence.

## Decision record and language

[Web ADR-0016](../../apps/web/docs/adr/0016-a-hero-portrait-defines-a-person-and-the-gear-look-dresses-it.md)
records the identity and Gear boundary, release coverage and size limit.
It amends the icon-only Gear decision in web ADR-0013 and the Hero-screen
restriction in ADR-0052. The web glossary now defines **Hero Model** and
extends **Hero portrait**, **Standard portrait**, **Gear look** and
**Standard kit** to match the accepted design.

[Web ADR-0017](../../apps/web/docs/adr/0017-a-replay-keeps-the-original-hero-appearance.md)
records the choice to preserve the original Hero appearance in new
Replays, separately from the viewer's active Cosmetics.

## Loading and ownership

The accepted loading fallback applies to the complete selected appearance:
all required parts must be ready before it replaces the 2D portrait. A
missing model does not remove an existing Cosmetic, its ownership or its
Use control. The selected portrait and Gear icons remain available in 2D.
These follow the accepted separation of Use, ownership and model loading.

## Published assets and checks

Run these checks from the repository root after a pack:

```sh
bun hero-model:pack --all
python3 scripts/hero-model/check_references.py --all --json
HEYNBORD_HERO_REFERENCE_OUT=apps/web/public/models/heroes \
  python3 scripts/hero-model/check_references.py --all --json
bun check:battle-budget
```

The first report checks the raw exports. The second checks the 56 published
GLBs. The committed [56-appearance size report](../../artifacts/hero-model-sizes-2026-10-31.json)
records each published byte count. `check:battle-budget` measures the Stage
fixtures, including a Hero-enabled Stage 5-10 with the Dawn Gaze person in
the Iron Vine look. The unit test `hero-model-budget.unit.test.ts` fails when
a published appearance is missing, does not match the report, or is over
the 10,000,000-byte ceiling.

The Hero Model art review is local evidence, not committed art approval:
`apps/web/art/heroes/raw/review/` holds 560 pose images (56 appearances ×
10 clips), and `apps/web/art/heroes/raw/matrix-idle.png` holds the 8 × 7
idle matrix. These paths are under the ignored raw-art folder. The same
folder holds the Blender source files and the 56 raw exports.

The browser checks use the published models:

```sh
cd apps/web
bun test:hero
```

They cover the desktop and 844 × 390 landscape layouts, rotation and focus,
loading and Retry, a playable Battle after a failed model, the four
reference appearances in the shared Bazaar preview, and cached reuse after
a reload. They do not replace the 56-look art review or the laptop and
Android frame-rate records.

## Delivery and acceptance

1. Extend the Blender pipeline with the shared Hero skeleton and Gear
   parts. Complete Standard character and Tent Rings in Standard kit and
   Gold Inlay. Show their faces, clothing, Gear fit and required animation
   poses for review before producing the remaining models.
2. Connect the reference models to Battle, the Hero screen and the
   shared Bazaar preview. Keep the playback clock, current Battle timing,
   target markers and the complete-appearance loading fallback.
3. Save appearance IDs at Battle start for the Battle Log and new
   Replays. Keep older links readable, validate IDs against their
   Cosmetic family and keep the viewer's Profile separate.
4. Complete the remaining six Hero Models and all seven Gear appearances.
   Check all 56 combinations for fit, clipping, face visibility and
   the complete-appearance byte limit. Shared files count in each
   appearance that needs them, regardless of browser cache state.
5. Check the whole-Battle asset, draw-call and model-type limits.
   Measure frame rate on the reference laptop and Android phone using
   the existing performance protocol. Record results; a file-size check
   alone does not establish frame-rate performance.
6. Check the action clips, pause, speed ×2, Skip, reduced motion, result
   poses, keyboard rotation, Reset View, compact landscape layout,
   preview/Buy/Use separation, loading errors, Retry and Replay fallback.
   3D Heroes are enabled; complete the remaining checks.

These checks are required release evidence. The build instructions are in
[scripts/hero-model](../../scripts/hero-model/README.md). The checks do not
establish art approval or device performance.

## Pre-implementation findings — round 2

These facts describe the code inspected during the interview. The
accepted decisions above specify the changes.

- A Creature Card play identifies its Hero. Start Units and Boss Rule
  summons also use Unit summon events. A Token summon identifies a source
  Unit. Thus a Unit appearing does not always mean that a Hero summoned it.
- Existing times at normal speed include 180 ms for a Creature Card play,
  420 ms for a Unit summon and 700 ms for a Player Skill Card cast. A
  single-Hero Side has no defeat beat before the result. New Hero clips
  need a choice about duration and the result transition.
- The existing playback clock supports pause, speed ×2 and Skip. The
  Battle Log pauses Live. Reduced motion follows the Player setting or
  the operating system. Hero animations must fit these controls.
- The Hero screen has a Status Bar and four Gear plates, with a compact
  form at heights of 500 px or less. It has no space reserved for a model.
- The Bazaar already separates Preview, Buy and Use. Preview and Buy do
  not change the Active Cosmetic.
- Current Unit Models come from Blender Python build scripts. The
  pipeline does not supply a detailed Hero body or modular Gear yet.
- Unit model loading preloads every Unit Model of the Battle and blocks
  the Board on a failure, with a retry. The Service Worker art cache now
  covers the `/models/units/` path.
- Replay links store no Cosmetics. Current rendering reads the viewer's
  Active Hero portrait, including during a Replay. Decision 14 changes
  this behavior for new Replays.

Sources: `battle-timeline.ts`, `scene/playback-driver.tsx`,
`scene/heroes.tsx` and `scene/units.tsx` in the Battle feature;
`hero/components/hero-screen.tsx`, the Bazaar shelf components,
`replay/replay.ts` and `replay/replay-link.ts` in the web features;
`apps/web/src/sw.ts`; and `scripts/unit-model/unit_model_kit.py`.

## Pre-implementation findings — round 3

- [Web ADR-0018](../../apps/web/docs/adr/0018-battle-budgets-allow-larger-unit-models.md)
  replaces the former 8 MB whole-Battle limit. All Battle assets now total
  less than 50,000,000 published bytes before HTTP compression. The separate
  Hero appearance ceiling stays at 10,000,000 bytes, including shared files.
  Both limits apply, with fewer than 150 draw calls and at most six rigged
  model types. Reserve one type for the Hero and five for Units.
- The existing frame-rate requirements are 60 fps on a 2022 laptop with
  integrated graphics and at least 30 fps on a 2022 mid-range Android
  phone. The current performance record marks this requirement as
  failed: the laptop measurement missed the frame-time limit, other
  applications were open, and no Android measurement was recorded. The
  record does not establish a device limit.
- Technical Design section 4.2 previously limited Canvas to Battle. The
  accepted design extends it to Hero and Bazaar previews. The Town
  remains a painted 2D screen.
- Gear exists at level 0. Current Gear art depends on its look and slot,
  not its level. Decision 17 keeps this visual rule.
- Current Hero selection uses legal target markers separate from the
  portrait plane. The fixed Battle camera fits the Squares and Heroes
  with a 0.9-world-unit margin beyond each Hero center. A sword or back
  banner can extend beyond that allowance.
- Replay format 1 currently rejects other format versions. Replay data
  belongs to web; the rules PlayerSetup has no Cosmetic fields. Art and
  Bazaar preview can show a Cosmetic without ownership, while Use
  requires ownership. Replay appearance fields need catalog and family
  checks.
- Current Bazaar visibility requires the portrait face or all four Gear
  icons. All seven paid portrait faces and six Gear icon sets are present.
  There is no model-readiness condition today.

Sources: [Technical Design](./06-technical-design.md),
[PRD NFR-01](./04-prd.md#69-non-functional-requirements-nfr),
[performance record](./22-performance.md#frame-rate-nfr-01),
`apps/web/src/features/battle/scene/layout.ts`, the target marker modules,
`apps/web/src/features/replay/replay-link.ts`,
`apps/web/src/features/bazaar/bazaar.ts`,
`packages/rules/src/profile/cosmetics.ts`, and
`packages/rules/src/content/gear.ts`.
