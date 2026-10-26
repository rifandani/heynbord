import { twJoin } from "cn";
import type { ComponentProps, CSSProperties } from "react";
import type { Toaster } from "sonner";

import type { ColorMode } from "@/features/color-mode/color-mode";

type ToasterProps = ComponentProps<typeof Toaster>;

const toasterDefaults = {
  className: "toaster group",
  duration: 3000,
  position: "bottom-right",
  richColors: true,
  // SAFETY: sonner forwards `style` to the DOM, so the custom properties below
  // are valid CSS - React's `CSSProperties` just does not model them.
  style: {
    "--error-bg":
      "color-mix(in oklab, var(--color-danger-subtle-fg) 8%, var(--color-overlay) 92%)",
    "--error-border":
      "color-mix(in oklab, var(--danger-subtle-fg) 20%, transparent)",
    "--error-text": "var(--color-danger-subtle-fg)",
    "--info-bg":
      "color-mix(in oklab, var(--color-info-subtle-fg) 8%, var(--color-overlay) 92%)",
    "--info-border":
      "color-mix(in oklab, var(--info-subtle-fg) 20%, transparent)",
    "--info-text": "var(--color-info-subtle-fg)",
    "--normal-bg": "var(--color-overlay)",
    "--normal-border": "var(--color-border)",
    "--normal-text": "var(--color-overlay-fg)",
    "--success-bg":
      "color-mix(in oklab, var(--color-success-subtle-fg) 8%, var(--color-overlay) 92%)",
    "--success-border":
      "color-mix(in oklab, var(--success-subtle-fg) 20%, transparent)",
    "--success-text": "var(--color-success-subtle-fg)",
    "--warning-bg":
      "color-mix(in oklab, var(--color-warning-subtle-fg) 8%, var(--color-overlay) 92%)",
    "--warning-border":
      "color-mix(in oklab, var(--warning-subtle-fg) 20%, transparent)",
    "--warning-text": "var(--color-warning-subtle-fg)",
  } as CSSProperties,
  toastOptions: {
    className: twJoin(
      "will-change-transform not-has-data-[slot=note]:backdrop-blur-3xl *:data-icon:mt-0.5 *:data-icon:self-start has-data-description:*:data-icon:mt-1 *:data-[slot=note]:relative *:data-[slot=note]:z-50",
      "**:data-action:[--normal-bg:var(--color-primary-fg)] **:data-action:[--normal-text:var(--color-primary)]"
    ),
  },
} satisfies ToasterProps;

/** Props of the app's one `Toaster`. In `auto` mode, the system picks the toast theme. */
export const toasterProps = (colorMode: ColorMode): ToasterProps => ({
  ...toasterDefaults,
  theme: colorMode === "auto" ? "system" : colorMode,
});
