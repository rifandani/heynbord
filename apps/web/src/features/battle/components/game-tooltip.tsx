import { useContext } from "react";
import type { TooltipProps } from "react-aria-components";
import { Tooltip, TooltipTriggerStateContext } from "react-aria-components";

/**
 * A Tooltip that is in the DOM only while its TooltipTrigger is open. Use it in
 * place of the react-aria Tooltip in game screens.
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
