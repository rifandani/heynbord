import { createFileRoute } from "@tanstack/react-router";

import { LanguageToggle } from "@/core/components/language-toggle";
import { ThemeToggle } from "@/core/components/theme-toggle";
import { useTranslation } from "@/core/providers/i18n/context";
import { buildSeoHead } from "@/core/utils/seo";

const HomeRoute = () => {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto flex flex-col items-center gap-y-2 py-24">
      <h1 className="text-3xl sm:text-4xl">{t("title")}</h1>
      <h2 className="font-mono text-xl sm:text-2xl">{t("welcome")}</h2>

      <div className="flex items-center gap-x-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </div>
  );
};
export const Route = createFileRoute("/")({
  // Public, crawlable page: full SSR, so the HTML carries content and meta.
  ssr: true,
  head: () =>
    buildSeoHead({
      description:
        "Welcome to our React.js application. Explore our modern, feature-rich web platform with theme customization and multi-language support.",
      path: "/",
      title: "Home",
    }),
  component: HomeRoute,
});
