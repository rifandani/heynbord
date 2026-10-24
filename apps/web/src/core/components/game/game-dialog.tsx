import { cn } from "cn";
import type { ReactNode } from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { HiXMark } from "react-icons/hi2";

import { GameCloseButton } from "./game-button";
import { gameText, parchmentStyles } from "./surfaces";

/**
 * The color and the blur of every Heynbord scrim: a 55% black wash with a 2px
 * blur (DESIGN.md, Parchment dialog). The placement is separate, so the
 * catalog can show the scrim of a scene without opening a dialog.
 */
export const GAME_SCRIM_TINT = "bg-black/55 backdrop-blur-[2px]";

/**
 * The scrim of every Heynbord overlay: the one place that says how the game
 * darkens what is behind a dialog. The Deck book, the Handbook, the Settings
 * dialog and the Stage Panel use it too, so only one scrim exists in the game.
 * A consumer that needs another layer or no scrim changes the class with `cn`.
 */
export const GAME_SCRIM = cn(
  "fixed inset-0 z-[60] flex items-center justify-center p-4 [@media(max-height:500px)]:p-2",
  GAME_SCRIM_TINT
);

export type GameDialogSize = "sm" | "lg";

const SIZE: Readonly<Record<GameDialogSize, string>> = {
  sm: "w-[min(420px,94vw)]",
  lg: "w-[min(560px,94vw)]",
};

export interface GameDialogProps {
  /** Omit it inside a `DialogTrigger`; the trigger then owns the open state. */
  readonly isOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** The Cinzel title at the top of the parchment. */
  readonly title?: ReactNode;
  readonly children: ReactNode;
  /** The actions at the bottom, usually one wood button and one gold. */
  readonly footer?: ReactNode;
  readonly size?: GameDialogSize;
  readonly testId?: string;
  /**
   * The label of the square wood close button at the top right. A confirm
   * that the Player must answer has no close button, so omit it.
   */
  readonly closeLabel?: string;
  /** The test id of that close button. */
  readonly closeTestId?: string;
  /** The role of the dialog: `alertdialog` for a confirmation. */
  readonly role?: "dialog" | "alertdialog";
  /** The class of the `Modal`: use it for a wider dialog, not for the frame. */
  readonly className?: string;
  /** A dialog that must not close on a click outside (a forced choice). */
  readonly isDismissable?: boolean;
}

/** The close button of the parchment: a square wood button at the top right. */
const Close = ({
  close,
  label,
  testId,
}: {
  readonly close: () => void;
  readonly label: string;
  readonly testId?: string;
}) => (
  <GameCloseButton
    label={label}
    onPress={close}
    className="ml-auto [@media(max-height:500px)]:size-8"
    data-testid={testId}
  >
    <HiXMark className="size-5" aria-hidden />
  </GameCloseButton>
);

/** The title and the close button of the parchment, with the rule under them. */
const Header = ({
  close,
  title,
  closeLabel,
  closeTestId,
}: {
  readonly close: () => void;
  readonly title?: ReactNode;
  readonly closeLabel?: string;
  readonly closeTestId?: string;
}) => {
  if (closeLabel === undefined) {
    return title === undefined ? null : (
      <Heading
        slot="title"
        className={gameText({
          role: "title",
          tone: "ink",
          className:
            "font-display text-2xl font-black [@media(max-height:500px)]:text-xl",
        })}
      >
        {title}
      </Heading>
    );
  }
  return (
    <header className="border-parchment-rule flex items-center gap-3 border-b-2 pb-3 text-left [@media(max-height:500px)]:pb-2">
      {title === undefined ? null : (
        <Heading
          slot="title"
          className={gameText({
            role: "title",
            tone: "ink",
            className:
              "font-display flex-1 text-2xl font-black [@media(max-height:500px)]:text-xl",
          })}
        >
          {title}
        </Heading>
      )}
      <Close close={close} label={closeLabel} testId={closeTestId} />
    </header>
  );
};

/**
 * A parchment dialog (DESIGN.md, Parchment dialog): parchment, a 4px
 * frame-wood border, a 16px corner, 20px padding, centered text, on the scrim.
 * The long content scrolls; the dialog never grows past the screen.
 *
 * It is the shared shell for the confirmations and the rules of the game. The
 * Deck book and the Handbook are signature shells and keep their own frame,
 * but they use `GAME_SCRIM` and the same parchment tokens.
 */
export const GameDialog = ({
  isOpen,
  onOpenChange,
  title,
  children,
  footer,
  size = "sm",
  testId,
  closeLabel,
  closeTestId,
  role,
  className,
  isDismissable = true,
}: GameDialogProps) => (
  <ModalOverlay
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    isDismissable={isDismissable}
    className={GAME_SCRIM}
  >
    <Modal
      className={cn(
        parchmentStyles({ kind: "dialog", padding: "md" }),
        "fade-in zoom-in-95 animate-in text-center duration-200 motion-reduce:animate-none [@media(max-height:500px)]:p-3",
        SIZE[size],
        className
      )}
    >
      {/* A pressed button goes down 1px. The bottom padding keeps it in the
          scroll box, so no scrollbar comes and moves the buttons. */}
      <Dialog
        role={role}
        className="-mb-1 max-h-[calc(100dvh-3rem)] overflow-y-auto pb-1 outline-none"
        data-testid={testId}
      >
        {({ close }) => (
          <>
            <Header
              close={close}
              title={title}
              closeLabel={closeLabel}
              closeTestId={closeTestId}
            />
            {children}
            {footer ? (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 [@media(max-height:500px)]:mt-3">
                {footer}
              </div>
            ) : null}
          </>
        )}
      </Dialog>
    </Modal>
  </ModalOverlay>
);

/**
 * The bottom sheet variant of the parchment (DESIGN.md, Parchment dialog):
 * the same scrim, frame, title, close button and footer, but the sheet stands
 * on the bottom edge of the screen, full width, with the top corners only. Use
 * it on a phone in landscape, where a centered dialog would cover the board
 * and the thumbs cannot reach its middle.
 */
export const GameSheet = ({
  isOpen,
  onOpenChange,
  title,
  children,
  footer,
  testId,
  closeLabel,
  closeTestId,
  role,
  className,
  isDismissable = true,
}: Omit<GameDialogProps, "size">) => (
  <ModalOverlay
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    isDismissable={isDismissable}
    className={cn(GAME_SCRIM, "items-end p-0 [@media(max-height:500px)]:p-0")}
  >
    <Modal
      className={cn(
        "border-frame-wood bg-parchment text-ink rounded-t-2xl border-x-4 border-t-4 border-b-0 px-5 pt-5",
        "fade-in slide-in-from-bottom-8 animate-in w-full max-w-[560px] pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center shadow-[0_-24px_48px_rgba(0,0,0,0.55)] duration-200 motion-reduce:animate-none",
        "[@media(max-height:500px)]:px-4 [@media(max-height:500px)]:pt-3",
        className
      )}
    >
      <Dialog
        role={role}
        className="-mb-1 max-h-[calc(100dvh-1.5rem)] overflow-y-auto pb-1 outline-none"
        data-testid={testId}
      >
        {({ close }) => (
          <>
            <Header
              close={close}
              title={title}
              closeLabel={closeLabel}
              closeTestId={closeTestId}
            />
            {children}
            {footer ? (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 [@media(max-height:500px)]:mt-3">
                {footer}
              </div>
            ) : null}
          </>
        )}
      </Dialog>
    </Modal>
  </ModalOverlay>
);

/** The body text of a dialog: Inter 14px in ink-soft. */
export const GameDialogText = ({
  className,
  children,
}: {
  readonly className?: string;
  readonly children: ReactNode;
}) => (
  <p
    className={gameText({
      role: "body",
      tone: "soft",
      className: cn("[@media(max-height:500px)]:text-xs", className),
    })}
  >
    {children}
  </p>
);
