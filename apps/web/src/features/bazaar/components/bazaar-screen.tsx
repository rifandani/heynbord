/**
 * The Bazaar screen (Economy 3.5): the offers that the Player buys with
 * Heynstones. v1 sells only Cosmetics (ADR-0008), and the Player owns each one
 * forever. The shop panel stands between the 2 shopkeepers of the painting:
 * the tabs and the grid of one Cosmetic family at the left, and the Inspector
 * of the selected look at the right. A look that the Player owns can be made
 * the Active Cosmetic of its family.
 */
import type { Cosmetic, CosmeticId } from "@workspace/rules";
import { useMemo, useRef, useState } from "react";
import { TabPanel, Tabs } from "react-aria-components";

import { GameScreen } from "@/core/components/game/game-screen";
import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { useGameText } from "@/features/battle/use-game-text";
import type { LookFamily } from "@/features/bazaar/bazaar";
import {
  bazaarGroups,
  cosmeticItemKey,
  inspectorAction,
  shelfPreviewLook,
} from "@/features/bazaar/bazaar";
import { BazaarInspector } from "@/features/bazaar/components/bazaar-inspector";
import { BazaarScene } from "@/features/bazaar/components/bazaar-scene";
import { FamilyTabs } from "@/features/bazaar/components/family-tabs";
import { LookTiles } from "@/features/bazaar/components/look-tiles";
import { BAZAAR_CSS, BAZAAR_PANEL } from "@/features/bazaar/tokens";
import { useBazaar } from "@/features/bazaar/use-bazaar";
import { BalancePlate } from "@/features/town/components/balance-plate";
import { useCountTo } from "@/features/workshop/use-count-to";

/** The look that the Player selected on each tab. */
type ShownLooks = Partial<Record<LookFamily, CosmeticId | null>>;

/**
 * The Bazaar screen. Each tab opens on the Active look of its family, and it
 * keeps the selected look while the Player goes to another tab. The Balance
 * Plate shows the Heynstones next to the Coin and the Essence, so the Player
 * sees what the items cost.
 */
export const BazaarScreen = () => {
  const { tr } = useGameText();
  const {
    balances,
    heynstones,
    owned,
    classId,
    activeLooks,
    buy,
    select,
    selectStandard,
  } = useBazaar();
  const groups = useMemo(() => bazaarGroups(), []);
  const coin = useCountTo(balances.coin);
  const shownHeynstones = useCountTo(balances.heynstones);
  const [said, setSaid] = useState("");
  const [family, setFamily] = useState<LookFamily>("cardBack");
  const [shown, setShown] = useState<ShownLooks>({});
  const [sold, setSold] = useState<CosmeticId | null>(null);
  const tiles = useRef<HTMLDivElement>(null);

  const items = groups.find((group) => group.family === family)?.items ?? [];
  const activeId = activeLooks[family];
  const selected = shown[family];
  const shownId = selected === undefined ? activeId : selected;
  const shownItem = items.find((item) => item.id === shownId) ?? null;
  const action = inspectorAction(shownItem, activeId, owned, heynstones);

  const tryBuy = (item: Cosmetic) => {
    if (!buy(item.id, groups)) {
      setSaid(tr("bazaar.cannotBuy"));
      return;
    }
    unlockAudio();
    playSound("select");
    setSold(item.id);
    setSaid(
      tr("bazaar.bought", {
        name: tr(`bazaar.items.${cosmeticItemKey(item.id)}`),
      })
    );
  };

  const applyLook = (item: Cosmetic | null) => {
    const name =
      item === null
        ? tr(`bazaar.standard.${family}`)
        : tr(`bazaar.items.${cosmeticItemKey(item.id)}`);
    if (item === null) {
      selectStandard(family);
    } else if (!select(item.id)) {
      setSaid(tr("bazaar.cannotUse"));
      return;
    }
    unlockAudio();
    playSound("select");
    setSaid(tr("bazaar.used", { name }));
    // The "In use" plate takes the place of the Use button: the focus goes
    // back to the tile, so that the keyboard does not lose its place.
    tiles.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.focus();
  };

  return (
    <GameScreen label={tr("bazaar.label")} data-testid="bazaar">
      <BazaarScene />
      <BalancePlate
        balances={{ ...balances, coin, heynstones: shownHeynstones }}
      />
      {/* The page heading stays for screen readers only. */}
      <h1 className="sr-only">{tr("bazaar.title")}</h1>
      <Tabs
        selectedKey={family}
        onSelectionChange={(key) => {
          const group = groups.find((entry) => entry.family === key);
          if (group) {
            setSold(null);
            setFamily(group.family);
          }
        }}
        className="border-gold-trim/60 bg-night-plate text-cream absolute top-[calc(max(0.75rem,env(safe-area-inset-top))+3.5rem)] bottom-[calc(var(--town-bar)+0.5rem)] my-auto grid max-h-[46rem] grid-cols-[minmax(0,65fr)_minmax(0,35fr)] overflow-hidden rounded-2xl border-2 [@media(max-height:500px)]:top-[max(0.5rem,env(safe-area-inset-top))] [@media(max-height:500px)]:bottom-[calc(var(--town-bar)+0.25rem)] [@media(max-height:500px)]:rounded-xl"
        style={{ ...BAZAAR_PANEL, boxShadow: BAZAAR_CSS.panel }}
        data-testid="bazaar-panel"
      >
        <div className="flex min-h-0 min-w-0 flex-col">
          <FamilyTabs />
          {groups.map((group) => (
            <TabPanel
              key={group.family}
              id={group.family}
              className="flex min-h-0 flex-1 flex-col outline-none"
              data-testid="bazaar-group"
              data-family={group.family}
            >
              <LookTiles
                ref={tiles}
                family={group.family}
                items={group.items}
                shownId={shownId}
                activeId={activeId}
                owned={owned}
                heynstones={heynstones}
                classId={classId}
                sold={sold}
                onShow={(look) => {
                  setSold(null);
                  setShown((current) => ({
                    ...current,
                    [group.family]: look,
                  }));
                }}
              />
            </TabPanel>
          ))}
        </div>
        <BazaarInspector
          family={family}
          item={shownItem}
          action={action}
          heroLook={shelfPreviewLook(
            family,
            { family, look: shownId },
            activeLooks
          )}
          classId={classId}
          sold={sold !== null && sold === shownId}
          onBuy={() => {
            if (shownItem !== null) {
              tryBuy(shownItem);
            }
          }}
          onUse={() => {
            applyLook(shownItem);
          }}
        />
      </Tabs>
      <p className="sr-only" aria-live="polite" data-testid="bazaar-said">
        {said}
      </p>
    </GameScreen>
  );
};
