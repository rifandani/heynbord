import { cn } from "cn";
import type { CSSProperties, ReactNode } from "react";

import { FIT_STRETCH, MAX_STRETCH } from "@/features/campaign/region-map";

/** The top edge of the painting fades into the backdrop when it is below the screen top. */
const FADE_MASK =
  "linear-gradient(to bottom, transparent, black var(--fade-top))";

const paintingMask: CSSProperties = {
  maskImage: FADE_MASK,
  WebkitMaskImage: FADE_MASK,
};

/**
 * The box of the painting, on the Town Bar and as wide as the screen. The
 * sides and the bottom are never cropped. The painting fills the height
 * above the Town Bar if it can, and stretches on the x axis by at most
 * `FIT_STRETCH`, or squashes by at most `MAX_STRETCH`, to fill the width
 * (as the Region Map, web ADR-0007). On a screen that is wider than that,
 * the painting gets taller than the space above the Town Bar, and the screen
 * crops its top. On a screen that is narrower, the backdrop shows above it.
 */
const frameStyle = (
  aspect: number
): CSSProperties & Record<"--frame-height" | "--fade-top", string> => ({
  "--frame-height": `max(min(100dvh - var(--town-bar), 100vw * ${(1 + MAX_STRETCH) / aspect}), 100vw / ${aspect * (1 + FIT_STRETCH)})`,
  "--fade-top":
    "clamp(0px, 100dvh - var(--town-bar) - var(--frame-height), var(--frame-height) * 0.06)",
  height: "var(--frame-height)",
  bottom: "var(--town-bar)",
});

/**
 * A painting of a screen with the Town Bar: the painting above the Town Bar,
 * as wide as the screen. A soft backdrop of the same painting fills the space
 * above it on a narrow screen, and its top edge fades into the backdrop
 * there. The children are over the painting, with positions in painting
 * percent.
 */
export const FittedPainting = ({
  src,
  width,
  height,
  className,
  style,
  backdropClassName,
  children,
}: {
  readonly src: string;
  /** The painting size in pixels. Only the aspect is used. */
  readonly width: number;
  readonly height: number;
  /** The classes of the painting box. */
  readonly className?: string;
  /** More styles of the painting box. */
  readonly style?: CSSProperties;
  readonly backdropClassName?: string;
  readonly children?: ReactNode;
}) => (
  <>
    <img
      src={src}
      alt=""
      draggable={false}
      className={cn(
        "absolute inset-0 size-full scale-110 object-cover blur-2xl brightness-[0.72] saturate-[0.9] select-none",
        backdropClassName
      )}
      aria-hidden
    />
    <div
      className={cn("absolute inset-x-0", className)}
      style={{ ...frameStyle(width / height), ...style }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full select-none"
        style={paintingMask}
      />
      {children}
    </div>
  </>
);
