# Game performance

This document records the measured performance of the game. Each record names
its date, its method, and the build that it measured.

## Frame rate (NFR-01)

**NFR-01: FAIL on the full protocol runs. The Android phone target is deferred.** The 2022 laptop misses the frame-time budget in both Battles. The maintainer's manual browser check on 2026-10-31 reported 60 fps and 16 ms, and the maintainer accepted it as the laptop evidence, but it is not a full protocol run. The protocol runs are host-limited: the load average was 3.8 to 7.0 and other applications were open, so the condition "no other heavy application" did not hold. The numbers are the observed result, not proof of the device limit. Follow-up: [#140](https://github.com/rifandani/heynbord/issues/140).

The maintainer deferred all mobile device testing on 2026-10-31 because no Android phone is available. The 30 fps phone target is not measured.

### 2026-10-26 — MacBook Pro 13-inch (M2, 2022)

- Device: Apple MacBook Pro 13-inch, 2022 (`Mac14,7`). Apple M2, 8-core CPU, 10-core integrated GPU, 16 GB.
- OS: macOS 26.5 (Darwin 25.5.0), arm64. AC power. Low Power Mode off.
- Browser: Google Chrome 155.0.8059.85, headed, with no viewport override. The window was 1440 × 900; the page viewport was 1224 × 783 CSS pixels.
- Native DPR: 2. The page reported DPR 2.
- Host: load average 5.09 at the start of the Stage 1-1 runs and 3.81 at the start of the Dungeon 3 runs. T3 Code, Google Chrome and Microsoft Defender were open. The raw file records the load average from `os.loadavg()`.
- Build: commit `de44db791b`. Each raw file records the full `git status --short` list of the working tree at the build.
- Command: `bun web measure:frame-rate --scenario=baseline --runs=2 --device=macbook-pro-m2` and `bun web measure:frame-rate --scenario=strict --runs=2 --device=macbook-pro-m2`.
- Method: the runner builds the production app with `bun run build`, starts the Nitro server, and opens the installed Google Chrome, headed, on a real GPU. It plays with real mouse input at Speed ×1 and never uses Skip. It waits 3 s after the scene mounts, calls `reset()`, then reads `snapshot()` when the result shows. A new browser context starts each run. The raw data is the `snapshot()` object plus the run metadata.
- Baseline scene: Stage 1-1, Raiders Deck (10 cards), seed 4. The player won by `routed`.
- Strict scene: Dungeon 3, the 4-Lane Dungeon with 3 Bosses, seed 4. The profile was set to level 30 with the QA hook so that Dungeon 3 is open. The Vanguard Deck was auto-filled from 10 to 19 cards to meet the level-30 minimum of 15. The enemy won by `heroDefeated` at Turn 11.

| Run | Scene | Duration | Mean fps | p50 | p95 | p99 | Worst | Max draw calls | Native DPR | Settled DPR | DPR changes | Result |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | Stage 1-1, Raiders, seed 4 | 87.2 s | 59.0 | 16.7 ms | 17.6 ms | 18.8 ms | 258.2 ms | 50 | 2 | 2 | 0 | Win |
| 2 | Stage 1-1, Raiders, seed 4 | 87.0 s | 59.9 | 16.7 ms | 17.7 ms | 18.4 ms | 78.3 ms | 51 | 2 | 2 | 0 | Win |
| 3 | Dungeon 3, Vanguard, seed 4 | 119.9 s | 60.0 | 16.7 ms | 17.5 ms | 17.8 ms | 56.8 ms | 97 | 2 | 1 | 1 | Loss |
| 4 | Dungeon 3, Vanguard, seed 4 | 120.2 s | 60.0 | 16.7 ms | 17.7 ms | 17.8 ms | 79.6 ms | 97 | 2 | 1 | 1 | Loss |

- Budget: mean fps 60 or more and p95 frame time 16.7 ms or less. Stage 1-1 misses both. Dungeon 3 makes the mean and misses p95. The DPR control lowered the Canvas DPR from 2 to 1 during both Dungeon 3 runs (at 89.3 s and 54.1 s). The settled DPR is 1.
- The worst frame of 258.2 ms in run 1 is one frame out of 5108 (0.02 %). The percentiles do not change much.
- Raw files:
  - [`2026-10-26-macbook-pro-m2-baseline-run-1.json`](../../apps/web/artifacts/performance/2026-10-26-macbook-pro-m2-baseline-run-1.json)
  - [`2026-10-26-macbook-pro-m2-baseline-run-2.json`](../../apps/web/artifacts/performance/2026-10-26-macbook-pro-m2-baseline-run-2.json)
  - [`2026-10-26-macbook-pro-m2-strict-run-1.json`](../../apps/web/artifacts/performance/2026-10-26-macbook-pro-m2-strict-run-1.json)
  - [`2026-10-26-macbook-pro-m2-strict-run-2.json`](../../apps/web/artifacts/performance/2026-10-26-macbook-pro-m2-strict-run-2.json)

### 2026-10-31 — MacBook Pro 13-inch (M2, 2022), protocol re-run

- Device, OS and browser: the same MacBook Pro 13-inch (`Mac14,7`) with Apple M2 and macOS 26.5.1. Google Chrome 156.0.8078.79, headed, 1224 × 783 CSS pixels, native DPR 2. AC power, Low Power Mode off.
- Build: baseline at commit `11acc0db1a`; strict at commit `2bc8a394ec`. Both used the Story Scene skip in the working-tree frame-rate runner. Each raw file records the full dirty list.
- Host: load average 6.4 to 7.0. A YouTube tab in Chrome used about 98% CPU. T3 Code and Microsoft Defender were also open. The host was not idle.
- Command: `bun web measure:frame-rate --scenario=baseline --runs=2 --device=macbook-pro-m2` and `bun web measure:frame-rate --scenario=strict --runs=2 --device=macbook-pro-m2`.
- Baseline scene: Stage 1-1, Raiders Deck, seed 4.
- Strict scene: Dungeon 3, Vanguard Deck, seed 4. The profile was set to level 30 with the QA hook.
- Hero Models were enabled for every run.

| Run | Scene | Duration | Mean fps | p50 | p95 | p99 | Worst | Max draw calls | Native DPR | Settled DPR | DPR changes | Result |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | Stage 1-1, Raiders, seed 4 | 87.7 s | 58.4 | 16.7 ms | 17.7 ms | 19.0 ms | 476.4 ms | 75 | 2 | 2 | 0 | Win |
| 2 | Stage 1-1, Raiders, seed 4 | 87.2 s | 59.7 | 16.7 ms | 17.7 ms | 19.2 ms | 228.2 ms | 75 | 2 | 2 | 0 | Win |
| 3 | Dungeon 3, Vanguard, seed 4 | 120.9 s | 60.0 | 16.7 ms | 17.7 ms | 19.2 ms | 46.1 ms | 122 | 2 | 2 | 0 | Loss |
| 4 | Dungeon 3, Vanguard, seed 4 | 120.1 s | 59.8 | 16.7 ms | 17.5 ms | 20.7 ms | 178.8 ms | 122 | 2 | 2 | 0 | Loss |

- Budget: mean fps 60 or more and p95 frame time 16.7 ms or less. All four runs miss the p95 budget. Runs 1 and 2 also miss the mean. Runs 3 and 4 make the mean within rounding and miss p95.
- The DPR stayed at 2 in every run. Hero Models raised the draw calls to 75 in Stage 1-1 and 122 in Dungeon 3, both under the 150 limit.
- Raw files:
  - [`2026-10-31-macbook-pro-m2-baseline-run-1.json`](../../apps/web/artifacts/performance/2026-10-31-macbook-pro-m2-baseline-run-1.json)
  - [`2026-10-31-macbook-pro-m2-baseline-run-2.json`](../../apps/web/artifacts/performance/2026-10-31-macbook-pro-m2-baseline-run-2.json)
  - [`2026-10-31-macbook-pro-m2-strict-run-1.json`](../../apps/web/artifacts/performance/2026-10-31-macbook-pro-m2-strict-run-1.json)
  - [`2026-10-31-macbook-pro-m2-strict-run-2.json`](../../apps/web/artifacts/performance/2026-10-31-macbook-pro-m2-strict-run-2.json)

### 2026-10-31 — 2022 mid-range Android phone: deferred

Not measured. The maintainer deferred all mobile device testing on 2026-10-31 because no Android phone is available. The 30 fps mean and 33 ms p95 target stays in PRD NFR-01, but it is out of scope until a device is attached.

When a device is available, the runner can drive a real phone over USB:

```sh
adb forward tcp:9222 localabstract:chrome_devtools_remote
bun web measure:frame-rate --url=http://<host>:<port> --device=<phone> --cdp=http://127.0.0.1:9222
```

The phone must be in landscape, with a normal brightness and no charger.

### 2026-10-31 — Hero Models manual desktop check

This is a manual observation, not the full NFR-01 protocol. The maintainer accepted it as the laptop evidence on 2026-10-31.

- Build: commit `2f164f615b`. The check did not save a raw file.
- Method: manual Battle in the maintainer's own Google Chrome on the 2022 MacBook Pro 13-inch (M2, 2022), with `__THREE_GAME_DIAGNOSTICS__`.
- Observed: 60 fps, 16 ms frame time, 57 draw calls in the current frame.
- Missing from the full protocol: mean fps and p95 over a full Battle, p99, DPR, host load, exact Stage/seed, Hero appearance and raw JSON. The current draw-call count also does not prove that the per-frame maximum is under 150.
- Laptop: accepted by the maintainer. The full protocol re-run is tracked in [#140](https://github.com/rifandani/heynbord/issues/140).
- Android: deferred; all mobile device testing is skipped until a device is attached.
- The full run should use the largest Hero appearance (Dawn Gaze + Iron Vine).

## Bundle — 2026-10-26 — First Load JavaScript for `/play`

### Result

| Item | Value |
| --- | --- |
| Budget (Technical Design section 6) | Less than 500,000 B gzip |
| Measured total | 461,756 B gzip |
| Difference | 38,244 B under the budget (7.6%) |
| Result | **Pass** |

The total fell from 720,935 B (the triage record for issue #139) to 461,756 B,
a decrease of 259,179 B (35.9%). The method is the one in issue #139:
`gzip -9` on each JavaScript file that the `/play` HTML preloads.

### Method

1. Build the app with `bun run build` in `apps/web`.
2. Start the built server with `node .output/server/index.mjs`.
3. Load `http://localhost:4111/play`.
4. Read each `<script src>` and `<link rel="modulepreload" href>` that points to
   an `assets/*.js` file.
5. Compress each file with `gzip -9` and add the sizes.

The build is commit `3c38f0d0ae` with the issue #139 change set in the working
tree. The Service Worker is not active during this measurement.

### First-load files

| gzip -9 (B) | File |
| --- | --- |
| 98,801 | `assets/use-translation-*.js` |
| 82,047 | `assets/src-*.js` |
| 67,465 | `assets/react-*.js` |
| 48,614 | `assets/index-*.js` |
| 39,171 | `assets/Dialog-*.js` |
| 38,843 | `assets/dist-*.js` |
| 32,664 | `assets/play-*.js` |
| 28,154 | `assets/game-scrim-*.js` |
| 4,721 | `assets/use-battle-*.js` |
| 4,540 | `assets/playback-*.js` |
| 4,376 | `assets/battle-timeline-*.js` |
| 3,173 | `assets/region-map-*.js` |
| 2,207 | `assets/battle-audio-*.js` |
| 1,483 | `assets/button-*.js` |
| 1,028 | `assets/language-toggle-*.js` |
| 786 | `assets/Link-*.js` |
| 677 | `assets/achievements-*.js` |
| 592 | `assets/reduced-motion-*.js` |
| 527 | `assets/profile.atoms-*.js` |
| 485 | `assets/shim-*.js` |
| 460 | `assets/rolldown-runtime-*.js` |
| 355 | `assets/use-handbook-*.js` |
| 338 | `assets/town.atoms-*.js` |
| 249 | `assets/achievements-screen.atoms-*.js` |
| **461,756** | **Total (24 files)** |

The Town, the Town Bar and the Settings dialog are in this set. Every other
screen, the Battle UI, the Handbook dialog and the Deck dialog load in a
separate chunk at first open.

### Service Worker precache

The precache falls from 25 entries and 5,246 KiB to 38 entries and 1,970 KiB
(the size that Workbox reports). The app shell and its shared modules stay.
Lazy screen chunks, game art and music are not in the precache. The screens
and the art go to the runtime caches when a Player opens them.

### Landing page

The `/` JavaScript stays at about 342 KB gzip: it does not include a game
screen, the Battle UI or a lazy dialog.

## First load (NFR-02)

### 2026-10-26T07:28:19.421Z — FAIL

- Command (repository root): `bun web measure:first-load`. This removes the previous production output, builds the app, starts a compressed Nitro production origin, runs Chromium, writes this section, and stops both processes. Install the existing browser first with `bun web test:install` if needed.
- Commit: `00e2baea29ff7da61b15af651c3dc41e1d3bd4b7`. The build includes uncommitted changes (listed below); this is a working tree measurement.
- Browser: Chromium 153.0.8010.12, headless; host: darwin 25.5.0.
- Device: emulated mid-range Android (Pixel 6a user agent), 412×915 CSS pixels, DPR 2, mobile touch, 4× CPU slowdown. The viewport stays in portrait.
- Network: Slow 4G, 1.6 Mbps down, 750 kbps up, 150 ms RTT, a local HTTP proxy adds 150 ms before response headers and limits response bodies to a shared 200,000 B/s download queue and request bodies to a shared 93,750 B/s upload queue. Both page and Service Worker traffic cross this origin. Headers and loopback overhead are extra; this is an emulated link.
- Origin: http://127.0.0.1:53566; entry: http://127.0.0.1:53566/play (direct navigation).
- Cache: a new browser context and cleared HTTP cache for each cold run, with no prior storage or active Service Worker. New workers can install during the visit. Warm Load reuses the third context with its HTTP cache, storage and current Service Worker state. The worker status is recorded; an incomplete precache is not treated as ready.
- Input: one trusted touch at the Town Settings control center as soon as the Town and control are visible. An input listener records pointer-up time from navigation start. A frame observer records the first visible Settings dialog. No overlay is removed and no failed tap is retried.

| Run | Navigation to tap | Tap to visible dialog | ≤50 ms interaction | Page JavaScript encoded body bytes at tap | Precache decoded bytes | Navigation to SW ready |
| --- | ---: | --- | --- | ---: | ---: | ---: |
| Cold 1 | 4233.5 ms | Did not open within 1000 ms | FAIL | 581272 | 1321220 | Not ready by 20264.5 ms (installing) |
| Cold 2 | 4139.3 ms | Did not open within 1000 ms | FAIL | 581272 | 1321220 | Not ready by 20167.6 ms (installing) |
| Cold 3 | 4138.5 ms | Did not open within 1000 ms | FAIL | 581272 | 1321220 | Not ready by 20174.8 ms (installing) |
| Warm (context only) | 1825.3 ms | Did not open within 1000 ms | FAIL | 822305 | 5343789 | Not ready by 17863.4 ms (installing) |

- Median of 3 cold tap times: **4139.3 ms**.
- Median qualified First Load: **not reached — the Settings interaction gate failed**. A tap time alone is not time to interactive.
- NFR-02 (less than 3000 ms and a Settings response of at most 50 ms): **FAIL**. Observed tap targets: "⟳Turn your phone to landscape to play.", "⟳Turn your phone to landscape to play.", "⟳Turn your phone to landscape to play.".
- First JavaScript: 2335150 bytes uncompressed; **723735 bytes gzip**; 581272 bytes brotli. Budget: less than 500,000 bytes gzip (500 KB, decimal): **FAIL**. This sums distinct page JavaScript resources completed by the tap, including module preloads; it excludes worker precache traffic. The bundle table lists their URLs.
- Compression check: `/assets/play-D46bcByJ.js` returns `content-encoding: gzip` with `Accept-Encoding: gzip`. Page encoded body bytes use the encoding Chromium negotiated; gzip (level 9) and brotli sizes above are computed from the same built files.
- Service Worker precache: 5 / 5 / 5 entries in the cold runs. Bytes are decoded response bodies stored in Workbox precaches, not wire bytes. If activation does not finish within 15 seconds after the tap result, the runner records the observation time and partial cache. Time is navigation to `navigator.serviceWorker.ready`, including registration and installation. It is separate from the tap gate.
- Follow-up for failures: [#139](https://github.com/rifandani/heynbord/issues/139). Bundle reduction is outside this measurement.

<details>
<summary>Measured JavaScript files</summary>

| File | Uncompressed bytes | Gzip bytes | Brotli bytes |
| --- | ---: | ---: | ---: |
| `/assets/Link-BtjlrbxS.js` | 125026 | 42082 | 36660 |
| `/assets/game-screen-_q_5mtjP.js` | 177838 | 55028 | 46499 |
| `/assets/hero-portrait-art-CW61B4PS.js` | 15178 | 5232 | 4799 |
| `/assets/index-cahG1ROO.js` | 347465 | 110819 | 95951 |
| `/assets/language-toggle-BWVYNLN_.js` | 1300 | 785 | 713 |
| `/assets/menu-CzHFYPEJ.js` | 166014 | 50223 | 42289 |
| `/assets/play-D46bcByJ.js` | 877987 | 267942 | 192425 |
| `/assets/react-B6PPDU_E.js` | 8539 | 3303 | 2949 |
| `/assets/src-CgBPloMH.js` | 305080 | 84532 | 72732 |
| `/assets/unit-clips-CKLov9LM.js` | 9110 | 2734 | 2470 |
| `/assets/use-translation-W8IN6JnO.js` | 295960 | 98839 | 81835 |
| `/assets/workbox-window.prod.es5-Bd17z0YL.js` | 5653 | 2216 | 1950 |

</details>

<details>
<summary>Working tree at build time</summary>

```text
M .github/workflows/ci.yml
 M apps/web/GLOSSARY.md
 M apps/web/package.json
 M apps/web/vite.config.ts
 M packages/rules/package.json
 M packages/rules/scripts/simulate.ts
?? apps/web/scripts/measure-first-load.ts
```

</details>

### 2026-10-31T12:43:18.365Z — FAIL

- Command (repository root): `bun web measure:first-load`. This removes the previous production output, builds the app, starts a compressed Nitro production origin, runs Chromium, writes this section, and stops both processes. Install the existing browser first with `bun web test:install` if needed.
- Commit: `b096b093a0b63506a3b91e0b419f5f85406359ce`. Clean working tree.
- Browser: Chromium 153.0.8010.12, headless; host: darwin 25.5.0.
- Device: emulated mid-range Android (Pixel 6a user agent), 915×412 CSS pixels in landscape, DPR 2, mobile touch, 4× CPU slowdown. The game shows a landscape guard to a coarse pointer in portrait, so the measured phone is held sideways.
- Network: Slow 4G, 1.6 Mbps down, 750 kbps up, 150 ms RTT, a local HTTP proxy adds 150 ms before response headers and limits response bodies to a shared 200,000 B/s download queue and request bodies to a shared 93,750 B/s upload queue. Both page and Service Worker traffic cross this origin. Headers and loopback overhead are extra; this is an emulated link.
- Origin: http://127.0.0.1:52583; entry: http://127.0.0.1:52583/play (direct navigation).
- Cache: a new browser context and cleared HTTP cache for each cold run, with no prior storage or active Service Worker. New workers can install during the visit. Warm Load reuses the third context with its HTTP cache, storage and current Service Worker state. The worker status is recorded; an incomplete precache is not treated as ready.
- Input: one trusted touch at the Town Settings control center as soon as the Town and control are visible. An input listener records pointer-up time from navigation start. A frame observer records the first visible Settings dialog. No overlay is removed and no failed tap is retried.

| Run | Navigation to tap | Tap to visible dialog | ≤50 ms interaction | Page JavaScript encoded body bytes at tap | Precache decoded bytes | Navigation to SW ready |
| --- | ---: | --- | --- | ---: | ---: | ---: |
| Cold 1 | 3287.7 ms | 207.3 ms | FAIL | 427939 | 1985815 | 4311.6 ms |
| Cold 2 | 3168.1 ms | 183.6 ms | FAIL | 427939 | 1985815 | 4963.0 ms |
| Cold 3 | 3097.6 ms | 185.0 ms | FAIL | 427939 | 1985815 | 4870.0 ms |
| Warm (context only) | 1101.9 ms | 127.9 ms | FAIL | 1538880 | 1985815 | 200.9 ms |

- Median of 3 cold tap times: **3168.1 ms**.
- Median qualified First Load: **not reached — the Settings interaction gate failed**. A tap time alone is not time to interactive.
- NFR-02 (less than 3000 ms and a Settings response of at most 50 ms): **FAIL**. Observed tap targets: "town-settings", "town-settings", "town-settings".
- First JavaScript: 1538880 bytes uncompressed; **496548 bytes gzip**; 426710 bytes brotli. Budget: less than 500,000 bytes gzip (500 KB, decimal): **PASS**. This sums distinct page JavaScript resources completed by the tap, including module preloads; it excludes worker precache traffic. The bundle table lists their URLs.
- Compression check: `/assets/play-BJKqbX13.js` returns `content-encoding: gzip` with `Accept-Encoding: gzip`. Page encoded body bytes use the encoding Chromium negotiated; gzip (level 9) and brotli sizes above are computed from the same built files.
- Service Worker precache: 34 / 34 / 34 entries in the cold runs. Bytes are decoded response bodies stored in Workbox precaches, not wire bytes. If activation does not finish within 15 seconds after the tap result, the runner records the observation time and partial cache. Time is navigation to `navigator.serviceWorker.ready`, including registration and installation. It is separate from the tap gate.
- Follow-up for failures: [#139](https://github.com/rifandani/heynbord/issues/139). Bundle reduction is outside this measurement.

<details>
<summary>Measured JavaScript files</summary>

| File | Uncompressed bytes | Gzip bytes | Brotli bytes |
| --- | ---: | ---: | ---: |
| `/assets/Dialog-DOFtmCYY.js` | 124309 | 39300 | 33350 |
| `/assets/Hooks-DlCcD2Y5.js` | 1521 | 770 | 696 |
| `/assets/Link-D3A98xe_.js` | 1504 | 770 | 681 |
| `/assets/ListBox-CJk4hC2n.js` | 10844 | 3920 | 3545 |
| `/assets/Schema-DV78m1_U.js` | 130888 | 42730 | 37533 |
| `/assets/achievements-screen.atoms-C3xTKLzf.js` | 1647 | 756 | 719 |
| `/assets/battle-timeline-pdCCvN9H.js` | 12838 | 4334 | 3998 |
| `/assets/battle.atoms-BzcAtvjb.js` | 7651 | 3055 | 2791 |
| `/assets/button-DDgDPb8E.js` | 2557 | 1085 | 947 |
| `/assets/client-BgAoEbL0.js` | 77347 | 26079 | 23244 |
| `/assets/dist-DL29brTf.js` | 74577 | 27105 | 24085 |
| `/assets/game-scrim-CFRyags3.js` | 80674 | 26896 | 23664 |
| `/assets/handbook.atoms-Ce0pO9qb.js` | 188 | 155 | 129 |
| `/assets/index-_TaobTsU.js` | 140011 | 46769 | 41490 |
| `/assets/language-toggle-BhYkjP0-.js` | 1718 | 1000 | 902 |
| `/assets/menu-Dg7k6Hbo.js` | 29321 | 7757 | 6780 |
| `/assets/play-BJKqbX13.js` | 123634 | 44043 | 37072 |
| `/assets/playback-DH29zyEo.js` | 72 | 88 | 76 |
| `/assets/profile.atoms-BwBF6KS1.js` | 2024 | 1047 | 957 |
| `/assets/react-DK9JGPcW.js` | 219089 | 67740 | 58166 |
| `/assets/reduced-motion-CEG1ID_f.js` | 1304 | 612 | 513 |
| `/assets/region-map-CQEIDTPG.js` | 8307 | 3153 | 2669 |
| `/assets/rolldown-runtime-XKyaHtl9.js` | 726 | 431 | 382 |
| `/assets/shim-CAofzGC6.js` | 864 | 468 | 410 |
| `/assets/src-Bv5zg5mJ.js` | 170678 | 40490 | 34377 |
| `/assets/surfaces-l-PGCpm4.js` | 42201 | 13470 | 11872 |
| `/assets/town.atoms-BB9KGlS2.js` | 504 | 321 | 295 |
| `/assets/use-handbook-HTE0KUn7.js` | 462 | 321 | 295 |
| `/assets/use-translation-DqY9LsXd.js` | 265767 | 89667 | 73122 |
| `/assets/workbox-window.prod.es5-Bd17z0YL.js` | 5653 | 2216 | 1950 |

</details>

## Repeat a record

The frame-rate runner is `apps/web/scripts/measure-frame-rate.ts`. Run
`bun web measure:frame-rate --device=<name>` on a real GPU, in a headed Google
Chrome, with no other heavy application. It writes one JSON file for each Battle
to `apps/web/artifacts/performance/`. Use `--scenario=baseline` or
`--scenario=strict` for one scenario, and `--cdp=http://127.0.0.1:9222` for a
real Android phone over USB. The host, browser, scene and result go into each
raw file.

The First Load runner is `apps/web/scripts/measure-first-load.ts`. ADR 0014
fixes the Slow 4G profile. Run `bun web measure:first-load` to add a dated
record under First load (NFR-02) with the median of 3 runs and the pass or fail
result for NFR-02. Keep the bundle record above: a First Load can pass the time
gate with a bundle above the budget on a faster link.

## Battle budgets — 2026-10-31

**Battle byte budgets: PASS for all three declared configurations.** This record
uses the approved limits in issue [#169](https://github.com/rifandani/heynbord/issues/169)
and the Hero Model checks in issue [#168](https://github.com/rifandani/heynbord/issues/168).
It measures byte totals. The existing NFR-01 and NFR-02 results above remain separate.
The 5-type Unit Model selection and the Unit atlas pages in this record were
removed on 2026-10-31. Its byte totals include assets that the current Battle
no longer loads.

- Measurement time: `2026-10-31T07:48:58.759Z` (UTC); 2026-10-31 in Asia/Jakarta.
- Build: commit `0fb375fc998780afdba2b042a89611876c8736af`, clean working tree. The record includes the Story, Battle budget and Hero Model work on this branch.
- Command: `bun check:battle-budget`. Run from the repository root. The command builds the production app with Hero Models enabled.
- One production build serves all three fixtures: Vite production mode, Nitro node-server, base `/`, Node `v26.3.0`, Bun `1.4.2`. Public E2E flags are empty.
- Stage 1-1: level 1, the valid 10-card Vanguard Starter Deck, Standard appearance, Board and Card Back. The measured set contains 19 distinct files.
- Stage 5-10: level 30, the valid 15-card Vanguard Archetype plus one Epic Iron Bulwark, Gold Crest portrait, Royal Plate Gear look, Hollow Moon Board skin and Gold Fleur Card Back. The measured set contains 66 distinct files.
- Stage 5-10 Hero: the same Battle with Hero Models enabled, Dawn Gaze portrait and Iron Vine Gear look. This is the largest published appearance at 536,656 bytes. The measured set contains 67 distinct files.

| Stage | Configuration | Asset bytes | Additional JavaScript, gzip level 9 | Result |
| --- | --- | ---: | ---: | --- |
| 1-1 | `stage-1-1-starter` | 3,507,253 | 401,989 | PASS |
| 5-10 | `stage-5-10-late` | 11,693,533 | 401,989 | PASS |
| 5-10 | `stage-5-10-hero` | 12,230,067 | 401,989 | PASS |

Count decimal published bytes before HTTP compression. Assets must total less
than 50,000,000 bytes, and additional JavaScript must total less than 5,000,000
bytes at gzip level 9. Exact thresholds fail. A warm cache gives no credit.
Count shared URLs once across both Decks, start Units, possible Tokens and
Boss Rule summons. Include original card art, full Race atlas pages, selected
models, selected appearance and cosmetics, painting, FX and music. Count
`defeat.ogg` (135,232 bytes), the larger result sting; `victory.ogg` is 122,945
bytes and is not also added. Current selected Unit Models are texture-free.
Their Meshopt decoder is inside the counted JavaScript. Future KTX2 models
also count the required local transcoder JavaScript and WASM. The Hero
appearance adds its one GLB and the selected 2D portrait fallback. Its separate
ceiling is 10,000,000 bytes; the largest appearance is 536,656 bytes.

Read the production `/play` HTML and the emitted graph from this same build.
Exclude the initial page graph, follow Battle lazy dependencies, and stop at
already loaded chunks before following unrelated screen imports. Count mixed
chunks conservatively, including the Hero code that every Battle build now
retains. This is a reachable-graph total, not a measured browser transfer.

The [complete machine record](../../artifacts/battle-budget-2026-10-31.json) contains the
configuration, selected model IDs, complete file lists, exact bytes, gzip
bytes, SHA-256 hashes, build configuration and dirty file list. The
[measurement guide](./20-battle-budgets.md) defines the command and counting
rules. CI runs all three fixtures on main pushes and pull requests.

Hero Model checks: `check_references.py --all` passes the 56 published
appearances (10 clips, a skeleton and embedded resources). The published
bytes total 27,713,416; the largest appearance is 536,656. The full
[56-appearance size report](../../artifacts/hero-model-sizes-2026-10-31.json) records each
file. The 560 pose images and the 8 × 7 idle matrix are under the ignored
`art/heroes/raw/` review folder. These are structural and draft visual
checks, not art approval.

Asset checks: all 96 compressed Unit Models load, retain their source bounds,
skinning and animation contracts, and pass the individual limits. All 98
transparent Unit/Token frames pass alpha, 512 px height and Race ownership
checks; their 12 pages total 4,709,900 bytes and stay within 2048 px. The
[battle music record](./20-battle-budgets.md#battle-music-optimization) lists reductions and
objective quality checks for all eight tracks. Chromium checks pass for
Stage preload reuse, failed-model fallback with continued play, stereo
audio decoding/playback, and the 844 × 390 landscape phone viewport. This is
viewport emulation, not a physical-phone frame-rate measurement. Human
listening was not performed.
