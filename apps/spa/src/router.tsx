import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { createQueryClient } from "@/core/providers/query/client";
import {
  ErrorRoute,
  NotFoundRoute,
  PendingRoute,
} from "@/core/providers/router/fallbacks";
import { logger } from "@/core/utils/logger";

import { routeTree } from "./routeTree.gen";

/**
 * TanStack Start calls this once per server request and once in the browser,
 * so the router and its QueryClient are never shared between requests.
 */
export const getRouter = () => {
  const queryClient = createQueryClient();
  const router = createRouter({
    routeTree,
    defaultOnCatch: (error, errorInfo) => {
      logger.error("[router.onError]", { error, errorInfo });
    },
    defaultNotFoundComponent: NotFoundRoute,
    defaultPendingComponent: PendingRoute,
    defaultErrorComponent: ErrorRoute,
    context: {
      queryClient,
    },
    defaultPreload: "intent",
    // Since we're using React Query, we don't want loader calls to ever be stale
    // This will ensure that the loader is always called when the route is preloaded or visited
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  });
  // Dehydrates queries fetched during SSR into the streamed HTML, hydrates
  // them in the browser, and wraps the app in `QueryClientProvider`.
  setupRouterSsrQueryIntegration({ queryClient, router });
  return router;
};

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
