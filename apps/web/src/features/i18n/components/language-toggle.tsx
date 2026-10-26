import { Schema } from "effect";
import type { ReactNode } from "react";

import { Button } from "@/core/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuHeader,
  MenuItem,
  MenuSection,
} from "@/core/components/ui/menu";
import { Locale } from "@/features/i18n/locale";
import { useTranslation } from "@/features/i18n/use-translation";

/** The name of each Locale, in its own language. */
export const LOCALE_LABELS = {
  "en-us": "English",
  "id-id": "Indonesia",
} as const satisfies Record<Locale, string>;

const isLocale = Schema.is(Locale);

/** The globe of the language button, drawn here so no icon library loads. */
const GlobeMark = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-6"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
  </svg>
);

/**
 * The language menu. `trigger` draws the button that opens it, with the name
 * of the current Locale; a game screen uses it to draw a game button.
 */
export const LanguageToggle = ({
  trigger,
}: {
  readonly trigger?: (label: string) => ReactNode;
}) => {
  const { t, setLocale, locale } = useTranslation();
  const label = LOCALE_LABELS[locale];
  return (
    <Menu>
      {trigger ? (
        trigger(label)
      ) : (
        <Button intent="plain">
          <GlobeMark />
          {label}
        </Button>
      )}

      <MenuContent
        selectionMode="single"
        selectedKeys={new Set([locale])}
        onSelectionChange={(selection) => {
          // `selectionMode="single"`: the set holds the picked key, or nothing.
          const [key] = selection === "all" ? [] : selection;
          if (isLocale(key)) {
            // Switches the UI at once; persisting for the next server render
            // happens in the background.
            setLocale(key);
          }
        }}
      >
        <MenuSection>
          <MenuHeader separator>{t("language")}</MenuHeader>

          {Object.entries(LOCALE_LABELS).map(([id, name]) => (
            <MenuItem key={id} id={id}>
              {name}
            </MenuItem>
          ))}
        </MenuSection>
      </MenuContent>
    </Menu>
  );
};
