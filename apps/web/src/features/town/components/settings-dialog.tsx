import { useAtom } from "@effect/atom-react";
import { cn } from "cn";
import { Schema } from "effect";
import {
  Dialog,
  Heading,
  Label,
  Modal,
  ModalOverlay,
  Radio,
  RadioGroup,
  Slider,
  SliderFill,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  ToggleButton,
} from "react-aria-components";
import { HiXMark } from "react-icons/hi2";

import {
  playSound,
  setSoundEnabled,
  setSoundVolume,
  unlockAudio,
} from "@/features/battle/battle-audio";
import { soundOnAtom, soundVolumeAtom } from "@/features/battle/battle.atoms";
import {
  GameButton,
  gameButtonStyles,
} from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { LOCALE_LABELS } from "@/features/i18n/components/language-toggle";
import { Locale } from "@/features/i18n/locale";
import { shortcutImage } from "@/features/town/town";

const isLocale = Schema.is(Locale);

/** The volume that the sound switch gives back when the volume is 0. */
const VOLUME_AFTER_ZERO = 50;

/** The notches under the groove of the volume slider. */
const NOTCHES = [0, 25, 50, 75, 100];

/** One row of the dialog: the label at the left, the control at the right. */
const ROW =
  "grid grid-cols-[5.5rem_1fr] items-center gap-x-4 py-4 [@media(max-height:500px)]:py-2";

const ROW_LABEL =
  "font-display text-base font-bold text-[#2a1d12] [@media(max-height:500px)]:text-sm";

const languageOption = ({ isSelected }: { readonly isSelected: boolean }) =>
  cn(
    "group flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold text-[#2a1d12] transition-[transform,box-shadow] outline-none",
    "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:-translate-y-0.5 motion-reduce:data-[hovered]:translate-y-0",
    isSelected
      ? "border-[#e2a93b] bg-[#fff3d1] shadow-[0_0_0_3px_rgba(226,169,59,0.45)]"
      : "border-[#c9b48c] bg-[#f6ead0]"
  );

/** The language of the game: one option card for each Locale (LOC-03). */
const LanguageRow = () => {
  const { tr, locale, setLocale } = useGameText();
  return (
    <RadioGroup
      value={locale}
      onChange={(value) => {
        if (isLocale(value)) {
          setLocale(value);
        }
      }}
      className={ROW}
      data-testid="settings-language"
    >
      <Label className={ROW_LABEL}>{tr("settings.language")}</Label>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(LOCALE_LABELS).map(([id, name]) => (
          <Radio
            key={id}
            value={id}
            // The current language takes the focus when the dialog opens.
            autoFocus={id === locale}
            className={languageOption}
          >
            {name}
            {/* The radio mark: the selected option shows it full, not only in gold. */}
            <span
              className={cn(
                "grid size-[18px] shrink-0 place-items-center rounded-full border-2 border-[#c9b48c] bg-[#fff6df]",
                "group-data-[selected]:border-[#7a5310] group-data-[selected]:bg-gradient-to-b group-data-[selected]:from-[#ffe08a] group-data-[selected]:to-[#e2a93b]"
              )}
              aria-hidden
            >
              <span className="size-1.5 rounded-full bg-[#2a1a05] opacity-0 group-data-[selected]:opacity-100" />
            </span>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
};

/**
 * A short tone at the new volume when the slider stops. The effects of the
 * play screen run after this event, so the audio gets the new values here
 * first. A volume change turns the sound on.
 */
const previewVolume = (value: number) => {
  setSoundEnabled(true);
  setSoundVolume(value);
  unlockAudio();
  playSound("select", 0);
};

/**
 * The sound volume, 0 to 100 (UI-06), with the same sound switch as the
 * Battle. A change applies at once, and a short tone plays at the new volume
 * when the slider stops. A volume change turns the sound on.
 */
const SoundRow = () => {
  const { tr } = useGameText();
  const [soundOn, setSoundOn] = useAtom(soundOnAtom);
  const [volume, setVolume] = useAtom(soundVolumeAtom);
  const audible = soundOn && volume > 0;

  const onSwitch = (on: boolean) => {
    setSoundOn(on);
    if (on && volume === 0) {
      setVolume(VOLUME_AFTER_ZERO);
    }
  };
  const onChange = (value: number) => {
    setVolume(value);
    if (!soundOn) {
      setSoundOn(true);
    }
  };

  return (
    <Slider
      value={volume}
      onChange={onChange}
      onChangeEnd={previewVolume}
      minValue={0}
      maxValue={100}
      step={1}
      className={ROW}
      data-muted={!audible || undefined}
      data-testid="settings-volume"
    >
      <Label className={ROW_LABEL}>{tr("settings.sound")}</Label>
      <div className="flex items-center gap-4 [@media(max-height:500px)]:gap-3">
        <ToggleButton
          isSelected={audible}
          onChange={onSwitch}
          aria-label={tr("settings.soundOn")}
          className={gameButtonStyles({
            intent: "wood",
            size: "icon",
            className: "shrink-0 [@media(max-height:500px)]:size-9",
          })}
          data-testid="settings-sound-switch"
        >
          <GlyphIcon glyph={audible ? "sound" : "mute"} className="size-5" />
        </ToggleButton>
        <SliderTrack className="group/track relative mx-1.5 h-11 min-w-0 flex-1 cursor-pointer [@media(max-height:500px)]:h-9">
          {/* The groove is cut into the parchment: dark inside, with a light lower lip. */}
          <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-[#5b3a1e] shadow-[inset_0_2px_3px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.7)]">
            <SliderFill
              className={cn(
                "rounded-full bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(122,83,16,0.6)] transition-[filter,opacity] duration-200",
                !audible && "opacity-60 grayscale"
              )}
            />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 [@media(max-height:500px)]:hidden"
            aria-hidden
          >
            {NOTCHES.map((notch) => (
              <span
                key={notch}
                className="absolute top-0 h-1.5 w-px -translate-x-1/2 bg-[#6b5238]/60"
                style={{ left: `${notch}%` }}
              />
            ))}
          </div>
          <SliderThumb
            aria-label={tr("settings.volume")}
            className="group/thumb top-1/2 grid size-11 cursor-grab place-items-center rounded-full outline-none data-[dragging]:cursor-grabbing data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] [@media(max-height:500px)]:size-9"
          >
            {/* A bronze knob, in the card metal, with a hard drop. */}
            <span
              className={cn(
                "size-7 rounded-full border-2 border-[#7a5310] bg-[radial-gradient(circle_at_35%_30%,#fff3c4_0%,#f7dc9c_22%,#c99a4e_62%,#8a5a20_100%)] shadow-[0_3px_0_rgba(0,0,0,0.45)] transition-[transform,box-shadow,filter] duration-100",
                "group-data-[dragging]/thumb:translate-y-px group-data-[dragging]/thumb:shadow-[0_1px_0_rgba(0,0,0,0.45)] group-data-[hovered]/thumb:brightness-110",
                "[@media(max-height:500px)]:size-6"
              )}
            />
          </SliderThumb>
        </SliderTrack>
        <SliderOutput
          className={cn(
            "w-9 shrink-0 text-right text-lg leading-none font-black text-[#2a1d12] tabular-nums transition-opacity",
            !audible && "opacity-60"
          )}
          data-testid="settings-volume-value"
        />
      </div>
    </Slider>
  );
};

/**
 * The Settings dialog (GDD 11.4): a parchment dialog at the center of the
 * screen, over the current screen. A change applies at once, so it has no
 * Save button. Esc, the close button and a click outside close it.
 */
export const SettingsDialog = () => {
  const { tr } = useGameText();
  return (
    <ModalOverlay
      isDismissable
      className="fade-in animate-in fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px] duration-200 motion-reduce:animate-none"
    >
      <Modal className="fade-in zoom-in-95 animate-in w-[min(480px,94vw)] rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] px-5 pt-4 pb-2 text-[#2a1d12] shadow-[0_24px_48px_rgba(0,0,0,0.55)] duration-200 motion-reduce:animate-none [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:pt-2 [@media(max-height:500px)]:pb-1">
        <Dialog className="outline-none" data-testid="settings-dialog">
          {({ close }) => (
            <>
              <header className="flex items-center gap-3 border-b-2 border-[#c9b48c] pb-3 [@media(max-height:500px)]:pb-2">
                <img
                  src={shortcutImage("settings")}
                  alt=""
                  width={128}
                  height={128}
                  draggable={false}
                  className="-my-1 size-11 drop-shadow-[0_2px_0_rgba(0,0,0,0.3)] select-none [@media(max-height:500px)]:size-8"
                />
                <Heading
                  slot="title"
                  className="font-display text-2xl font-black [@media(max-height:500px)]:text-xl"
                >
                  {tr("settings.title")}
                </Heading>
                <GameButton
                  intent="wood"
                  size="icon"
                  aria-label={tr("settings.close")}
                  onPress={close}
                  className="ml-auto [@media(max-height:500px)]:size-9"
                  data-testid="settings-close"
                >
                  <HiXMark className="size-5" aria-hidden />
                </GameButton>
              </header>
              <div className="divide-y divide-[#c9b48c]/70">
                <LanguageRow />
                <SoundRow />
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};
