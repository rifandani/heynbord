import sharp from "sharp";

import type { Page } from "./_base";

/** WCAG 2.2 relative luminance. Inputs are encoded sRGB, from 0 to 255. */
export const luminance = (rgb: readonly number[]) => {
  const [red = 0, green = 0, blue = 0] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const contrastRatio = (a: readonly number[], b: readonly number[]) => {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

/** Measures a meaningful cue on a flat surface, using the browser's colors. */
export const measureSolidCue = async (
  page: Page,
  selector: string,
  foregroundProperty = "border-top-color",
  backgroundProperty = "background-color"
) => {
  const colors = await page.locator(selector).evaluate(
    (element, properties) => {
      const context = document.createElement("canvas").getContext("2d");
      if (!context) {
        throw new Error("The contrast check needs a 2D canvas");
      }
      const style = getComputedStyle(element);
      return properties.map((property) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = style.getPropertyValue(property);
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data];
      });
    },
    [foregroundProperty, backgroundProperty]
  );
  if (!colors[0] || !colors[1] || colors.some((color) => color[3] !== 255)) {
    throw new Error("Use manual compositing for a translucent cue");
  }
  return contrastRatio(colors[0].slice(0, 3), colors[1].slice(0, 3));
};

/**
 * Samples the actual paint behind each visible text run. This includes artwork,
 * gradients and translucent plates, which an ancestor background-color misses.
 * Text fill is hidden without changing layout, backgrounds, or SVG icons.
 * Image lettering, SVG/WebGL text and transient animation frames need manual review.
 */
export const measureTextContrast = async (page: Page, scope?: string) => {
  await page.evaluate(() => document.fonts.ready);
  const runs = await page.evaluate((selector) => {
    const root = selector ? document.querySelector(selector) : document.body;
    if (!root) {
      throw new Error(`Missing contrast audit surface: ${selector}`);
    }
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("The contrast check needs a 2D canvas");
    }
    const viewport = { width: innerWidth, height: innerHeight };
    let nextId = 0;
    const clippedAt = (element: Element, x: number, y: number) => {
      if (x >= viewport.width || y >= viewport.height) {
        return true;
      }
      for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        const style = getComputedStyle(parent);
        const rect = parent.getBoundingClientRect();
        if (
          style.overflowX !== "visible" &&
          (x < rect.left || x >= rect.right)
        ) {
          return true;
        }
        if (
          style.overflowY !== "visible" &&
          (y < rect.top || y >= rect.bottom)
        ) {
          return true;
        }
      }
      return false;
    };
    const visiblePoints = (
      element: Element,
      rect: DOMRect,
      pointerEvents: string
    ) => {
      const box = element.getBoundingClientRect();
      const left = Math.max(rect.left, box.left);
      const right = Math.min(rect.right, box.right);
      let hitOwner = element;
      if (pointerEvents === "none") {
        while (
          hitOwner.parentElement &&
          getComputedStyle(hitOwner).pointerEvents === "none"
        ) {
          hitOwner = hitOwner.parentElement;
        }
      }
      const points: { x: number; y: number }[] = [];
      for (const across of [0.15, 0.5, 0.85]) {
        for (const down of [0.25, 0.5, 0.75]) {
          const x = left + (right - left) * across;
          const y = rect.top + rect.height * down;
          if (
            x < 0 ||
            y < 0 ||
            x >= viewport.width ||
            y >= viewport.height ||
            clippedAt(element, x, y)
          ) {
            continue;
          }
          const hit = document.elementFromPoint(x, y);
          if (
            selector ||
            (hit && (element.contains(hit) || hit === hitOwner))
          ) {
            points.push({ x: Math.floor(x), y: Math.floor(y) });
          }
        }
      }
      return points;
    };
    const withinViewport = (rect: DOMRect) =>
      rect.width >= 2 &&
      rect.height >= 2 &&
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= viewport.height &&
      rect.right <= viewport.width;
    const paintOf = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      let opacity = 1;
      const filters: string[] = [];
      for (
        let parent: Element | null = element;
        parent;
        parent = parent.parentElement
      ) {
        const parentStyle = getComputedStyle(parent);
        opacity *= Number(parentStyle.opacity);
        filters.push(
          ...(parentStyle.filter.match(
            /(?:brightness|contrast|grayscale|sepia|saturate|invert|opacity)\([^)]*\)/gu
          ) ?? [])
        );
      }
      context.clearRect(0, 0, 1, 1);
      context.filter = filters.join(" ") || "none";
      context.fillStyle = style.color;
      context.fillRect(0, 0, 1, 1);
      const rgba = [...context.getImageData(0, 0, 1, 1).data];
      return { opacity, rgba };
    };
    const readNode = (node: Node) => {
      const element = node.parentElement;
      const text = node.textContent?.trim();
      if (
        !element ||
        !text ||
        element.closest("script,style,svg,[data-tsd-source-panel]")
      ) {
        return [];
      }
      if (
        !element.checkVisibility({
          checkOpacity: true,
          checkVisibilityCSS: true,
        })
      ) {
        return [];
      }
      const style = getComputedStyle(element);
      const range = document.createRange();
      range.selectNodeContents(node);
      const { opacity, rgba } = paintOf(element);
      const size = Number(style.fontSize.replace("px", ""));
      const large =
        size >= 24 || (size >= 18.6667 && Number(style.fontWeight) >= 700);
      const found = [];
      for (const rect of range.getClientRects()) {
        if (!withinViewport(rect)) {
          continue;
        }
        // Screen-reader-only text has a 1px clipped box.
        if (
          element.closest(".sr-only") ||
          style.clipPath !== "none" ||
          style.clip !== "auto"
        ) {
          continue;
        }
        // Exclude points under sticky headings and outside overflow clips.
        const points = visiblePoints(element, rect, style.pointerEvents);
        if (points.length === 0) {
          continue;
        }
        const box = element.getBoundingClientRect();
        found.push({
          id: (element.dataset.contrastId ??= String((nextId += 1))),
          bounds: { x: box.x, y: box.y, width: box.width, height: box.height },
          text,
          color: rgba,
          opacity,
          required: large ? 3 : 4.5,
          points,
          source:
            element.closest<HTMLElement>("[data-testid]")?.dataset.testid ??
            element.className,
        });
      }
      return found;
    };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const found = [];
    while (walker.nextNode()) {
      found.push(...readNode(walker.currentNode));
    }
    return found;
  }, scope);
  const hidden = await page.addStyleTag({
    content:
      "* { -webkit-text-fill-color: transparent !important; text-shadow: none !important; caret-color: transparent !important; }",
  });
  let screenshot: Buffer;
  try {
    screenshot = await page.screenshot({ scale: "css", timeout: 30_000 });
  } finally {
    await hidden.evaluate((node) => {
      if (node instanceof HTMLElement) {
        node.remove();
      }
    });
  }
  const { data, info } = await sharp(screenshot)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // A timed notification can leave between the DOM read and the capture.
  // Its old position then contains a different surface. Do not measure it
  // as if the text were still there. Dedicated notification states cover it.
  const after = await page
    .locator("[data-contrast-id]")
    .evaluateAll((elements) =>
      elements
        .filter((element) => element instanceof HTMLElement)
        .map((element) => {
          const box = element.getBoundingClientRect();
          const result = {
            id: element.dataset.contrastId,
            text: element.textContent ?? "",
            bounds: {
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
            },
          };
          delete element.dataset.contrastId;
          return result;
        })
    );
  const current = new Map(after.map((element) => [element.id, element]));
  return runs
    .filter((run) => {
      const element = current.get(run.id);
      return (
        element?.text.includes(run.text) &&
        Math.abs(element.bounds.x - run.bounds.x) < 1 &&
        Math.abs(element.bounds.y - run.bounds.y) < 1 &&
        Math.abs(element.bounds.width - run.bounds.width) < 1 &&
        Math.abs(element.bounds.height - run.bounds.height) < 1
      );
    })
    .map((run) => {
      let ratio = Number.POSITIVE_INFINITY;
      for (const { x, y } of run.points) {
        const index = (y * info.width + x) * info.channels;
        const background = [
          data[index] ?? 0,
          data[index + 1] ?? 0,
          data[index + 2] ?? 0,
        ];
        const alpha = ((run.color[3] ?? 255) / 255) * run.opacity;
        const foreground = background.map(
          (channel, i) => channel + ((run.color[i] ?? 0) - channel) * alpha
        );
        ratio = Math.min(ratio, contrastRatio(foreground, background));
      }
      return {
        text: run.text,
        source: run.source,
        ratio,
        required: run.required,
        opacity: run.opacity,
        color: run.color,
      };
    });
};
