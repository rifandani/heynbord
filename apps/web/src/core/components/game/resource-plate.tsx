import { cn } from "cn";
import { Fragment, useState } from "react";
import type { ReactNode } from "react";
import type { PressEvent } from "react-aria-components";
import { Button, TooltipTrigger } from "react-aria-components";

import { GameTooltip } from "./game-tooltip";
import { nightPlateStyles } from "./surfaces";

const ICON = "size-5 shrink-0 [@media(max-height:500px)]:size-4";

export interface ResourceItem {
  /** A stable key, also used for the test id of the piece. */
  readonly id: string;
  /** The name of the resource, e.g. "Coin". */
  readonly name: string;
  /** What the resource pays for, shown under the name in the tooltip. */
  readonly use?: string;
  /** The icon of the resource. It is decorative; the name is in `name`. */
  readonly icon?: ReactNode;
  /** The amount, already formatted and localized. */
  readonly value: ReactNode;
  /** The full accessible name of the piece, e.g. "Coin, 1 Gold". */
  readonly spoken?: string;
  /** The test id of the tooltip, for a test that reads the help text. */
  readonly tooltipTestId?: string;
  /** A count of bumps; each new value plays one bump. */
  readonly bump?: number;
  readonly testId?: string;
}

/**
 * One resource on a plate: a focusable piece with a tooltip that says what the
 * resource pays for. On touch, a tap shows the tooltip. It has no action, so it
 * has no drop and no press (DESIGN.md, Balance Plate).
 */
const Resource = ({ item }: { readonly item: ResourceItem }) => {
  const [open, setOpen] = useState(false);
  const onPress = (event: PressEvent) => {
    if (event.pointerType !== "mouse") {
      setOpen((value) => !value);
    }
  };
  return (
    <TooltipTrigger
      isOpen={open}
      onOpenChange={setOpen}
      delay={200}
      shouldCloseOnPress={false}
    >
      <Button
        aria-label={item.spoken ?? item.name}
        onPress={onPress}
        className={cn(
          "flex h-10 cursor-default items-center rounded-[10px] px-3 outline-none",
          "text-base leading-none font-black tabular-nums",
          "data-[hovered]:bg-cream/10 transition-colors duration-100",
          "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4",
          "[@media(max-height:500px)]:h-8 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-sm"
        )}
        data-testid={item.testId ?? `resource-${item.id}`}
      >
        {/* A new key plays the bump again. */}
        <span
          key={item.bump}
          className={cn(
            "flex items-center gap-1.5 [@media(max-height:500px)]:gap-1",
            (item.bump ?? 0) > 0 &&
              "motion-safe:animate-[pack-pop_560ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
          )}
          data-bump={(item.bump ?? 0) > 0 ? item.bump : undefined}
        >
          {item.icon}
          {item.value}
        </span>
      </Button>
      <GameTooltip
        placement="bottom end"
        offset={8}
        data-testid={item.tooltipTestId}
        className={cn(
          nightPlateStyles({ kind: "tooltip", padding: "sm" }),
          "bg-night-plate/95 max-w-56 text-xs"
        )}
      >
        <span className="block font-bold">{item.name}</span>
        {item.use ? (
          <span className="text-cream/85 block">{item.use}</span>
        ) : null}
      </GameTooltip>
    </TooltipTrigger>
  );
};

/** The short gold divider between two resources. */
const Divider = () => (
  <span
    aria-hidden
    className="bg-gold-trim/25 h-5 w-0.5 shrink-0 rounded-full"
  />
);

/**
 * The plate of the resources of a surface (DESIGN.md, Balance Plate): a Night
 * Plate fixed to the top-right corner, inside the safe areas. It holds its
 * items in order, with a short divider between them.
 *
 * The game uses it for Coin, Essence and Heynstones; a landing page can show a
 * single resource, or the same plate without the fixed position.
 */
export const ResourcePlate = ({
  label,
  items,
  className,
  testId,
}: {
  /** The accessible name of the group, e.g. "Balances". */
  readonly label: string;
  readonly items: readonly ResourceItem[];
  readonly className?: string;
  readonly testId?: string;
}) => (
  <fieldset
    aria-label={label}
    className={cn(
      "absolute top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))] z-20 m-0 flex min-w-0 items-center p-0",
      nightPlateStyles({ kind: "plate", padding: "none" }),
      className
    )}
    data-shop-avoid="down"
    data-testid={testId}
  >
    {items.map((item, index) => (
      <Fragment key={item.id}>
        {index > 0 ? <Divider /> : null}
        <Resource item={item} />
      </Fragment>
    ))}
  </fieldset>
);

/** The icon size of a resource on the plate. */
export const RESOURCE_ICON_CLASS = ICON;
