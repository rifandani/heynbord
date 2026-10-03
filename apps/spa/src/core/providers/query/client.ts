import { QueryClient } from "@tanstack/react-query";

/**
 * One client per router. On the server that means one per request, so cached
 * data never leaks between users; in the browser `getRouter` runs once.
 */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // gcTime: 1_000 * 60 * 5, // 5 mins. Defaults to 5 mins
        staleTime: 1000 * 30, // 30 secs. Defaults to 0
        networkMode: "offlineFirst",
      },
    },
  });
