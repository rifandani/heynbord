import { cn } from "cn";
import type { CSSProperties, ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "react-aria-components";

import { useGameText } from "@/features/battle/use-game-text";

/** The painting of the Card shop inside (Town Concepts, section 9): 1536 × 1024. */
const SHOP_IMAGE = "/town/card-shop-inside.webp";

/**
 * The lights of the painting, in painting percent: the brass lamp over the
 * curtain and the two lanterns. Each one breathes a little, as a flame does.
 */
const LAMPS: readonly {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly delay: number;
}[] = [
  { x: 51, y: 15, size: 34, delay: 0 },
  { x: 27.7, y: 8.5, size: 16, delay: -1.7 },
  { x: 91.8, y: 9.5, size: 16, delay: -3.1 },
];

/** Dust in the light of the round window, in painting percent. */
const MOTES: readonly {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly duration: number;
  readonly delay: number;
  readonly drift: number;
}[] = [
  { x: 12, y: 30, size: 3, duration: 9, delay: 0, drift: 28 },
  { x: 18, y: 44, size: 2, duration: 11, delay: -4, drift: 18 },
  { x: 24, y: 36, size: 4, duration: 12, delay: -7, drift: 34 },
  { x: 29, y: 52, size: 2, duration: 8, delay: -2, drift: 22 },
  { x: 15, y: 58, size: 3, duration: 10, delay: -6, drift: 30 },
  { x: 33, y: 28, size: 2, duration: 9.5, delay: -8, drift: 16 },
  { x: 21, y: 22, size: 3, duration: 13, delay: -3, drift: 26 },
  { x: 8, y: 48, size: 2, duration: 10.5, delay: -9, drift: 20 },
];

/**
 * The painted Card shop, at the size that covers the screen (3:2, cropped at
 * the edges), so that a point in painting percent stays on the same thing in
 * the painting at all screen sizes. Its children have positions in painting
 * percent. The lamps breathe and dust drifts in the window light; with
 * reduced motion they are still.
 */
export const ShopScene = ({ children }: { readonly children?: ReactNode }) => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute top-1/2 left-1/2 aspect-[3/2] w-[max(100vw,150dvh)] -translate-1/2">
      <img
        src={SHOP_IMAGE}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full select-none"
      />
      {LAMPS.map((lamp) => (
        <span
          key={`${lamp.x}:${lamp.y}`}
          className="pointer-events-none absolute aspect-square -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,206,130,0.32),rgba(255,180,90,0.12)_55%,transparent)] opacity-85 motion-safe:animate-[shop-lamp_5.5s_ease-in-out_infinite]"
          style={{
            left: `${lamp.x}%`,
            top: `${lamp.y}%`,
            width: `${lamp.size}%`,
            animationDelay: `${lamp.delay}s`,
          }}
          aria-hidden
        />
      ))}
      {MOTES.map((mote) => (
        <span
          key={`${mote.x}:${mote.y}`}
          className="pointer-events-none absolute rounded-full bg-[#fff0c8] opacity-0 shadow-[0_0_6px_1px_rgba(255,226,160,0.7)] motion-safe:animate-[shop-mote_var(--mote-duration)_ease-in-out_infinite] motion-reduce:hidden"
          // SAFETY: CSS custom properties for the keyframes. React's
          // `CSSProperties` does not model custom properties.
          style={
            {
              left: `${mote.x}%`,
              top: `${mote.y}%`,
              width: mote.size,
              height: mote.size,
              animationDelay: `${mote.delay}s`,
              "--mote-duration": `${mote.duration}s`,
              "--mote-x": `${mote.drift}px`,
            } as CSSProperties
          }
          aria-hidden
        />
      ))}
      {/* Darker edges, so the plates and the Town Bar stay easy to read. */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 60% 55% at 50% 55%, rgba(20,10,18,0.35), transparent 75%)",
            "linear-gradient(180deg, rgba(20,10,18,0.45) 0%, transparent 18%, transparent 78%, rgba(20,10,18,0.55) 100%)",
          ].join(", "),
        }}
        aria-hidden
      />
      {children}
    </div>
  </div>
);

/** The shopkeeper's head in the painting, in painting percent. */
const SHOPKEEPER = { x: 84, y: 26 } as const;

/** The space between the speech bubble and a HUD piece or the screen edge. */
const BUBBLE_MARGIN = 12;

/** The bubble gets no smaller than this; with less room, the shopkeeper is quiet. */
const BUBBLE_MIN_WIDTH = 200;

/** Where the bubble goes: a move to the right, a smaller width, or no room. */
interface BubbleFit {
  readonly shift: number;
  readonly width: number | null;
  readonly hidden: boolean;
}

const FREE: BubbleFit = { shift: 0, width: null, hidden: false };

/**
 * Keeps the bubble clear of the HUD pieces (`data-shop-avoid`): when it goes
 * over one, it moves right of it, and gets narrower if the screen edge is
 * near. If it still has no room, it hides.
 */
const fitBubble = (bubble: DOMRect): BubbleFit => {
  const edge = window.innerWidth - BUBBLE_MARGIN;
  let { left } = bubble;
  for (const piece of document.querySelectorAll("[data-shop-avoid]")) {
    const box = piece.getBoundingClientRect();
    const across = left < box.right && left + bubble.width > box.left;
    const over = bubble.top < box.bottom && bubble.bottom > box.top;
    if (across && over) {
      left = Math.max(left, box.right + BUBBLE_MARGIN);
    }
  }
  const width = Math.min(bubble.width, edge - left);
  if (width < BUBBLE_MIN_WIDTH) {
    return { shift: 0, width: null, hidden: true };
  }
  return left === bubble.left
    ? FREE
    : { shift: left - bubble.left, width, hidden: false };
};

/**
 * What the shopkeeper says: a parchment speech bubble over his head, which
 * grows out of its tail at each new line. The tail keeps pointing at him when
 * the bubble moves clear of the HUD. A press on the shopkeeper gives a new
 * line. He has no room on a short or narrow screen, where the Packs cover
 * him, so there he is quiet.
 */
export const ShopkeeperBubble = ({
  line,
  serial,
  onTalk,
}: {
  /** The text of the line. */
  readonly line: string;
  /** Changes with each new line, so the bubble grows again for a line said two times. */
  readonly serial: number;
  readonly onTalk: () => void;
}) => {
  const { tr } = useGameText();
  const anchor = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<BubbleFit>(FREE);

  useLayoutEffect(() => {
    const measure = () => {
      const box = anchor.current?.getBoundingClientRect();
      if (box && box.width > 0) {
        setFit(fitBubble(box));
      }
    };
    measure();
    // A new line changes the size of the bubble; a new screen size moves it.
    const observer = new ResizeObserver(measure);
    if (anchor.current) {
      observer.observe(anchor.current);
    }
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div className="max-[1099px]:hidden [@media(max-height:500px)]:hidden">
      {/* The shopkeeper: a press gives a new line. */}
      <Button
        onPress={onTalk}
        aria-label={tr("packs.shopkeeper.talk")}
        className="absolute top-[28%] left-[80%] h-[24%] w-[17%] cursor-pointer rounded-[40%] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]"
        data-testid="shopkeeper"
      />
      {/* The measured place of the bubble, before a move. */}
      <div
        ref={anchor}
        className="pointer-events-none invisible absolute w-[min(270px,21vw)] -translate-x-[70%] -translate-y-full"
        style={{ left: `${SHOPKEEPER.x}%`, top: `${SHOPKEEPER.y}%` }}
        aria-hidden
      >
        <span className="block px-3.5 py-2.5 text-sm leading-snug font-semibold">
          {line}
        </span>
      </div>
      <div
        className={cn(
          "pointer-events-none absolute w-[min(270px,21vw)] -translate-x-[70%] -translate-y-full",
          fit.hidden && "hidden"
        )}
        style={{
          left: `calc(${SHOPKEEPER.x}% + ${fit.shift}px)`,
          top: `${SHOPKEEPER.y}%`,
          width: fit.width ?? undefined,
        }}
      >
        <output
          key={serial}
          className="relative block origin-bottom rounded-xl border-2 border-[#5b3a1e] bg-[#f6ead0] px-3.5 py-2.5 text-sm leading-snug font-semibold text-[#2a1d12] shadow-[0_3px_0_rgba(0,0,0,0.35),0_10px_24px_rgba(0,0,0,0.35)] motion-safe:animate-[shopkeeper-say_340ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
          data-testid="shopkeeper-line"
        >
          <span className="sr-only">{tr("packs.shopkeeper.label")}: </span>
          {line}
          {/* The tail points down at the shopkeeper. */}
          <span
            className="absolute top-full -mt-px size-0 -translate-x-1/2 border-x-[9px] border-t-[12px] border-x-transparent border-t-[#5b3a1e]"
            style={{ left: `max(22px, calc(70% - ${fit.shift}px))` }}
            aria-hidden
          >
            <span className="absolute -top-[14px] -left-[6.5px] size-0 border-x-[6.5px] border-t-[9px] border-x-transparent border-t-[#f6ead0]" />
          </span>
        </output>
      </div>
    </div>
  );
};
