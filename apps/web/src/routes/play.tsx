import { createFileRoute } from "@tanstack/react-router";

import { buildSeoHead } from "@/core/utils/seo";
import { PlayScreen } from "@/features/battle/components/play-screen";

export const Route = createFileRoute("/play")({
  // The Battle needs the browser (WebGL, Web Audio). The 3D scene loads in its
  // own chunk from the Play screen.
  ssr: false,
  head: () =>
    buildSeoHead({
      description:
        "Heynbord: play a Battle. Plan your timing, then watch your Units fight in the Lanes.",
      path: "/play",
      title: "Play",
    }),
  component: PlayScreen,
});
