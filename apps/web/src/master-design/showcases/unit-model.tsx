import type { Key } from "react";
import { lazy, Suspense, useState, useSyncExternalStore } from "react";

import { Switch, SwitchField } from "@/core/components/ui/switch";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/core/components/ui/toggle-group";
import { BattlePainting } from "@/features/battle/components/battle-painting";
import { REVIEW_CANVAS } from "@/features/battle/scene/review-camera";
import type { UnitClipName } from "@/features/battle/scene/unit-clips";
import { UNIT_CLIP_NAMES } from "@/features/battle/scene/unit-clips";
import {
  unitModelCardNamed,
  unitModelCards,
} from "@/features/battle/scene/unit-models";

import { Variant } from "../variant";

// The stage has Three.js: it loads in its own chunk, and only in the browser.
const UnitModelStage = lazy(() => import("./unit-model-stage"));

const UnitModelReviewStage = lazy(async () => {
  const stage = await import("./unit-model-stage");
  return { default: stage.UnitModelReviewStage };
});

const noSubscribe = () => () => {
  // The browser flag never changes.
};

/** True in the browser, false in the server render: WebGL needs the browser. */
const useInBrowser = () =>
  useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false
  );

const isClipName = (key: Key | undefined): key is UnitClipName =>
  UNIT_CLIP_NAMES.some((clip) => clip === key);

const MODEL_CARDS = unitModelCards();

const isModelCard = (key: Key | undefined): key is string =>
  MODEL_CARDS.some((id) => id === key);

/** The largest z-index: the dev tools and the toasts must not show in a capture. */
const ABOVE_DEV_TOOLS = 2_147_483_647;

/**
 * The Review Scene of one Unit Model (`/master-design?review=<name>`). `name`
 * is the file name of the GLB. It covers the page, so a screenshot shows only
 * the scene. The capture API is on `window` when the model is ready.
 */
export const UnitModelReview = ({ name }: { readonly name: string }) => {
  const cardId = unitModelCardNamed(name);
  const mounted = useInBrowser();
  return (
    <div
      data-unit-model-review
      className="fixed top-0 left-0 isolate overflow-hidden"
      style={{
        width: REVIEW_CANVAS.width,
        height: REVIEW_CANVAS.height,
        zIndex: ABOVE_DEV_TOOLS,
      }}
    >
      <BattlePainting src={null} />
      {cardId === undefined ? <p>No Unit Model has the name {name}.</p> : null}
      {mounted && cardId !== undefined ? (
        <Suspense fallback={null}>
          <UnitModelReviewStage cardId={cardId} />
        </Suspense>
      ) : null}
    </div>
  );
};

/**
 * The Unit Model of a card or a Token (art direction 2.2), on the Battle
 * light. Pick a card or a Token and a clip to play it on a loop: the rare
 * clips (death, rebirth, Low HP) are hard to see in a Battle.
 */
export const UnitModelShowcase = () => {
  const [cardId, setCardId] = useState(MODEL_CARDS[0] ?? "");
  const [clip, setClip] = useState<UnitClipName>("idle");
  const [enemy, setEnemy] = useState(false);
  const [fast, setFast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [battleCamera, setBattleCamera] = useState(false);
  const mounted = useInBrowser();

  return (
    <div className="flex w-full flex-col gap-4">
      <Variant label="card">
        <ToggleGroup
          selectedKeys={[cardId]}
          disallowEmptySelection
          onSelectionChange={(keys) => {
            const [key] = [...keys];
            if (isModelCard(key)) {
              setCardId(key);
            }
          }}
        >
          {MODEL_CARDS.map((id) => (
            <ToggleGroupItem key={id} id={id}>
              {id}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Variant>
      <Variant label="clip">
        <ToggleGroup
          selectedKeys={[clip]}
          disallowEmptySelection
          onSelectionChange={(keys) => {
            const [key] = [...keys];
            if (isClipName(key)) {
              setClip(key);
            }
          }}
        >
          {UNIT_CLIP_NAMES.map((name) => (
            <ToggleGroupItem key={name} id={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Variant>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <SwitchField isSelected={enemy} onChange={setEnemy}>
          <Switch>Enemy side</Switch>
        </SwitchField>
        <SwitchField isSelected={fast} onChange={setFast}>
          <Switch>Speed ×2</Switch>
        </SwitchField>
        <SwitchField isSelected={reducedMotion} onChange={setReducedMotion}>
          <Switch>Reduced motion</Switch>
        </SwitchField>
        <SwitchField isSelected={battleCamera} onChange={setBattleCamera}>
          <Switch>Battle camera distance</Switch>
        </SwitchField>
      </div>
      <Variant label="Unit Model" className="w-full">
        <div className="from-elf-green via-battle-meadow to-crypt relative aspect-video w-full max-w-3xl overflow-hidden rounded-lg bg-radial-[at_50%_48%] from-0% via-42% to-100%">
          {mounted ? (
            <Suspense fallback={null}>
              <UnitModelStage
                options={{
                  cardId,
                  clip,
                  enemy,
                  speed: fast ? 2 : 1,
                  reducedMotion,
                  battleCamera,
                }}
              />
            </Suspense>
          ) : null}
        </div>
      </Variant>
    </div>
  );
};
