import type { TextRef } from "@/features/battle/card-text";
import { resolveText } from "@/features/battle/card-text";
import { useTranslation } from "@/features/i18n/use-translation";

type Translate = (
  key: string,
  args?: Record<string, string | number>
) => string;

/**
 * Game text from Translation Keys that come from game data (CRD-08), for
 * example `cards.<cardId>.name`. A content test checks that each such key
 * exists in both Message Catalogs, so the typed `t` is widened here only.
 */
export const useGameText = () => {
  const translation = useTranslation();
  const { t } = translation;
  // SAFETY: game data builds these keys and values, so the typed catalog cannot
  // name them; a content test checks each key in both Message Catalogs.
  const translate: Translate = (key, args) => t(key as never, args as never);
  return {
    ...translation,
    tr: translate,
    text: (ref: TextRef) => resolveText(translate, ref),
  };
};
