import { useContext } from "react";
import type { TooltipProps } from "react-aria-components";
import { Tooltip, TooltipTriggerStateContext } from "react-aria-components";

import { nightPlateStyles } from "./surfaces";

/**
 * A Tooltip that is in the DOM only while its TooltipTrigger is open. Use it in
 * place of the react-aria Tooltip on a Heynbord surface.
 *
 * A react-aria Tooltip that closes "instantly" (hover moves to the next
 * tooltip) keeps its exit state. A later blur of its trigger shows it again,
 * still closed, so it has no position: it stays in the top-left corner of the
 * page. The game tooltips have no exit animation, so to unmount at once loses
 * nothing.
 */
export const GameTooltip = (props: TooltipProps) => {
  const state = useContext(TooltipTriggerStateContext);
  return state?.isOpen ? <Tooltip {...props} /> : null;
};

/** The surface of a short game tooltip: a Night Plate at 95% with the drop. */
export const GAME_TOOLTIP_CLASS = nightPlateStyles({
  kind: "tooltip",
  padding: "sm",
  className: "bg-night-plate/95 text-xs",
});
