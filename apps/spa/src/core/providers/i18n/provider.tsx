import type { PropsWithChildren } from "react";
import { I18nProvider as AriaI18nProvider } from "react-aria";

import enUS from "@/core/libs/i18n/locales/en-US";
import idID from "@/core/libs/i18n/locales/id-ID";
import {
  TranslationProvider,
  useTranslation,
} from "@/core/providers/i18n/context";

export const AppTranslationProvider = ({ children }: PropsWithChildren) => (
  <TranslationProvider
    fallbackLocale={["en-us"]}
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
  return <AriaI18nProvider locale={locale}>{children}</AriaI18nProvider>;
};
declare module "@/core/libs/i18n/my-translations" {
  interface Register {
    translations: typeof enUS;
  }
}
