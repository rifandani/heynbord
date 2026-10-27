import { describe, expect, it } from "vitest";

import { musicTrackFor } from "@/core/audio/music-catalog";

describe("musicTrackFor", () => {
  it("uses the Town track outside a Battle", () => {
    expect(musicTrackFor(null, false)).toBe("town");
  });

  it("selects the Region theme for a Region Battle", () => {
    expect(musicTrackFor({ region: 3, boss: false }, true)).toBe("region-3");
  });

  it("uses the Boss theme for a Boss Stage and a non-Region Battle", () => {
    expect(musicTrackFor({ region: 2, boss: true }, true)).toBe("boss");
    expect(musicTrackFor(null, true)).toBe("boss");
  });

  it("uses the track of the open Feature screen", () => {
    expect(musicTrackFor(null, false, "packs")).toBe("packs");
    expect(musicTrackFor({ region: 1, boss: true }, true, "hero")).toBe("hero");
  });

  it("keeps the Region track within the available five themes", () => {
    expect(musicTrackFor({ region: 0, boss: false }, true)).toBe("region-1");
    expect(musicTrackFor({ region: 8, boss: false }, true)).toBe("region-5");
  });
});
