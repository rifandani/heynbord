import { createFileRoute } from "@tanstack/react-router";

import { LanguageToggle } from "@/core/components/language-toggle";
import { ThemeToggle } from "@/core/components/theme-toggle";
import { useSeo } from "@/core/hooks/use-seo";
import { useTranslation } from "@/core/providers/i18n/context";

const HomeRoute = () => {
  useSeo({
    description:
      "Welcome to our React.js application. Explore our modern, feature-rich web platform with theme customization and multi-language support.",
    title: "Home",
  });
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
  component: HomeRoute,
});
