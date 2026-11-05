import type { Side } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties, ReactNode } from "react";

import { isAtLowHp } from "@/features/battle/health";
import { useGameText } from "@/features/battle/use-game-text";

/** Pause the material when the bar is off screen or the tab is hidden. */
const observeMotion = (node: HTMLDivElement) => {
  let visible = false;
  const update = () => {
    node.dataset.running = String(visible && !document.hidden);
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    update();
  });
  observer.observe(node);
  document.addEventListener("visibilitychange", update);
  return () => {
    observer.disconnect();
    document.removeEventListener("visibilitychange", update);
  };
};

/** A metal HP vessel. Its texture keeps its scale as the HP level changes. */
export const HealthBar = ({
  side,
  hp,
  maxHp,
  className,
  valueTestId,
  children,
}: {
  readonly side: Side;
  readonly hp: number;
  readonly maxHp: number;
  readonly className?: string;
  readonly valueTestId?: string;
  readonly children?: ReactNode;
}) => {
  const { tr } = useGameText();
  const level = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  return (
    <div
      ref={observeMotion}
      className={cn("battle-health", className)}
      data-side={side}
      data-low={hp > 0 && isAtLowHp({ hp, maxHp }) ? true : undefined}
      data-empty={hp <= 0 ? true : undefined}
      // SAFETY: React's style type does not list CSS custom properties.
      style={{ "--hp-level": level } as CSSProperties}
    >
      <meter
        className="sr-only"
        aria-label={tr("battle.hp")}
        min={0}
        max={maxHp}
        value={hp}
      >
        {hp}/{maxHp}
      </meter>
      <div className="battle-health__frame" aria-hidden>
        <div className="battle-health__well" aria-hidden>
          <div className="battle-health__trail" />
          <div className="battle-health__fill">
            <div className="battle-health__flow" />
            <div className="battle-health__light" />
          </div>
        </div>
        <span className="battle-health__value" data-testid={valueTestId}>
          {hp}
          <span className="battle-health__maximum">/{maxHp}</span>
        </span>
      </div>
      <div className="battle-health__markers">{children}</div>
    </div>
  );
};
