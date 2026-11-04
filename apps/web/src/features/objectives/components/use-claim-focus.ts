import { useLayoutEffect, useRef } from "react";

/**
 * The focus after a Claim: the next Claim of the list, else Claim all while
 * it is on, else the list. The effect runs after each render, and it acts
 * only after a Claim.
 */
export const useClaimFocus = () => {
  const list = useRef<HTMLUListElement>(null);
  const claimAllButton = useRef<HTMLButtonElement>(null);
  const pending = useRef<{ readonly target: string | null } | null>(null);

  useLayoutEffect(() => {
    const claim = pending.current;
    if (claim === null) {
      return;
    }
    pending.current = null;
    const next =
      claim.target === null
        ? null
        : document.querySelector<HTMLElement>(`[data-claim="${claim.target}"]`);
    const all = claimAllButton.current;
    if (next) {
      next.focus();
    } else if (all && !all.disabled) {
      all.focus();
    } else {
      list.current?.focus();
    }
  });

  return {
    list,
    claimAllButton,
    /** Call it before the Claim changes the rows. */
    focusAfterClaim: (target: string | null) => {
      pending.current = { target };
    },
  };
};
