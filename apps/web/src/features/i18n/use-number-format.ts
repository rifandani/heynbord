import { useMemo } from "react";

import { useTranslation } from "@/features/i18n/use-translation";

/** Formats numbers with the grouping rules of the current Locale. */
export const useNumberFormat = () => {
  const { locale } = useTranslation();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  return (value: number) => number.format(value);
};
