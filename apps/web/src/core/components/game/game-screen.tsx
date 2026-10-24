import { cn } from "cn";
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";

/** The back color of a screen while its painting loads. */
export type GameScreenTone = "clear" | "crypt" | "shop";

const TONES: Readonly<Record<GameScreenTone, string>> = {
  clear: "",
  crypt: "bg-crypt",
  shop: "bg-shop",
};

export type GameScreenProps = {
  /** The accessible name of the screen. Every screen has one. */
  readonly label: string;
  readonly tone?: GameScreenTone;
  /**
   * A preview inside a frame (the Component Catalog) instead of the whole
   * viewport. The landing page can use this to show a screen in a card.
   */
  readonly contained?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
  readonly ref?: Ref<HTMLElement>;
  readonly [key: `data-${string}`]: string | number | boolean | undefined;
} & Omit<
  ComponentPropsWithoutRef<"main">,
  "aria-label" | "className" | "children" | "ref"
>;

/**
 * The shell of every Heynbord screen: a full-screen, fade-in surface that
 * hides its overflow and sits under the Town Bar. It is the one wrapper of
 * the Achievements, Bazaar, Dungeons, Heynspire, Packs, Seaport, Workshop and
 * Hero screens, so a page outside `/play` frames its content the same way.
 */
export const GameScreen = ({
  label,
  tone = "clear",
  contained = false,
  className,
  children,
  ...props
}: GameScreenProps) => (
  <main
    {...props}
    aria-label={label}
    className={cn(
      "text-cream overflow-hidden",
      contained
        ? "absolute inset-0"
        : "fade-in animate-in fixed inset-0 duration-300 motion-reduce:animate-none",
      TONES[tone],
      className
    )}
  >
    {children}
  </main>
);

/**
 * The heading of a screen. Most screens name themselves with `aria-label` and
 * keep the visible title in the painting, so this one is for screen readers.
 */
export const GameScreenTitle = ({
  className,
  children,
}: {
  readonly className?: string;
  readonly children: ReactNode;
}) => <h1 className={cn("sr-only", className)}>{children}</h1>;
