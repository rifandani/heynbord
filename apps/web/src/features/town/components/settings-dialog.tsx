import { useAtom } from "@effect/atom-react";
import { cn } from "cn";
import { Schema } from "effect";
import type { ReactNode, RefObject } from "react";
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
  Switch,
  ToggleButton,
} from "react-aria-components";

import {
  GameButton,
  gameButtonStyles,
} from "@/core/components/game/game-button";
import { GAME_SCRIM } from "@/core/components/game/game-scrim";
import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { battleSpeedAtom } from "@/features/battle/battle.atoms";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { LOCALE_LABELS } from "@/features/i18n/components/language-toggle";
import { Locale } from "@/features/i18n/locale";
import { ProfileRow } from "@/features/profile/components/profile-row";
import {
  effectsVolumeAtom,
  musicOnAtom,
  musicVolumeAtom,
  reducedMotionAtom,
  soundOnAtom,
  soundVolumeAtom,
} from "@/features/settings/settings.atoms";
import {
  placeSheetOrigin,
  SHEET_INK_MOTION,
  SHEET_MOTION,
  SHEET_PATH_MOTION,
  SHEET_SCRIM_MOTION,
} from "@/features/town/sheet-motion";
import {
  TOWN_DIALOG_DROP,
  TOWN_DIALOG_ICON_DROP,
  TOWN_GROOVE_WELL,
  TOWN_KNOB,
  TOWN_SLIDER_FILL,
  TOWN_SWITCH_WELL,
} from "@/features/town/tokens";
import { shortcutImage } from "@/features/town/town";

const isLocale = Schema.is(Locale);

/** The volume that the sound switch gives back when the volume is 0. */
const VOLUME_AFTER_ZERO = 50;

/** The notches under the groove of the volume slider. */
const NOTCHES = [0, 25, 50, 75, 100];

/** The Battle speeds of the Settings dialog. */
const SPEEDS = [1, 2] as const;

/** One row of the dialog: the label at the left, the control at the right. */
const ROW =
  "grid grid-cols-[5.5rem_1fr] items-center gap-x-4 py-4 [@media(max-height:500px)]:py-2";

const ROW_LABEL =
  "font-display text-base font-bold text-ink [@media(max-height:500px)]:text-sm";

const languageOption = ({ isSelected }: { readonly isSelected: boolean }) =>
  cn(
    "group text-ink flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-[transform,box-shadow] outline-none",
    "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4 data-[hovered]:-translate-y-0.5 motion-reduce:data-[hovered]:translate-y-0",
    isSelected
      ? "border-gold-deep bg-parchment-lit shadow-selected"
      : "border-ink-faded bg-parchment"
  );

/**
 * The close mark of the dialog: a plain X in the current color. It stays a
 * local SVG, so the Settings dialog does not load an icon library.
 */
const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/** The radio mark: the selected option shows it full, not only in gold. */
const ChoiceMark = () => (
  <span
    className={cn(
      "border-ink-faded bg-cream grid size-[18px] shrink-0 place-items-center rounded-full border-2",
      "group-data-[selected]:border-gold-deep group-data-[selected]:from-gold-light group-data-[selected]:to-gold group-data-[selected]:bg-gradient-to-b"
    )}
    aria-hidden
  >
    <span className="bg-ink-on-gold size-1.5 rounded-full opacity-0 group-data-[selected]:opacity-100" />
  </span>
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
            <ChoiceMark />
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
};

/**
 * A short tone at the new volume when the slider stops. The Settings binding
 * applies the Mix on the atom write, so the tone reads the new values.
 */
const previewVolume = () => {
  unlockAudio();
  playSound("select", 0);
};

/** A volume row: a Label, a groove, a knob and the value. */
const VolumeRow = ({
  label,
  value,
  onChange,
  onChangeEnd,
  testId,
  valueTestId,
  leading,
  muted,
  thumbLabel,
}: {
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly onChangeEnd?: (value: number) => void;
  readonly testId: string;
  readonly valueTestId: string;
  readonly leading?: ReactNode;
  readonly muted: boolean;
  readonly thumbLabel: string;
}) => (
  <Slider
    value={value}
    onChange={onChange}
    onChangeEnd={onChangeEnd}
    minValue={0}
    maxValue={100}
    step={1}
    className={ROW}
    data-muted={muted || undefined}
    data-testid={testId}
  >
    <Label className={ROW_LABEL}>{label}</Label>
    <div className="flex items-center gap-4 [@media(max-height:500px)]:gap-3">
      {leading}
      <SliderTrack className="group/track relative mx-1.5 h-11 min-w-0 flex-1 cursor-pointer [@media(max-height:500px)]:h-9">
        {/* The groove is cut into the parchment: dark inside, with a light lower lip. */}
        <div
          className="bg-frame-wood absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full"
          style={{ boxShadow: TOWN_GROOVE_WELL }}
        >
          <SliderFill
            className={cn(
              "from-gold-light to-gold rounded-full bg-gradient-to-b transition-[filter,opacity] duration-200",
              muted && "grayscale"
            )}
            style={{ boxShadow: TOWN_SLIDER_FILL }}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 [@media(max-height:500px)]:hidden"
          aria-hidden
        >
          {NOTCHES.map((notch) => (
            <span
              key={notch}
              className="bg-ink-faded/60 absolute top-0 h-1.5 w-px -translate-x-1/2"
              style={{ left: `${notch}%` }}
            />
          ))}
        </div>
        <SliderThumb
          aria-label={thumbLabel}
          className="group/thumb data-[focus-visible]:ring-focus-cream top-1/2 grid size-11 cursor-grab place-items-center rounded-full outline-none data-[dragging]:cursor-grabbing data-[focus-visible]:ring-4 [@media(max-height:500px)]:size-9"
        >
          {/* A bronze knob, in the card metal, with a hard drop. */}
          <span
            className={cn(
              "border-gold-deep shadow-piece size-7 rounded-full border-2 transition-[transform,box-shadow,filter] duration-100",
              "group-data-[dragging]/thumb:shadow-piece-press group-data-[dragging]/thumb:translate-y-px group-data-[hovered]/thumb:brightness-110",
              "[@media(max-height:500px)]:size-6"
            )}
            style={{ background: TOWN_KNOB }}
          />
        </SliderThumb>
      </SliderTrack>
      <SliderOutput
        className="text-ink w-9 shrink-0 text-right text-lg leading-none font-black tabular-nums"
        data-testid={valueTestId}
      />
    </div>
  </Slider>
);

/**
 * The sound volume, 0 to 100, with the same sound switch as the
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
    <VolumeRow
      label={tr("settings.sound")}
      value={volume}
      onChange={onChange}
      onChangeEnd={previewVolume}
      testId="settings-volume"
      valueTestId="settings-volume-value"
      thumbLabel={tr("settings.volume")}
      muted={!audible}
      leading={
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
      }
    />
  );
};

/** The effects volume: the sounds of the Battle, under the master Sound. */
const EffectsRow = () => {
  const { tr } = useGameText();
  const [soundOn] = useAtom(soundOnAtom);
  const [soundVolume] = useAtom(soundVolumeAtom);
  const [volume, setVolume] = useAtom(effectsVolumeAtom);
  const muted = !soundOn || soundVolume === 0 || volume === 0;

  const onPreview = () => {
    if (!muted) {
      unlockAudio();
      playSound("select", 0);
    }
  };

  return (
    <VolumeRow
      label={tr("settings.effectsVolume")}
      value={volume}
      onChange={setVolume}
      onChangeEnd={onPreview}
      testId="settings-effects-volume"
      valueTestId="settings-effects-volume-value"
      thumbLabel={tr("settings.effectsVolume")}
      muted={muted}
    />
  );
};

/** The music switch and volume are independent from sound effects. */
const MusicRow = () => {
  const { tr } = useGameText();
  const [soundOn] = useAtom(soundOnAtom);
  const [soundVolume] = useAtom(soundVolumeAtom);
  const [musicOn, setMusicOn] = useAtom(musicOnAtom);
  const [volume, setVolume] = useAtom(musicVolumeAtom);
  const audible = soundOn && soundVolume > 0 && musicOn && volume > 0;
  const onSwitch = (on: boolean) => {
    setMusicOn(on);
    if (on) {
      unlockAudio();
    }
  };
  return (
    <VolumeRow
      label={tr("settings.musicVolume")}
      value={volume}
      onChange={(value) => {
        setVolume(value);
      }}
      onChangeEnd={() => {
        if (musicOn) {
          unlockAudio();
        }
      }}
      testId="settings-music-volume"
      valueTestId="settings-music-volume-value"
      thumbLabel={tr("settings.musicVolume")}
      muted={!audible}
      leading={
        <ToggleButton
          isSelected={musicOn}
          onChange={onSwitch}
          aria-label={tr("settings.musicOn")}
          className={gameButtonStyles({
            intent: "wood",
            size: "icon",
            className: "shrink-0 [@media(max-height:500px)]:size-9",
          })}
          data-testid="settings-music-switch"
        >
          <GlyphIcon glyph={musicOn ? "sound" : "mute"} className="size-5" />
        </ToggleButton>
      }
    />
  );
};

/** Battle speed ×1 or ×2. A change applies to the Battle on the screen. */
const SpeedRow = () => {
  const { tr } = useGameText();
  const [speed, setSpeed] = useAtom(battleSpeedAtom);
  return (
    <RadioGroup
      value={String(speed)}
      onChange={(value) => setSpeed(value === "2" ? 2 : 1)}
      className={ROW}
      data-testid="settings-battle-speed"
    >
      <Label className={ROW_LABEL}>{tr("settings.battleSpeed")}</Label>
      <div className="grid grid-cols-2 gap-2">
        {SPEEDS.map((value) => (
          <Radio key={value} value={String(value)} className={languageOption}>
            {tr("battle.speedValue", { value })}
            <ChoiceMark />
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
};

/** One switch row, for a choice that is on or off. */
const SwitchRow = ({
  label,
  isSelected,
  onChange,
  testId,
}: {
  readonly label: string;
  readonly isSelected: boolean;
  readonly onChange: (isSelected: boolean) => void;
  readonly testId: string;
}) => (
  <Switch
    isSelected={isSelected}
    onChange={onChange}
    className={cn(ROW, "group")}
    data-testid={testId}
  >
    <Label elementType="span" className={ROW_LABEL}>
      {label}
    </Label>
    <div className="flex justify-end">
      <span
        className={cn(
          "border-gold-deep bg-frame-wood relative block h-9 w-16 rounded-full border-2 transition-colors",
          "group-data-[selected]:from-gold-light group-data-[selected]:to-gold group-data-[selected]:bg-gradient-to-b",
          "group-data-[focus-visible]:ring-focus-cream group-data-[focus-visible]:ring-4"
        )}
        style={{ boxShadow: TOWN_SWITCH_WELL }}
      >
        <span
          className="border-gold-deep shadow-piece absolute top-1/2 left-1 size-7 -translate-y-1/2 rounded-full border-2 transition-[left] group-data-[selected]:left-7"
          style={{ background: TOWN_KNOB }}
        />
      </span>
    </div>
  </Switch>
);

/** Reduced motion: the Player choice, together with the system one. */
const ReducedMotionRow = () => {
  const { tr } = useGameText();
  const [reduced, setReduced] = useAtom(reducedMotionAtom);
  return (
    <SwitchRow
      label={tr("settings.reducedMotion")}
      isSelected={reduced}
      onChange={setReduced}
      testId="settings-reduced-motion"
    />
  );
};

/**
 * The Settings dialog (GDD 11.4): a parchment dialog at the center of the
 * screen, over the current screen. A change applies at once, so it has no
 * Save button. The last row exports and imports the progress; without
 * `progress` (the Battle), it does not show. Esc, the close button and a click
 * outside close it. With `from`, the sheet comes up out of that button and
 * goes back into it.
 */
export const SettingsDialog = ({
  from,
  progress = true,
}: {
  readonly from?: RefObject<HTMLElement | null>;
  readonly progress?: boolean;
}) => {
  const { tr } = useGameText();
  return (
    <ModalOverlay
      isDismissable
      // The ref runs before the first paint, so the sheet starts on the button.
      ref={(overlay) => placeSheetOrigin(overlay, from?.current ?? null)}
      className={cn(GAME_SCRIM, "z-50", SHEET_SCRIM_MOTION)}
    >
      <Modal
        className={cn(
          "group/sheet max-h-[calc(100dvh-2rem)] w-[min(480px,94vw)]",
          SHEET_PATH_MOTION
        )}
      >
        <Dialog
          className={cn(
            "border-frame-wood bg-parchment text-ink flex max-h-[calc(100dvh-2rem)] flex-col rounded-2xl border-4 px-5 pt-4 pb-2 outline-none [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:pt-2 [@media(max-height:500px)]:pb-1",
            TOWN_DIALOG_DROP,
            SHEET_MOTION
          )}
          data-testid="settings-dialog"
        >
          {({ close }) => (
            <div className={cn(SHEET_INK_MOTION, "flex min-h-0 flex-col")}>
              <header className="border-parchment-rule flex shrink-0 items-center gap-3 border-b-2 pb-3 [@media(max-height:500px)]:pb-2">
                <img
                  src={shortcutImage("settings")}
                  alt=""
                  width={128}
                  height={128}
                  draggable={false}
                  className="-my-1 size-11 select-none [@media(max-height:500px)]:size-8"
                  style={{ filter: TOWN_DIALOG_ICON_DROP }}
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
                  <CloseIcon />
                </GameButton>
              </header>
              <div className="divide-parchment-rule/70 min-h-0 flex-1 divide-y overflow-y-auto overscroll-contain">
                <LanguageRow />
                <SpeedRow />
                <SoundRow />
                <EffectsRow />
                <MusicRow />
                <ReducedMotionRow />
                {progress ? (
                  <ProfileRow
                    className={ROW}
                    labelClassName={ROW_LABEL}
                    onReplaced={close}
                  />
                ) : null}
              </div>
            </div>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};
