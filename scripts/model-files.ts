import { readFileSync } from "node:fs";

import type { ModelContract } from "../apps/web/scripts/model-contract.ts";

/**
 * Read a generated model contract record. A missing file is an empty record,
 * so the first pack writes a new one. One read avoids a check-then-read race
 * (CodeQL js/file-system-race).
 */
export const readContracts = (file: string): Record<string, ModelContract> => {
  try {
    // SAFETY: the packers write this file as a JSON object of ModelContract.
    return JSON.parse(readFileSync(file, "utf-8")) as Record<
      string,
      ModelContract
    >;
  } catch (error) {
    // SAFETY: readFileSync throws an ErrnoException with a string code.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }
};

/** Read a raw model, and name the Blender script when the file is absent. */
export const readRawModel = (file: string, hint: string): Uint8Array => {
  try {
    return readFileSync(file);
  } catch (error) {
    // SAFETY: readFileSync throws an ErrnoException with a string code.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`No raw model at ${file}. ${hint}`, { cause: error });
    }
    throw error;
  }
};
