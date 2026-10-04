/** QA hooks are on in development, in E2E builds, and with `?qa` in the URL. */
export const qaEnabled = (): boolean =>
  import.meta.env.DEV ||
  import.meta.env.VITE_E2E === "true" ||
  (typeof location !== "undefined" &&
    new URLSearchParams(location.search).has("qa"));

/** A fixed Battle seed from `seed=<n>` in a URL query, or `null`. */
export const seedFromSearch = (search: string): number | null => {
  const value = Number(new URLSearchParams(search).get("seed"));
  return Number.isInteger(value) && value > 0 ? value : null;
};

/** QA: a fixed Battle seed from `?seed=<n>`, so a bot playtest is reproducible. */
export const qaSeed = (): number | null =>
  qaEnabled() && typeof location !== "undefined"
    ? seedFromSearch(location.search)
    : null;

/** QA: a state to open at once, from `state=<name>` in a URL query, or `null`. */
export const stateFromSearch = (search: string): string | null =>
  new URLSearchParams(search).get("state");
