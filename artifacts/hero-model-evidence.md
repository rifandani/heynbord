# Issue 168 evidence — Hero Models

Status: implementation complete. Release activation and two human gates remain.

## Assets

- Raw exports: 56 appearances (8 people × 7 Gear looks) in `apps/web/art/heroes/raw/` (ignored).
- Published models: 56 GLBs in `apps/web/public/models/heroes/`.
- Published bytes: 27,713,416 total; 458,020 minimum; 536,656 maximum. All are under the 10,000,000-byte complete-appearance ceiling.
- Per-appearance record: [hero-model-sizes-2026-10-31.json](../docs/game/hero-model-sizes-2026-10-31.json).
- Each model has 10 clips, a 21-bone shared skeleton, vertex colors and no images.
- Standard 2D face: `apps/web/public/hero-portraits/standard.webp`, 600 × 800 WebP.
- Draft visual review: `apps/web/art/heroes/raw/review/` (560 pose images), `apps/web/art/heroes/raw/matrix-idle.png` (8 × 7 matrix). Both are under the ignored raw folder.

## Checks

- `python3 scripts/hero-model/check_references.py --all --json`: 56 raw exports pass.
- `HEYNBORD_HERO_REFERENCE_OUT=apps/web/public/models/heroes python3 scripts/hero-model/check_references.py --all --json`: 56 published GLBs pass.
- `bun test:unit`: 204 files, 3,396 tests pass, 1 skipped.
- `bun typecheck`: web and rules pass.
- `bun lint`: pass.
- `bun test:hero` (Chromium, published fixtures): 6 tests pass. Covers 1366 × 768 and 844 × 390 layouts, focus and rotation, failed load and Retry, a playable Battle after model failure, four Bazaar appearances, and Service Worker reuse.
- `bun check:battle-budget`: all 3 fixtures pass. Stage 1-1: 3,507,253 asset bytes. Stage 5-10: 11,693,533. Stage 5-10 with the largest Hero appearance: 12,230,067. Additional Battle JavaScript: 402,102 bytes gzip 9. Hero appearance: 536,656 bytes.
- Record: [battle-budget-2026-10-31.json](../docs/game/battle-budget-2026-10-31.json).

## Screenshots

- `apps/web/art/heroes/raw/evidence/hero-1366x768.png`
- `apps/web/art/heroes/raw/evidence/hero-844x390.png`
- `apps/web/art/heroes/raw/evidence/battle-model-draft.png`
- `apps/web/art/heroes/raw/evidence/standard-standard-bazaar.png`
- `apps/web/art/heroes/raw/evidence/standard-gold-inlay-bazaar.png`
- `apps/web/art/heroes/raw/evidence/tent-rings-standard-bazaar.png`
- `apps/web/art/heroes/raw/evidence/tent-rings-gold-inlay-bazaar.png`

## Human gates

- AC-02 and AC-04: the 56-look art review and the first-reference approval are not recorded. The draft files above support that review.
- AC-24: the reference laptop and Android frame-rate records are not measured with Hero Models enabled. The existing NFR-01 record already fails and does not cover this feature.
- Draw calls with Hero Models: not measured on the reference devices. The strict scene record without the Hero is 97 draw calls against the 150 limit. The Hero model adds one skinned mesh, so a measured check is still needed.

## Release state

`HERO_MODELS_ENABLED` is off by default. A local development build uses `VITE_HERO_MODEL_PREVIEW=1`. A release build uses `VITE_HERO_MODELS=1` after the art and device gates pass.

The original 8,000,000-byte and six-rigged-model-type limits in the issue text were superseded by ADR-0018 and the accepted #169 decision. The 10,000,000-byte Hero ceiling and the 150-draw-call limit remain.
