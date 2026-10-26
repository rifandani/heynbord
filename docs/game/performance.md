# Performance records

This document records the measured performance of the game. Each record names
its date, its method, and the build that it measured.

## 2026-10-26 — First Load JavaScript for `/play`

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

### Time to interactive

Not measured. The First Load runner belongs to issue #130 and is not in the
tree. Issue #130 also owns asset compression for the local Nitro preview: the
preview sends JavaScript with no `content-encoding`, so a time measurement
against it is not valid. The NFR-02 time record is blocked on #130.

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

## Repeat a record

Issue #130 owns the runner and the Slow 4G profile. When it is in the tree,
add a dated record here with the median of 3 runs and the pass or fail result
for NFR-02. Keep the bundle record above: a First Load can pass the time gate
with a bundle above the budget on a faster link.
