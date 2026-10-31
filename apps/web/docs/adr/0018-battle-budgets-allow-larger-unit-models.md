---
status: accepted
---

# Battle budgets allow larger Unit Models

On 2026-10-30, the maintainer selected larger Battle budgets in
[issue #169](https://github.com/rifandani/heynbord/issues/169). On
2026-10-31, the maintainer removed the six-model-type limit and the
Cut-out Figure fallback: every Unit has a Unit Model. The asset
allowance must leave room for a later increase to the size of each Unit
Model. The former 8 MB asset limit and 400 KB gzip JavaScript limit do not
serve that goal.

- All assets for one Battle must total less than 50,000,000 published
  bytes, before HTTP compression. Include music, both Decks, start Units,
  possible Tokens, the selected Hero appearance and cosmetics. Count each
  shared file once and use the larger of the two result stings.
- All additional Battle JavaScript must total less than 5,000,000 bytes
  at gzip level 9. Include the Battle UI and the chunks needed by enabled
  Battle features. Exclude chunks already loaded by the initial `/play`
  page from the same build.
- Keep no limit on the number of rigged model types in one Battle. Every
  Creature Card and every Token has a Unit Model. The Battle loads every
  Unit Model that can appear before the Board shows: both Decks, start
  Units, possible Tokens and Boss Rule summons. A failed load blocks the
  Battle and offers a retry. Do not bring back a Cut-out Figure.
- Keep model compression and music optimization in the scope of issue
  #169. The larger budgets do not remove this work. Count each Unit Model
  once. Group Unit texture atlases by Race only if a future model uses
  textures; the current models are texture-free. Count original card art
  still needed by Hand Cards and Card Details.
- Battles target online play because a database is planned. Do not add
  offline Battle preparation controls, offline-readiness state or a
  Prepared Battle concept. This replaces the earlier preparation decision
  from this triage session. It also replaces NFR-07's offline guarantee
  for Battles; the relevant product documents need to reflect that change.
- Keep normal PWA asset caching for faster loads. Add server availability
  checks with the future database integration, rather than a separate
  connection check before each Battle in this issue.

This decision replaces the two whole-Battle byte limits in Technical
Design section 6 and the 8 MB whole-Battle asset limit in
[web ADR-0016](./0016-a-hero-portrait-defines-a-person-and-the-gear-look-dresses-it.md).
The separate 10,000,000-byte Hero appearance ceiling, draw-call limit and
reference-device frame-rate requirements still apply. A larger byte
allowance does not increase those limits. An increase to the limit for
each Unit GLB needs a later decision.

Existing PWA cache behavior is a separate question from a guarantee that
Battles work offline. The maintainer confirmed the complete implementation
brief at the end of triage for issue #169.
