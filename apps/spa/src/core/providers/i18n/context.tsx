import type { ReactNode } from "react";
import { createContext, use, useState } from "react";

import type { LanguageMessages } from "@/core/libs/i18n/init";
import { initI18n } from "@/core/libs/i18n/init";

const TranslationContext = createContext<
  | (ReturnType<typeof initI18n> & {
      setLocale: (locale: string) => void;
      locale: string;
    })
  | null
>(null);
export const TranslationProvider = ({
  defaultLocale,
  translations,
  fallbackLocale,
  children,
}: {
  /** Resolved per request on the server, so SSR and hydration agree. */
  defaultLocale: string;
  translations: Record<Lowercase<string>, LanguageMessages>;
  fallbackLocale: string | string[];
  children: ReactNode;
}) => {
  const [locale, setLocale] = useState(defaultLocale);
  const initValue = initI18n({
    fallbackLocale,
    locale,
    translations,
  });
  const value = {
    ...initValue,
    locale,
    setLocale,
  } as const;
  return <TranslationContext value={value}>{children}</TranslationContext>;
};
export const useTranslation = (): ReturnType<typeof initI18n> & {
  setLocale: (locale: string) => void;
  locale: string;
} => {
  const context = use(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};
