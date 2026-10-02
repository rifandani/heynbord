import { createRoot } from "react-dom/client";

import { Entry } from "@/core/entry";
import { logger } from "@/core/utils/logger";

import "@/core/styles/globals.css";

const root = document.querySelector("#root");
if (!(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got mispelled?"
  );
}
createRoot(root, {
  onCaughtError(error, errorInfo) {
    logger.error("[reactEntry.onCaughtError]", { error, errorInfo });
  },
  onRecoverableError(error, errorInfo) {
    logger.error("[reactEntry.onRecoverableError]", { error, errorInfo });
  },
  onUncaughtError(error, errorInfo) {
    logger.error("[reactEntry.onUncaughtError]", { error, errorInfo });
  },
}).render(<Entry />);
