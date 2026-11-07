import { describe, expect, test } from "bun:test";

import type { LoadedView, Raster } from "./check.ts";
import { admissionOf } from "./check.ts";
import type { TurnaroundRecord, View } from "./turnaround.ts";
import { VIEW_SIZE, VIEWS } from "./turnaround.ts";

type Color = readonly [number, number, number];

const GREY: Color = [230, 230, 230];
const FOREST: Color = [70, 110, 80];
const RED: Color = [170, 40, 30];
const BLUE: Color = [30, 60, 160];
const YELLOW: Color = [240, 230, 20];

/** A small image, so the tests stay fast. The gate scales each image first. */
const raster = (paint: (x: number, y: number) => Color): Raster => {
  const width = 60;
  const height = 80;
  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      data.set(paint(x, y), (y * width + x) * 3);
    }
  }
  return { data, width, height };
};

/** A red and blue figure that fills `share` of the height, on a background. */
const figure = (
  background: Color,
  { share = 0.8, top = RED, bottom = BLUE } = {}
): Raster => {
  const margin = (80 * (1 - share)) / 2;
  return raster((x, y) => {
    if (x < 20 || x >= 40 || y < margin || y >= 80 - margin) {
      return background;
    }
    return y < 40 ? top : bottom;
  });
};

const painting = figure(FOREST);

const good: TurnaroundRecord = {
  id: "crag-rhino",
  source: "apps/web/public/creature/feral/crag-rhino.webp",
  views: {
    front: "front.webp",
    "three-quarter": "three-quarter.webp",
    side: "side.webp",
    back: "back.webp",
    details: "details.webp",
  },
  props: ["broken shield"],
  approval: {
    status: "approved",
    by: "rifandani",
    date: "2026-11-05",
    notes: "",
  },
};

const viewsWith = (
  changes: Partial<Record<View, Raster | undefined>> = {}
): ReadonlyMap<View, LoadedView> =>
  new Map(
    VIEWS.flatMap((view) => {
      const image = view in changes ? changes[view] : figure(GREY);
      return image ? [[view, { image, size: VIEW_SIZE }] as const] : [];
    })
  );

const admit = (
  record: TurnaroundRecord | undefined = good,
  views = viewsWith()
) =>
  admissionOf({
    id: "crag-rhino",
    record,
    views,
    painting,
    propsRow: "One broken shield on its horn, and a second shield that flies.",
  });

const codesOf = (result: ReturnType<typeof admit>) =>
  result.problems.map(({ view, code }) => (view ? `${view}:${code}` : code));

describe("the reference admission gate", () => {
  test("passes a good Turnaround", () => {
    const result = admit();

    expect(result.problems).toEqual([]);
    expect(result.passed).toBe(true);
  });

  test("fails on a missing view", () => {
    expect(codesOf(admit(good, viewsWith({ back: undefined })))).toEqual([
      "back:missing",
    ]);
  });

  test("fails on a missing detail sheet", () => {
    expect(codesOf(admit(good, viewsWith({ details: undefined })))).toEqual([
      "details:missing",
    ]);
  });

  test("fails on a view of the wrong size", () => {
    const views = new Map(viewsWith());
    views.set("side", {
      image: figure(GREY),
      size: { width: 800, height: 800 },
    });

    expect(codesOf(admit(good, views))).toEqual(["side:size"]);
  });

  test("fails on a view with a painted background", () => {
    const scene = raster((x, y) => [(x * 4) % 256, (y * 3) % 256, 90]);

    expect(codesOf(admit(good, viewsWith({ front: scene })))).toContain(
      "front:background"
    );
  });

  test("fails on a palette outside the card painting", () => {
    const yellow = figure(GREY, { top: YELLOW, bottom: YELLOW });

    expect(codesOf(admit(good, viewsWith({ side: yellow })))).toEqual([
      "side:palette",
    ]);
  });

  test("does not count the background of the painting as a palette", () => {
    const green = figure(GREY, { top: FOREST, bottom: FOREST });

    expect(codesOf(admit(good, viewsWith({ side: green })))).toEqual([
      "side:palette",
    ]);
  });

  test("fails on a figure that does not fill the frame", () => {
    const small = figure(GREY, { share: 0.4 });

    expect(codesOf(admit(good, viewsWith({ front: small })))).toEqual([
      "front:fill",
    ]);
  });

  test("does not ask the detail sheet to fill the frame", () => {
    const sheet = figure(GREY, { share: 0.4 });

    expect(codesOf(admit(good, viewsWith({ details: sheet })))).toEqual([]);
  });

  test("fails on a missing record", () => {
    expect(
      admissionOf({
        id: "crag-rhino",
        record: undefined,
        views: viewsWith(),
        painting,
        propsRow: "",
      }).problems.map(({ code }) => code)
    ).toEqual(["record"]);
  });

  test("fails on a record of another unit", () => {
    expect(codesOf(admit({ ...good, id: "bone-rampart" }))).toEqual(["record"]);
  });

  test.each(["pending", "rejected"] as const)(
    "fails on a %s approval",
    (status) => {
      expect(
        codesOf(admit({ ...good, approval: { ...good.approval, status } }))
      ).toEqual(["approval"]);
    }
  );

  test("fails on an approval with no person or no date", () => {
    expect(
      codesOf(admit({ ...good, approval: { ...good.approval, by: "" } }))
    ).toEqual(["approval"]);
    expect(
      codesOf(admit({ ...good, approval: { ...good.approval, date: "" } }))
    ).toEqual(["approval"]);
  });

  test("fails on an empty list of props", () => {
    expect(codesOf(admit({ ...good, props: [] }))).toEqual(["props"]);
  });

  test("fails on a prop that is not in the Props row", () => {
    const result = admit({ ...good, props: ["broken shield", "war banner"] });

    expect(codesOf(result)).toEqual(["props"]);
    expect(result.problems[0]?.detail).toContain("war banner");
  });

  test("reads a prop with no regard to capital letters", () => {
    expect(codesOf(admit({ ...good, props: ["Broken Shield"] }))).toEqual([]);
  });

  test("reports all problems of a unit together", () => {
    expect(
      codesOf(
        admit({ ...good, props: [] }, viewsWith({ back: undefined }))
      ).toSorted()
    ).toEqual(["back:missing", "props"]);
  });
});
