import { StartClient } from "@tanstack/react-start/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

import { logger } from "@/core/utils/logger";

// The server renders the whole document, so React hydrates `document` itself.
hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>,
  {
    onCaughtError(error, errorInfo) {
      logger.error("[reactEntry.onCaughtError]", { error, errorInfo });
    },
    onRecoverableError(error, errorInfo) {
      logger.error("[reactEntry.onRecoverableError]", { error, errorInfo });
    },
    onUncaughtError(error, errorInfo) {
      logger.error("[reactEntry.onUncaughtError]", { error, errorInfo });
    },
  }
);
