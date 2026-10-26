# The First Load is measured on Slow 4G, with a mid-range Android and a real tap

NFR-02 says that the Town is interactive in less than 3 seconds on a 4G connection. "4G" has no single speed. At 1.6 Mbps (Slow 4G) the current first bundle needs about 3.6 s of transfer alone. At 9 Mbps (nominal 4G) the same bytes need about 0.65 s. A requirement with no profile can pass and fail at the same time.

The same problem applies to the word "interactive". A painted Town is not a usable Town. The Player must be able to select a control.

## Decision

- **Entry:** a direct First Load of `/play`. The landing page at `/` is not part of the game.
- **Network:** Slow 4G: 1.6 Mbps down, 750 kbps up, 150 ms RTT. This is the profile that web.dev and Lighthouse call "4G".
- **Device:** an emulated mid-range Android at 412×915, DPR 2, with a 4× CPU slowdown. NFR-01 already names a 2022 mid-range Android phone, so both records use the same device class.
- **Cache:** a new browser context with an empty cache and no active Service Worker.
- **Interactive:** the first tap on the Town Settings control opens the Settings dialog in 50 ms or less. The recorded value is the time from navigation start to that tap.
- **Runs:** 3 First Loads. The record uses the median.
- **Context, not the gate:** a desktop run, a nominal 4G run and a Warm Load.

## Considered Options

- **Nominal 4G (about 9 Mbps).** Rejected. It is too easy to pass, and it is not the profile that web.dev and Lighthouse call "4G".
- **A real phone on a real cellular network.** Rejected as the gate. The signal changes with the place and the time, so the record cannot be compared with the next one. It stays useful as extra context.
- **A painted Town with a quiet main thread.** Rejected. It does not prove that a Player can use the Town.

## Consequences

- The preview must compress its assets. The Nitro default sends JavaScript uncompressed.
- The gate runs in Chromium, the engine that most Players use. It does not prove Safari.
- A record needs the commit SHA, the browser version and the profile. Without them, the next record cannot compare with it.
- The bundle budget of Technical Design section 6 (less than 500 KB gzip) is the leading measure. A First Load can pass the time gate with a bundle above the budget on a faster link, so both values go in the record.
