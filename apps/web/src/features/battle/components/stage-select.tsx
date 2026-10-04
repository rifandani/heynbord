import { STAGES, STARTER_DECKS } from "@workspace/rules";
import { cn } from "cn";
import { useEffect, useState } from "react";
import { Radio, RadioGroup, Label } from "react-aria-components";

import type { BattleOptions } from "@/features/battle/battle-session";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { qaSeed } from "@/features/battle/qa";
import { randomSeed } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";

const optionStyles = (selected: boolean) =>
  cn(
    "relative flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-3 text-left transition-[transform,box-shadow] outline-none",
    "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:-translate-y-0.5",
    selected
      ? "border-[#e2a93b] bg-[#fff3d1] shadow-[0_0_0_3px_rgba(226,169,59,0.45)]"
      : "border-[#c9b48c] bg-[#f6ead0]"
  );

const FIRST_STAGE_ID = STAGES[0]?.id ?? "1-1";
const FIRST_DECK_ID = STARTER_DECKS[0]?.id ?? "vanguard";

const preloadBattleCanvas = () =>
  import("@/features/battle/scene/battle-canvas");

/**
 * The Stage select of the slice: Region 1 Stages and the Starter Decks. It is
 * the Campaign screen until the Campaign map exists. The Battle scene chunk
 * preloads here, so a Battle starts fast (NFR-03).
 */
export const StageSelect = ({
  onStart,
}: {
  readonly onStart: (options: BattleOptions) => void;
}) => {
  const { tr } = useGameText();
  const [stageId, setStageId] = useState<string>(FIRST_STAGE_ID);
  const [deckId, setDeckId] = useState<string>(FIRST_DECK_ID);

  useEffect(() => {
    void preloadBattleCanvas();
  }, []);

  return (
    <div
      className="fade-in animate-in min-h-svh bg-[radial-gradient(ellipse_at_top,#3b6fb5_0%,#1f3a63_45%,#1c140e_100%)] px-4 pt-6 pb-24 text-[#2a1d12] duration-300 motion-reduce:animate-none [@media(max-height:500px)]:pt-3 [@media(max-height:500px)]:pb-16"
      data-testid="campaign"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 [@media(max-height:500px)]:gap-2">
        <header className="flex items-center justify-between text-[#fff6df]">
          <h1 className="font-display text-3xl font-black tracking-wide drop-shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:text-xl">
            Heynbord · {tr("battle.title")}
          </h1>
        </header>

        <div className="grid gap-4 md:grid-cols-[3fr_2fr] [@media(max-height:500px)]:grid-cols-[3fr_2fr] [@media(max-height:500px)]:gap-2">
          <RadioGroup
            value={stageId}
            onChange={setStageId}
            className="flex flex-col gap-2 rounded-2xl border-4 border-[#5b3a1e] bg-[#ead9b4] p-3 [@media(max-height:500px)]:p-2"
          >
            <Label className="font-display text-lg font-bold [@media(max-height:500px)]:text-sm">
              {tr("battle.chooseStage")}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {STAGES.map((stage) => (
                <Radio
                  key={stage.id}
                  value={stage.id}
                  className={({ isSelected }) => optionStyles(isSelected)}
                  data-testid={`stage-${stage.id}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-[#5b3a1e]">
                      {tr("battle.stageLabel", { id: stage.id })}
                    </span>
                    {stage.boss ? (
                      <span className="rounded bg-[#8e1f1f] px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                        {tr("battle.boss")}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-display leading-tight font-bold [@media(max-height:500px)]:text-sm">
                    {tr(`stages.${stage.id}.name`)}
                  </span>
                  <span className="text-xs text-[#5b4632]">
                    {tr(`stages.${stage.id}.enemy`)} ·{" "}
                    {tr("battle.heroHp", { hp: stage.enemy.heroHp })}
                  </span>
                </Radio>
              ))}
            </div>
          </RadioGroup>

          <div className="flex flex-col gap-2 rounded-2xl border-4 border-[#5b3a1e] bg-[#ead9b4] p-3 [@media(max-height:500px)]:p-2">
            <RadioGroup
              value={deckId}
              onChange={setDeckId}
              className="flex flex-col gap-2"
            >
              <Label className="font-display text-lg font-bold [@media(max-height:500px)]:text-sm">
                {tr("battle.chooseDeck")}
              </Label>
              {STARTER_DECKS.map((deck) => (
                <Radio
                  key={deck.id}
                  value={deck.id}
                  className={({ isSelected }) => optionStyles(isSelected)}
                  data-testid={`deck-${deck.id}`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="flex size-8 items-center justify-center rounded-lg bg-[#5b3a1e] text-[#fff6df]"
                      aria-hidden
                    >
                      <GlyphIcon
                        glyph={classGlyph(deck.classId)}
                        className="size-5"
                      />
                    </span>
                    <span>
                      <span className="font-display block leading-tight font-bold [@media(max-height:500px)]:text-sm">
                        {tr(`decks.${deck.id}.name`)}
                      </span>
                      <span className="block text-xs text-[#5b4632]">
                        {tr(`decks.${deck.id}.description`)}
                      </span>
                    </span>
                  </span>
                </Radio>
              ))}
            </RadioGroup>
            <GameButton
              intent="gold"
              size="lg"
              className="font-display mt-auto"
              data-testid="start-battle"
              onPress={() =>
                onStart({ stageId, deckId, seed: qaSeed() ?? randomSeed() })
              }
            >
              {tr("battle.start")}
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  );
};
