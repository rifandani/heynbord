# Issue 168 evidence — Hero Models

Status: implementation complete and enabled in all builds. Two human gates remain.

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
- `bun check:battle-budget`: all 3 fixtures pass. Stage 1-1: 3,507,253 asset bytes. Stage 5-10: 11,693,533. Stage 5-10 with the largest Hero appearance: 12,230,067. Additional Battle JavaScript: 401,989 bytes gzip 9. Hero appearance: 536,656 bytes.
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
- AC-24: a manual desktop spot check on 2026-10-31 reported 60 fps, 16 ms and 57 current draw calls. This is not the NFR-01 protocol: it has no mean fps, p95, p99, DPR, host record or raw file.
- Laptop NFR-01 with Hero Models: pending. Use `bun web measure:frame-rate` with the largest appearance (Dawn Gaze + Iron Vine).
- Android NFR-01 with Hero Models: pending. No device is available.
- Draw calls with Hero Models: the manual current count is 57. The per-frame maximum is not measured; the limit is below 150.

## Release state

Hero Models are on in all builds. The remaining art review and reference-device checks are release evidence, not feature switches.

The original 8,000,000-byte and six-rigged-model-type limits in the issue text were superseded by ADR-0018 and the accepted #169 decision. The 10,000,000-byte Hero ceiling and the 150-draw-call limit remain.
