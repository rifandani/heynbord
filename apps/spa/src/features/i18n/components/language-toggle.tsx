import { Match } from "effect";
import { HiGlobeAlt } from "react-icons/hi2";
import type { Selection } from "react-stately";

import { Button } from "@/core/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuHeader,
  MenuItem,
  MenuSection,
} from "@/core/components/ui/menu";
import type { Locale } from "@/features/i18n/locale";
import { useTranslation } from "@/features/i18n/use-translation";

const localeLabel = Match.type<Locale>().pipe(
  Match.when("en-us", () => "English"),
  Match.when("id-id", () => "Indonesia"),
  Match.exhaustive
);

export const LanguageToggle = () => {
  const { t, setLocale, locale } = useTranslation();
  return (
    <Menu>
      <Button intent="plain">
        <HiGlobeAlt className="size-6" />
        {localeLabel(locale)}
      </Button>

      <MenuContent
        selectionMode="single"
        selectedKeys={new Set([locale])}
        onSelectionChange={(_selection) => {
          // SAFETY: `selectionMode="single"` rules out the "all" sentinel, and every
          // menu item below is keyed by one of the values named here.
          const selection = _selection as Exclude<Selection, "all"> & {
            currentKey: Locale;
          };
          // Switches the UI at once; persisting for the next server render
          // happens in the background.
          setLocale(selection.currentKey);
        }}
      >
        <MenuSection>
          <MenuHeader separator>{t("language")}</MenuHeader>

          <MenuItem id="en-us">English</MenuItem>
          <MenuItem id="id-id">Indonesia</MenuItem>
        </MenuSection>
      </MenuContent>
    </Menu>
  );
};
