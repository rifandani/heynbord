import { TanStackDevtools } from "@tanstack/react-devtools";
import { useRouter } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { GameDevPanel } from "@/features/dev-panel/components/game-dev-panel";
import { useDevOverridesSync } from "@/features/dev-panel/use-dev-overrides";

export const Devtools = () => {
  // Per-request instance: read it from context, never from a module singleton.
  const router = useRouter();
  // Here, not in the panel: a panel mounts only while its tab is open.
  useDevOverridesSync();
  return (
    <TanStackDevtools
      config={{
        position: "bottom-left",
      }}
      plugins={[
        {
          id: "game-dev-panel",
          name: "Game Dev Panel",
          render: (_el, { theme }) => <GameDevPanel theme={theme} />,
        },
        {
          name: "TanStack Router",
          render: <TanStackRouterDevtoolsPanel router={router} />,
        },
      ]}
    />
  );
};
