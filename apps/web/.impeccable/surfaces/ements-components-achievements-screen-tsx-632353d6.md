---
version: 1
slug: "ements-components-achievements-screen-tsx-632353d6"
primary_target: "src/features/achievements/components/achievements-screen.tsx"
related_targets: ["src/features/town/town.ts","src/features/town/components/town-bar.tsx"]
---

# Achievements screen (the Hall of banners)

Scope: the Achievements state of `/play` (GDD 11.1, 15 — Achievements 4, issue #103). Mode: Operate. The Player reads the 40 Achievements in 4 categories, claims the rewards of the Completed ones, and sees what is next.

- Audience: the returning fan and the strategy card player at any Player level, between Battles. They come after a toast, the Achievements Hint or the Town Bar badge. Desktop first, phone in landscape.
- Task: Town, Hall of banners or shortcut, then Claim all (or Claim on a row): the balance goes up, the badge goes down, each row shows its check seal. Then read the bars of the In progress rows.
- Content: `ACHIEVEMENTS`, `ACHIEVEMENT_CATEGORIES` (8, 5, 9, 18 rows), `achievementState`, `achievementProgress`, `claimAchievement`, `claimAllAchievements`, `claimableAchievements`. Names and goals from #102. Rewards: Heynstones, Coin (Gold, Silver, Copper), Essence, or an earn-only Cosmetic that comes in a later update.
- Constraints: no level lock; no pressure language; no sort by "almost done"; no hidden goals. The Hall inside painting (`public/town/hall-inside.webp`, brief in 11 — Town Concepts 15) comes from the user; a calm stone hall in code holds its box until then.
- Unresolved: the Hall inside painting; draft names.

## Shape round record

- 2026-10-16, `/impeccable shape issue 103`. Structured question "Which form must the Achievements screen use for the 40 rows in 4 categories?", options: "Banner Tabs (Recommended)", "Roll of Honor", "Banner Wall". Selected: "Banner Tabs (Recommended)".
- Structured question "Does the Achievements screen get a Hall inside painting?", options: "Hall inside brief + fallback (Recommended)", "Code scene only". Selected: "Hall inside brief + fallback (Recommended)".
- The user confirmed the brief ("yes"), then said "build it".
- Finish review 1 (fix): the row Claim became a small gold token so Claim all is the one main gold action; the roll got wooden rollers; the flags use the Hall blue of the Town painting (not the Human Race blue), and the selected flag has the gold hem, a gold name and a lift; the wall banners hang only in the gutters beside the content box.

## Direction contract

THESIS: Banner Tabs. The 4 categories hang as cloth flags on one wooden pole at the left of the Hall; the selected flag flies longer and joins a parchment roll that lists its Achievements, so where rewards wait reads from the flags alone. It refuses a flat settings list with tabs on top, and a grid of badges that hides the goals.

OWN-WORLD: Inherited Painted Tabletop. Hall-blue cloth flags with a gold-trim hem and a swallowtail, on a frame-wood pole with bronze finials; the selected flag gets the gold hem and lifts. A parchment roll with a frame-wood border and parchment-rule row lines; Cinzel names, Inter goals in ink-soft; progress in a plate-socket well with a gold fill and Inter 900 tabular counts; reward chips with the Balance Plate icons; a small gold Claim token per Completed row; a gold check seal for Claimed; one gold Claim all.

STORY: The Player sees on the flags which category has rewards to claim, reads each row (name, goal, reward, progress), presses Claim or Claim all, watches the reward fly into the Balance Plate and the seal stamp, then reads what is still In progress.

FIRST VIEWPORT: The Hall inside covers the screen. Top left: title plate (the painted Achievements icon, "Achievements" in Cinzel). Top right: the Balance Plate. Between them and the Town Bar, centered, max 1080px: at the left, the flag pole with 4 flags (glyph seal, name, "3 / 8", gold claim count); at the right, the roll: a header with the category name and its count, the rows (scroll inside the roll), and a footer with the gold Claim all and its count at the right. The screen opens on the first category with a reward to claim. On a short screen the flags become a narrow rail of glyphs with their counts.

FORM: Banner Tabs, position 1 of 3 on the shape round. Seed key: none. No concept-seed roll ran: the user locked the form in the shape round through the structured question ("Banner Tabs (Recommended)", selected), confirmed the brief, then said "build it". Code-led: no image generation is available (no harness image tool, OPENAI_API_KEY not set).

Signature interaction: a Claim sends the reward icon on a curve from the row into its balance on the Balance Plate, which counts up in 700ms; the row's slot stamps a gold check seal (or "Comes in a later update" for a Cosmetic); the flag's claim count and the Town Bar badge go down. Claim all stamps each visible row in turn (60ms stagger) and sends one flight for each balance kind. Motion grammar: 100ms press, 620ms flight, 700ms count, 380ms stamp; reduced motion changes the values at once with no flight and no stamp motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
