import { readFile } from "node:fs/promises";
import path from "node:path";

/** A missing file fails the measurement instead of receiving a zero-byte credit. */
export const makePublishedAssetReader =
  (publicRoot: string) => async (url: string) => {
    if (!url.startsWith("/") || url.startsWith("//") || url.includes("..")) {
      throw new Error(`Expected a local published asset URL: ${url}`);
    }
    try {
      return await readFile(path.join(publicRoot, url));
    } catch {
      throw new Error(`Missing required published asset: ${url}`);
    }
  };
