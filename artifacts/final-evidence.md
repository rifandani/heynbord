# Issue 169 evidence

The approved Battle budget implementation is complete in the working tree. Existing Hero and Story work is preserved. No commit or PR was created.

## Byte records

Run `bun check:battle-budget`. The final dated machine record is [battle-budget-2026-10-31.json](./battle-budget-2026-10-31.json), with its explanation in [performance.md](../docs/game/22-performance.md). It records commit810b384b767f1bc7aefc1a5e7c6f28bd0e04aefe and dirty status, public build flags, exact fixtures, selected models, complete files and hashes.

Stage1-1:4493291assetbytes. Stage5-10:10001579assetbytes. Additional Battle JavaScript:400240bytes at gzip9 for both. Both strict limits pass.

## Checks

- `bun test:unit:cov --maxWorkers=4`:201files pass;2970tests pass,1skipped; per-file coverage gates pass.
- `bun test scripts/unit-model/model-check.test.ts`:6pass. Published models also have96runtime validation cases in the Vitest suite.
- `PW_PORT=4169 bun web test e2e/battle-assets.spec.ts --project=chromium --workers=1 --reporter=line`:4pass. Covers Stage preload/FX reuse, expected model404fallback with continued play, all8tracks decoding/playing, and landscape phone viewport/page dimensions.
- `bun typecheck`:web and rules pass.
- `bun lint`:pass.
- `PWA_CHECK_PORT=4179 bun check:pwa`:65pass,0warn,0fail.
- `git diff --check`:pass.
- Published service worker contains no optional Basis decoder in its shell precache.
- Atlas build/check validates98transparent512px frames in12Race pages, each<=2048px. Model/audio records are linked from the performance record.

## Browser captures and logs

- [Model fallback](./battle-model-fallback.png):the failed Warden model shows its transparent figure; the next Turn remains usable.
- [Phone viewport](./battle-atlas-phone.png):844×390 landscape viewport. This is emulation, not a physical-device frame-rate measurement.
- [Browser log](./battle-assets-e2e.log)
- [Budget build log](./battle-budget-build.log)
- [PWA log](./battle-pwa-check.log)

R3F intentionally reports caught model errors through window.reportError. The failure test checks the exact expected404and rejects unrelated errors. Objective audio timing, stereo, loop and quality checks pass; human listening was not performed. Existing NFR-01/NFR-02 performance results remain separate.
