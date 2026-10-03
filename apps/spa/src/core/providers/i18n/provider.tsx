import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { I18nProvider as AriaI18nProvider } from "react-aria";

import enUS from "@/core/libs/i18n/locales/en-US";
import idID from "@/core/libs/i18n/locales/id-ID";
import {
  TranslationProvider,
  useTranslation,
} from "@/core/providers/i18n/context";

import { DEFAULT_LOCALE } from "./locale";

export const AppTranslationProvider = ({
  children,
  locale,
}: PropsWithChildren<{ locale: string }>) => (
  <TranslationProvider
    defaultLocale={locale}
    fallbackLocale={[DEFAULT_LOCALE]}
    translations={{
      "en-us": enUS,
      "id-id": idID,
    }}
  >
    {children}
  </TranslationProvider>
);
export const AppI18nProvider = ({ children }: PropsWithChildren) => {
  const { locale } = useTranslation();
  // The server renders `<html lang>`; keep it in step when the user switches.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <AriaI18nProvider locale={locale}>{children}</AriaI18nProvider>;
};
declare module "@/core/libs/i18n/my-translations" {
  interface Register {
    translations: typeof enUS;
  }
}
