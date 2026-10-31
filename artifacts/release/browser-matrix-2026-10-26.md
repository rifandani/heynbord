# Browser matrix — 2026-10-26

Requirement: [issue 132](https://github.com/rifandani/heynbord/issues/132). The PRD removed NFR-03 on 2026-10-26 after this record.

## Result

**The automated browser matrix passes.**

The 7 automated rows pass the 8 main flows. The run passed 49 tests on a production build. Each row runs 7 tests, because one test covers Town and Campaign.

The PRD removed NFR-03 on 2026-10-26. This record keeps the evidence for the removed requirement.

This automated record does not cover three real-device rows. No iOS or Android device and no cloud device service were available. Playwright cannot emulate mobile Firefox. The record also covers one engine version, not the previous version.

## Tools and method

- Playwright 1.63.0, with the `chromium`, `firefox` and `webkit` engines.
- Branded Google Chrome and Microsoft Edge channels. The matrix does not report Playwright Chromium as Chrome or Edge on desktop.
- Playwright device descriptors for Pixel 7 and iPhone 15. The mobile rows use a landscape viewport of 844 × 390 CSS px, because the game asks the player to turn a phone.
- Host: MacBook Pro (Mac14,7), Apple M2, 16 GB, macOS 26.5.1 (25F80).
- Production build with `VITE_E2E=true` and `VITE_APP_URL=http://localhost:4100`. The build ran on the working tree at commit `dd81072401`. Unrelated uncommitted changes were also present. This record does not claim that the result came from a clean checkout.
- The build was copied before the run, because other local processes rebuild `apps/web/.output`. A Nitro server served the copy on port 4100.
- Main flows: first load, Town, Campaign, Deck builder, Battle, Workshop, Packs, and save export/import.

Commands:

```sh
bun web test:install
VITE_E2E=true VITE_APP_URL=http://localhost:4100 bun web build
cp -R apps/web/.output /tmp/heynbord-matrix-build
PORT=4100 HOST=127.0.0.1 node /tmp/heynbord-matrix-build/server/index.mjs
PW_PORT=4100 bun web test:matrix
```

The matrix tests use a 120 s timeout per test. The Battle test uses 180 s. The action timeout is 20 s and the navigation timeout is 60 s. The final run took 1.1 min with the default worker count.

`bun web test` runs the full Chromium suite and the 49 matrix tests. `bun web test:matrix` runs only the tests with the `@browser-matrix` tag in the 7 matrix projects.

## Matrix

| Browser | Version | Display | Device or emulator | OS | Tool | Date | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Chrome | 155.0.8059.85 | Desktop | MacBook Pro (Mac14,7) | macOS 26.5.1 | Playwright `chrome` channel | 2026-10-26 | Pass |
| Edge | 156.0.4314.42 | Desktop | MacBook Pro (Mac14,7) | macOS 26.5.1 | Playwright `msedge` channel | 2026-10-26 | Pass |
| Firefox | 155.0 | Desktop | MacBook Pro (Mac14,7) | macOS 26.5.1 | Playwright Firefox | 2026-10-26 | Pass |
| Safari | WebKit 26.6 | Desktop | MacBook Pro (Mac14,7) | macOS 26.5.1 | Playwright WebKit (Safari engine, not Safari.app) | 2026-10-26 | Pass |
| Chrome on Android | Chromium 153.0.8010.12, Pixel 7 user agent | Mobile | Pixel 7 emulation, 844 × 390 | macOS 26.5.1 | Playwright Chromium | 2026-10-26 | Pass (emulated) |
| Edge on Android | 156.0.4314.42 | Mobile | Pixel 7 emulation, 844 × 390 | macOS 26.5.1 | Playwright `msedge` channel (Edge binary, Pixel 7 Chrome user agent) | 2026-10-26 | Pass (emulated) |
| Safari on iOS | WebKit 26.6, iPhone 15 user agent | Mobile | iPhone 15 emulation, 844 × 390 | macOS 26.5.1 | Playwright WebKit | 2026-10-26 | Pass (emulated) |
| Edge on iOS | — | Mobile | — | — | — | 2026-10-26 | Not run: no iOS device or cloud device service |
| Firefox on Android | — | Mobile | — | — | — | 2026-10-26 | Not run: Playwright cannot emulate mobile Firefox, and no Android device was available |
| Firefox on iOS | — | Mobile | — | — | — | 2026-10-26 | Not run: no iOS device or cloud device service |
| Safari on Android | — | Mobile | — | — | — | 2026-10-26 | Not applicable: Safari does not exist on Android |

## Flow coverage

Each automated row runs 7 tests from `apps/web/e2e/browser-matrix.spec.ts`. The tests cover these 8 flows:

| Flow | Test |
| --- | --- |
| First load | The Home page shows its title and welcome heading |
| Town | The Town opens, and the Town Gate opens the Campaign |
| Campaign | The Campaign shows Hearthvale and Stage 1-1 open |
| Deck builder | The Deck dialog opens, a card is removed, and the size becomes 9 / 10 |
| Battle | Stage 1-2 starts, the Board renders, and one card is played |
| Workshop | The Workshop opens at level 3 and combines 2 Common copies |
| Packs | An Unopened Pack opens, all 5 cards show, and the reveal closes |
| Save export/import | Export writes a file, Coin is spent, and import restores 1 Gold, 23 Silver, 45 Copper |

## Version scope

This run tested one version of each engine: the current stable version.

The previous version is not in this record for these reasons:

- Playwright 1.63.0 supplies one bundled build of Firefox and one build of WebKit. It does not supply the previous build.
- The `chrome` and `msedge` channels use the installed stable browser. They do not install a second stable version next to it.
- No cloud device service is configured. A previous-version run needs one, or a manual install on a second machine.

The exact versions above make the result repeatable. A later run can add the previous version, but the PRD no longer lists this requirement.

## Failures and fixes

| Failure | Cause | Fix | New result |
| --- | --- | --- | --- |
| Android: the offline notice covered Fight and Import | The "App is ready to use offline" toast sits over the lower right of the screen | The test closes the toast, and uses the keyboard for the two covered buttons | Pass |
| Packs with reduced motion: Reveal all was absent | Reduced motion shows all cards at once, so the dialog goes to its end state | The test accepts both paths and waits for the 5 flipped cards | Pass |
| No browser-specific product failure | — | — | — |

The final run had 0 failures, 0 retries and 0 skipped tests.

## Evidence

- [JSON summary](./browser-matrix-2026-10-26.json)
- `apps/web/playwright.config.ts` — matrix projects and the `@browser-matrix` filter
- `apps/web/e2e/browser-matrix.spec.ts` — 7 tests that cover the 8 main flows
- `apps/web/e2e/_diagnostics.ts` — shared Battle diagnostics types
- `apps/web/package.json` — `test:install`, `test:matrix` and `test:ci`

## Not covered by this record

This record is an automated browser matrix. It does not cover these cases:

1. Edge on iOS on a real iOS device.
2. Firefox on Android on a real Android device.
3. Firefox on iOS on a real iOS device.
4. The previous stable version of Chrome, Edge, Firefox and Safari.

A later record can add these cases. They do not block this automated record.
